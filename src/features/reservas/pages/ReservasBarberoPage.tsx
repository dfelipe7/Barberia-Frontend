import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Phone,
  RotateCw,
  Scissors,
  Timer,
  UserRound,
  X,
} from 'lucide-react';
import { useAgendaBarbero, useCompletarReserva, useMarcarReservaNoAsistida } from '../api/reservas.facade';
import type { CitaAgendaBarberoDTO, EstadoReservaDTO } from '../api/reservas.dto';
import Button from '../../../shared/ui/Button';
import BackLink from '../../../shared/ui/BackLink';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import { useToastContext } from '../../../shared/ui/ToastContext';
import { mapApiError } from '../../../shared/lib/mapApiError';
import './ReservasBarberoPage.css';

const estados: Record<EstadoReservaDTO, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
};

const SIN_RESERVAS: CitaAgendaBarberoDTO[] = [];

const OPCIONES_FECHA_DEFAULT: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

const formatearFecha = (valor: string, opciones: Intl.DateTimeFormatOptions = OPCIONES_FECHA_DEFAULT) => {
  const [anio, mes, dia] = valor.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', opciones).format(new Date(anio, mes - 1, dia, 12));
};

const aFechaLocal = (fecha: Date) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const inicioDeSemana = (fecha: Date) => {
  const dia = fecha.getDay();
  const desplazamiento = dia === 0 ? -6 : 1 - dia;
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + desplazamiento);
};

function textoConteoReservasDia(total: number): string {
  if (total === 0) return 'Día libre';
  return `${total} ${total === 1 ? 'cita' : 'citas'}`;
}

const desplazarDias = (fecha: Date, dias: number) =>
  new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);

const formatearHora = (hora: string) => hora.slice(0, 5);

const formatearPrecio = (precio: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(precio);

const formatearDuracion = (minutos: number) => {
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  if (horas === 0) return `${minutosRestantes} min`;
  return minutosRestantes === 0 ? `${horas} h` : `${horas} h ${minutosRestantes} min`;
};

const mensajeErrorAgenda = (error: unknown) => {
  if (!isAxiosError(error)) return 'No pudimos cargar tu agenda. Inténtalo de nuevo.';
  if (!error.response) return 'Revisa tu conexión e inténtalo de nuevo.';
  if (error.response.status === 401 || error.response.status === 403) {
    return 'Tu sesión necesita actualizarse. Cierra sesión e inicia de nuevo para consultar tu agenda.';
  }
  return 'No pudimos cargar tu agenda en este momento. Inténtalo de nuevo en unos minutos.';
};

function TarjetaCita({
  reserva,
  seleccionada,
  onSeleccionar,
}: {
  reserva: CitaAgendaBarberoDTO;
  seleccionada: boolean;
  onSeleccionar: () => void;
}) {
  return (
    <button
      type="button"
      className={`barber-agenda__appointment${seleccionada ? ' is-selected' : ''}`}
      aria-pressed={seleccionada}
      onClick={onSeleccionar}
    >
      <span className="barber-agenda__appointment-time">
        <strong>{formatearHora(reserva.hora)}</strong>
        <span>{formatearHora(reserva.horaFin)}</span>
      </span>
      <span className="barber-agenda__appointment-main">
        <span className="barber-agenda__appointment-service">{reserva.servicio.nombre}</span>
        <span className="barber-agenda__appointment-client">
          <UserRound size={14} aria-hidden="true" />
          {reserva.cliente.nombre} {reserva.cliente.apellido ?? ''}
        </span>
      </span>
      <span className={`barber-agenda__status barber-agenda__status--${reserva.estado.toLowerCase()}`}>
        {estados[reserva.estado]}
      </span>
      <ChevronRight className="barber-agenda__appointment-arrow" size={18} aria-hidden="true" />
    </button>
  );
}

function DetalleReserva({ reserva }: { reserva: CitaAgendaBarberoDTO }) {
  return (
    <div className="barber-agenda__detail card card-surface border-0 shadow-sm">
      <div className="barber-agenda__detail-top">
        <div className="barber-agenda__detail-icon"><Scissors size={20} aria-hidden="true" /></div>
        <span className={`barber-agenda__status barber-agenda__status--${reserva.estado.toLowerCase()}`}>
          {estados[reserva.estado]}
        </span>
      </div>
      <span className="text-eyebrow d-block mb-2">RESUMEN DE LA CITA</span>
      <h2 className="barber-agenda__detail-title">{reserva.servicio.nombre}</h2>
      <p className="barber-agenda__detail-date text-capitalize">{formatearFecha(reserva.fecha)}</p>

      <div className="barber-agenda__client-card">
        <div className="barber-agenda__client-avatar"><UserRound size={19} aria-hidden="true" /></div>
        <div className="min-w-0">
          <span className="barber-agenda__detail-label">CLIENTE</span>
          <p className="fw-semibold mb-0 text-truncate">{reserva.cliente.nombre} {reserva.cliente.apellido ?? ''}</p>
        </div>
        {reserva.cliente.telefono && (
          <a
            className="barber-agenda__call-link"
            href={`tel:${reserva.cliente.telefono}`}
            aria-label={`Llamar a ${reserva.cliente.nombre}`}
          >
            <Phone size={17} aria-hidden="true" />
          </a>
        )}
      </div>

      <dl className="barber-agenda__detail-grid mb-0">
        <div>
          <dt><Clock3 size={15} aria-hidden="true" /> HORARIO</dt>
          <dd>{formatearHora(reserva.hora)} – {formatearHora(reserva.horaFin)}</dd>
        </div>
        <div>
          <dt><Timer size={15} aria-hidden="true" /> DURACIÓN</dt>
          <dd>{formatearDuracion(reserva.servicio.duracionMinutos)}</dd>
        </div>
        <div className="barber-agenda__detail-price">
          <dt>VALOR DEL SERVICIO</dt>
          <dd>{formatearPrecio(reserva.precio)}</dd>
        </div>
      </dl>
    </div>
  );
}

function PanelContenidoDetalle({
  reserva,
  errorAccion,
  mensajeAccion,
  completarReservaPending,
  marcarNoAsistidaPending,
  onEjecutarAccion,
}: {
  reserva: CitaAgendaBarberoDTO;
  errorAccion: string | null;
  mensajeAccion: string | null;
  completarReservaPending: boolean;
  marcarNoAsistidaPending: boolean;
  onEjecutarAccion: (accion: 'completar' | 'no-asistio') => void;
}) {
  return (
    <>
      <DetalleReserva reserva={reserva} />
      {errorAccion && <div className="alert alert-warning mt-3" role="alert">{errorAccion}</div>}
      {mensajeAccion && <output className="alert alert-success mt-3 d-block">{mensajeAccion}</output>}
      {reserva.estado !== 'COMPLETED' &&
        reserva.estado !== 'CANCELLED' &&
        reserva.estado !== 'NO_SHOW' && (
        <div className="barber-agenda__detail-actions card-surface">
          <p>Actualiza el estado cuando termine la cita o si el cliente no llega.</p>
          <div className="barber-agenda__detail-actions-grid">
            <Button
              type="button"
              variant="primary"
              isLoading={completarReservaPending}
              disabled={marcarNoAsistidaPending}
              onClick={() => onEjecutarAccion('completar')}
            >
              Marcar completada
            </Button>
            {(reserva.estado === 'PENDING' || reserva.estado === 'CONFIRMED') && (
              <Button
                type="button"
                variant="outline-secondary"
                isLoading={marcarNoAsistidaPending}
                disabled={completarReservaPending}
                onClick={() => onEjecutarAccion('no-asistio')}
              >
                Marcar no asistió
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CargandoAgenda() {
  return (
    <output className="barber-agenda__loading d-block" aria-label="Cargando agenda">
      {[0, 1, 2].map((item) => (
        <div key={item} className="barber-agenda__skeleton card-surface">
          <span className="barber-agenda__skeleton-line barber-agenda__skeleton-line--short" />
          <span className="barber-agenda__skeleton-line" />
          <span className="barber-agenda__skeleton-line barber-agenda__skeleton-line--medium" />
        </div>
      ))}
      <span className="visually-hidden">Cargando tu agenda semanal...</span>
    </output>
  );
}

export default function ReservasBarberoPage() {
  const confirm = useConfirm();
  const { showToast } = useToastContext();
  const [semana, setSemana] = useState(() => inicioDeSemana(new Date()));
  const [reservaSeleccionadaId, setReservaSeleccionadaId] = useState<number | null>(null);
  const desde = aFechaLocal(semana);
  const hasta = aFechaLocal(desplazarDias(semana, 6));
  const consulta = useAgendaBarbero(desde, hasta);
  const completarReserva = useCompletarReserva();
  const marcarNoAsistida = useMarcarReservaNoAsistida();
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [mensajeAccion, setMensajeAccion] = useState<string | null>(null);
  const reservas = consulta.data?.reservas ?? SIN_RESERVAS;
  const reservaSeleccionada = reservas.find((reserva) => reserva.id === reservaSeleccionadaId) ?? null;

  useEffect(() => {
    if (!reservaSeleccionadaId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setReservaSeleccionadaId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // En pantallas móviles (< 992px), bloquea el scroll de fondo mientras el Bottom Sheet está abierto
    const esMovil = window.innerWidth < 992;
    if (esMovil) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [reservaSeleccionadaId]);

  const dias = useMemo(() => Array.from({ length: 7 }, (_, indice) => {
    const fecha = aFechaLocal(desplazarDias(semana, indice));
    return {
      fecha,
      titulo: formatearFecha(fecha),
      reservas: reservas.filter((reserva) => reserva.fecha === fecha),
    };
  }), [reservas, semana]);

  const citasPendientes = reservas.filter((reserva) =>
    reserva.estado === 'PENDING' || reserva.estado === 'CONFIRMED' || reserva.estado === 'IN_PROGRESS',
  ).length;
  const minutosAgendados = reservas.reduce((total, reserva) => total + reserva.servicio.duracionMinutos, 0);

  const cambiarSemana = (cantidad: number) => {
    setSemana((actual) => desplazarDias(actual, cantidad * 7));
    setReservaSeleccionadaId(null);
  };

  const irAEstaSemana = () => {
    setSemana(inicioDeSemana(new Date()));
    setReservaSeleccionadaId(null);
  };

  const ejecutarAccionReserva = async (accion: 'completar' | 'no-asistio') => {
    if (!reservaSeleccionada) return;

    const esCompletar = accion === 'completar';
    const confirmado = await confirm({
      title: esCompletar ? 'Completar cita' : 'Marcar inasistencia',
      message: (
        <div>
          <p className="mb-2">
            {esCompletar
              ? '¿Confirmas que el servicio de esta cita ya fue realizado?'
              : '¿Confirmas que el cliente no asistió a esta cita agendada?'}
          </p>
          <div
            className="p-3 rounded mb-2 border"
            style={{
              backgroundColor: 'var(--surface-app-bg)',
              borderColor: 'var(--surface-card-border)',
            }}
          >
            <div className="fw-bold text-surface-primary mb-1">
              {reservaSeleccionada.servicio.nombre}
            </div>
            <div className="small text-surface-muted d-flex align-items-center gap-1 mb-1">
              <UserRound size={14} aria-hidden="true" /> Cliente: <strong>{reservaSeleccionada.cliente.nombre}</strong>
            </div>
            <div className="small text-surface-muted d-flex align-items-center gap-1">
              <Clock3 size={14} aria-hidden="true" /> Horario: {reservaSeleccionada.hora} ({reservaSeleccionada.servicio.duracionMinutos} min)
            </div>
          </div>
          {!esCompletar && (
            <p className="small text-warning mb-0">
              Esta acción marcará la cita como <strong>No asistió</strong> y liberará el registro del barbero.
            </p>
          )}
        </div>
      ),
      confirmLabel: esCompletar ? 'Sí, completar' : 'Sí, marcar no asistió',
      cancelLabel: 'Volver',
      variant: esCompletar ? 'primary' : 'warning',
    });

    if (!confirmado) return;

    setErrorAccion(null);
    setMensajeAccion(null);
    try {
      const resultado = accion === 'completar'
        ? await completarReserva.mutateAsync(reservaSeleccionada.id)
        : await marcarNoAsistida.mutateAsync(reservaSeleccionada.id);
      setMensajeAccion(resultado.mensaje);
      showToast('success', resultado.mensaje);
      await consulta.refetch();
    } catch (error: unknown) {
      const mensaje = mapApiError(error);
      setErrorAccion(mensaje);
      showToast('danger', mensaje);
    }
  };

  return (
    <main className="barber-agenda container-fluid p-3 p-md-4">
      <div className="barber-agenda__inner">
        <header className="barber-agenda__header">
          <div className="barber-agenda__heading">
            <span className="barber-agenda__eyebrow"><CalendarDays size={14} aria-hidden="true" /> AGENDA PERSONAL</span>
            <h1>Tu semana en foco</h1>
            <p>Organiza tus citas y ten a mano la información de cada cliente.</p>
          </div>
          <div className="barber-agenda__header-actions">
            <BackLink to="/dashboard">Volver al panel</BackLink>
            <Link className="btn btn-primary d-inline-flex align-items-center gap-2" to="/horarios">
              <Clock3 size={16} aria-hidden="true" /> Mi horario
            </Link>
          </div>
        </header>

        <section className="barber-agenda__summary" aria-label="Resumen de la semana">
          <article className="barber-agenda__metric card-surface">
            <span className="barber-agenda__metric-icon"><CalendarDays size={18} aria-hidden="true" /></span>
            <div><p>Citas en la semana</p><strong>{consulta.isLoading || consulta.isError ? '—' : reservas.length}</strong></div>
          </article>
          <article className="barber-agenda__metric card-surface">
            <span className="barber-agenda__metric-icon barber-agenda__metric-icon--warm"><CheckCircle2 size={18} aria-hidden="true" /></span>
            <div><p>Por atender</p><strong>{consulta.isLoading || consulta.isError ? '—' : citasPendientes}</strong></div>
          </article>
          <article className="barber-agenda__metric card-surface">
            <span className="barber-agenda__metric-icon barber-agenda__metric-icon--neutral"><Timer size={18} aria-hidden="true" /></span>
            <div><p>Tiempo reservado</p><strong>{consulta.isLoading || consulta.isError ? '—' : formatearDuracion(minutosAgendados)}</strong></div>
          </article>
        </section>

        <section className="barber-agenda__weekbar card-surface" aria-label="Navegación semanal">
          <div className="barber-agenda__week-label">
            <span className="barber-agenda__week-icon"><CalendarDays size={19} aria-hidden="true" /></span>
            <div>
              <span className="barber-agenda__detail-label">SEMANA DEL</span>
              <p className="mb-0 text-capitalize">
                {formatearFecha(desde, { day: 'numeric', month: 'long' })} – {formatearFecha(hasta, { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="barber-agenda__week-actions">
            <Button type="button" size="sm" variant="outline-secondary" aria-label="Semana anterior" onClick={() => cambiarSemana(-1)} icon={<ChevronLeft size={16} />} />
            <Button type="button" size="sm" variant="outline-secondary" onClick={irAEstaSemana}>Esta semana</Button>
            <Button type="button" size="sm" variant="outline-secondary" aria-label="Semana siguiente" onClick={() => cambiarSemana(1)} icon={<ChevronRight size={16} />} />
          </div>
        </section>

        {consulta.isLoading && <CargandoAgenda />}
        {consulta.isError && (
          <section className="barber-agenda__feedback card-surface" role="alert">
            <span className="barber-agenda__feedback-icon"><RotateCw size={19} aria-hidden="true" /></span>
            <div className="flex-grow-1">
              <h2>No pudimos cargar tu agenda</h2>
              <p>{mensajeErrorAgenda(consulta.error)}</p>
            </div>
            <Button type="button" variant="outline-primary" onClick={() => void consulta.refetch()} isLoading={consulta.isFetching} loadingText="Cargando..." icon={<RotateCw size={15} />}>
              Intentar de nuevo
            </Button>
          </section>
        )}
        {!consulta.isLoading && !consulta.isError && reservas.length === 0 && (
          <section className="barber-agenda__empty card-surface">
            <span className="barber-agenda__empty-icon"><CalendarDays size={26} aria-hidden="true" /></span>
            <span className="barber-agenda__eyebrow">SEMANA TRANQUILA</span>
            <h2>No hay citas para estas fechas</h2>
            <p>Cuando tengas nuevas reservas, las verás organizadas aquí por día y hora.</p>
            <Button type="button" variant="outline-primary" onClick={() => void consulta.refetch()} isLoading={consulta.isFetching} icon={<RotateCw size={15} />}>
              Actualizar agenda
            </Button>
          </section>
        )}
        {!consulta.isLoading && !consulta.isError && reservas.length > 0 && (
          <div className="barber-agenda__content">
            <section className="barber-agenda__days" aria-label="Citas de la semana">
              <div className="barber-agenda__section-heading">
                <div><span className="barber-agenda__eyebrow">PLANIFICACIÓN</span><h2>Agenda de la semana</h2></div>
                <span>{reservas.length} {reservas.length === 1 ? 'cita' : 'citas'}</span>
              </div>
              {dias.map((dia) => (
                <section key={dia.fecha} className={`barber-agenda__day${dia.reservas.length ? ' has-appointments' : ''}`} aria-label={dia.titulo}>
                  <div className="barber-agenda__day-heading">
                    <div className="barber-agenda__day-date">
                      <span>{formatearFecha(dia.fecha, { weekday: 'short' })}</span>
                      <strong>{formatearFecha(dia.fecha, { day: '2-digit' })}</strong>
                    </div>
                    <div className="barber-agenda__day-name">
                      <h3 className="text-capitalize">{dia.titulo}</h3>
                      <span>{textoConteoReservasDia(dia.reservas.length)}</span>
                    </div>
                  </div>
                  <div className="barber-agenda__day-list">
                    {dia.reservas.length === 0 ? (
                      <p className="barber-agenda__day-empty">Sin citas programadas</p>
                    ) : dia.reservas.map((reserva) => (
                      <TarjetaCita
                        key={reserva.id}
                        reserva={reserva}
                        seleccionada={reservaSeleccionadaId === reserva.id}
                        onSeleccionar={() => setReservaSeleccionadaId((actual) => actual === reserva.id ? null : reserva.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </section>

            <aside className="barber-agenda__details" aria-label="Detalle de la cita seleccionada">
              <div className="barber-agenda__details-sticky">
                {reservaSeleccionada ? (
                  <PanelContenidoDetalle
                    reserva={reservaSeleccionada}
                    errorAccion={errorAccion}
                    mensajeAccion={mensajeAccion}
                    completarReservaPending={completarReserva.isPending}
                    marcarNoAsistidaPending={marcarNoAsistida.isPending}
                    onEjecutarAccion={(accion) => void ejecutarAccionReserva(accion)}
                  />
                ) : (
                  <div className="barber-agenda__detail-placeholder card-surface">
                    <span><Scissors size={22} aria-hidden="true" /></span>
                    <h2>Detalles de la cita</h2>
                    <p>Selecciona una cita para consultar la información completa del servicio y del cliente.</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {/* Modal Bottom Sheet exclusivo para pantallas móviles / tablets (< 992px) */}
        {reservaSeleccionada && (
          <div
            className="barber-agenda__mobile-sheet-overlay"
            aria-modal="true"
            aria-label="Detalle de cita"
          >
            <button
              type="button"
              className="border-0 bg-transparent"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'default' }}
              onClick={() => setReservaSeleccionadaId(null)}
              aria-label="Cerrar modal al hacer clic afuera"
            />
            <div
              className="barber-agenda__mobile-sheet-content position-relative"
              style={{ zIndex: 1 }}
            >
              <div className="barber-agenda__mobile-sheet-header">
                <div className="barber-agenda__mobile-sheet-drag-handle" aria-hidden="true" />
                <button
                  type="button"
                  className="barber-agenda__mobile-sheet-close"
                  onClick={() => setReservaSeleccionadaId(null)}
                  aria-label="Cerrar detalle"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="barber-agenda__mobile-sheet-body">
                <PanelContenidoDetalle
                  reserva={reservaSeleccionada}
                  errorAccion={errorAccion}
                  mensajeAccion={mensajeAccion}
                  completarReservaPending={completarReserva.isPending}
                  marcarNoAsistidaPending={marcarNoAsistida.isPending}
                  onEjecutarAccion={(accion) => void ejecutarAccionReserva(accion)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
