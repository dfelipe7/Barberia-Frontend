import { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useAgendaBarbero, useCompletarReserva, useMarcarReservaNoAsistida } from '../api/reservas.facade';
import type { CitaAgendaBarberoDTO, EstadoReservaDTO } from '../api/reservas.dto';
import Button from '../../../shared/ui/Button';
import BackLink from '../../../shared/ui/BackLink';
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

const formatearFecha = (valor: string, opciones: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}) => {
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

function CargandoAgenda() {
  return (
    <div className="barber-agenda__loading" role="status" aria-label="Cargando agenda">
      {[0, 1, 2].map((item) => (
        <div key={item} className="barber-agenda__skeleton card-surface">
          <span className="barber-agenda__skeleton-line barber-agenda__skeleton-line--short" />
          <span className="barber-agenda__skeleton-line" />
          <span className="barber-agenda__skeleton-line barber-agenda__skeleton-line--medium" />
        </div>
      ))}
      <span className="visually-hidden">Cargando tu agenda semanal...</span>
    </div>
  );
}

export default function ReservasBarberoPage() {
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
    const mensajeConfirmacion = accion === 'completar'
      ? '¿Confirmas que el servicio de esta cita ya fue realizado?'
      : '¿Confirmas que el cliente no asistió a esta cita?';
    if (!window.confirm(mensajeConfirmacion)) return;

    setErrorAccion(null);
    setMensajeAccion(null);
    try {
      const resultado = accion === 'completar'
        ? await completarReserva.mutateAsync(reservaSeleccionada.id)
        : await marcarNoAsistida.mutateAsync(reservaSeleccionada.id);
      setMensajeAccion(resultado.mensaje);
      await consulta.refetch();
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setErrorAccion(accion === 'completar'
          ? 'La cita debe haber terminado para poder marcarla como completada.'
          : 'Aún no se cumple el tiempo de espera para marcar que el cliente no asistió.');
      } else {
        setErrorAccion(mapApiError(error));
      }
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

        {consulta.isLoading ? (
          <CargandoAgenda />
        ) : consulta.isError ? (
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
        ) : reservas.length === 0 ? (
          <section className="barber-agenda__empty card-surface">
            <span className="barber-agenda__empty-icon"><CalendarDays size={26} aria-hidden="true" /></span>
            <span className="barber-agenda__eyebrow">SEMANA TRANQUILA</span>
            <h2>No hay citas para estas fechas</h2>
            <p>Cuando tengas nuevas reservas, las verás organizadas aquí por día y hora.</p>
            <Button type="button" variant="outline-primary" onClick={() => void consulta.refetch()} isLoading={consulta.isFetching} icon={<RotateCw size={15} />}>
              Actualizar agenda
            </Button>
          </section>
        ) : (
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
                      <span>{dia.reservas.length ? `${dia.reservas.length} ${dia.reservas.length === 1 ? 'cita' : 'citas'}` : 'Día libre'}</span>
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
              {reservaSeleccionada ? (
                <>
                  <DetalleReserva reserva={reservaSeleccionada} />
                  {errorAccion && <div className="alert alert-warning mt-3" role="alert">{errorAccion}</div>}
                  {mensajeAccion && <div className="alert alert-success mt-3" role="status">{mensajeAccion}</div>}
                  {reservaSeleccionada.estado !== 'COMPLETED' &&
                    reservaSeleccionada.estado !== 'CANCELLED' &&
                    reservaSeleccionada.estado !== 'NO_SHOW' && (
                    <div className="barber-agenda__detail-actions card-surface">
                      <p>Actualiza el estado cuando termine la cita o si el cliente no llega.</p>
                      <div className="d-flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          isLoading={completarReserva.isPending}
                          disabled={marcarNoAsistida.isPending}
                          onClick={() => void ejecutarAccionReserva('completar')}
                        >
                          Marcar completada
                        </Button>
                        {(reservaSeleccionada.estado === 'PENDING' || reservaSeleccionada.estado === 'CONFIRMED') && (
                          <Button
                            type="button"
                            variant="outline-secondary"
                            isLoading={marcarNoAsistida.isPending}
                            disabled={completarReserva.isPending}
                            onClick={() => void ejecutarAccionReserva('no-asistio')}
                          >
                            Marcar no asistió
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="barber-agenda__detail-placeholder card-surface">
                  <span><Scissors size={22} aria-hidden="true" /></span>
                  <h2>Detalles de la cita</h2>
                  <p>Selecciona una cita para consultar la información completa del servicio y del cliente.</p>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
