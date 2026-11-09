import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Phone,
  RotateCcw,
  RotateCw,
  Scissors,
  Timer,
  UserRound,
  UserX,
  X,
} from 'lucide-react';
import type {
  EstadoReservaDTO,
  FiltroReservasAdministrativasDTO,
  ReservaAdministrativaDTO,
} from '../api/reservas.dto';
import {
  useCancelarReservaAdministrativa,
  useCompletarReserva,
  useDetalleReservaAdministrativa,
  useDisponibilidadReserva,
  useMarcarReservaNoAsistida,
  useModificarReservaAdministrativa,
  useReservasAdministrativas,
} from '../api/reservas.facade';
import { useBarberosCatalogo } from '../../barberos/api/barberos.facade';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import BackLink from '../../../shared/ui/BackLink';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import { useToastContext } from '../../../shared/ui/ToastContext';
import './ReservasAdministrativasPage.css';

const estados: Record<EstadoReservaDTO, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
};

const hoyISO = (fecha = new Date()) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return anio + '-' + mes + '-' + dia;
};

const fechaEnNDias = (dias: number) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return hoyISO(fecha);
};

const fechaEnTreintaDias = () => fechaEnNDias(30);

const precioCOP = (precio: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precio);

const formatearDuracion = (minutos: number) => {
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  if (horas === 0) return `${minutosRestantes} min`;
  return minutosRestantes === 0 ? `${horas} h` : `${horas} h ${minutosRestantes} min`;
};

const fechaLegible = (fecha: string) => {
  const partes = fecha.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(partes[0], partes[1] - 1, partes[2], 12));
};

function EditorFechaReserva({
  reserva,
  onCancelar,
  onGuardar,
  guardando,
}: {
  reserva: ReservaAdministrativaDTO;
  onCancelar: () => void;
  onGuardar: (fecha: string, hora: string) => void;
  guardando: boolean;
}) {
  const [fecha, setFecha] = useState(reserva.fecha);
  const [hora, setHora] = useState<string | null>(null);
  const disponibilidad = useDisponibilidadReserva(fecha ? {
    servicioId: reserva.servicio.id,
    barberoId: reserva.barbero.id,
    fecha,
  } : undefined);
  const horas = disponibilidad.data?.slots.filter((slot) => slot.available) ?? [];

  return (
    <div className="border rounded-3 p-3 mt-3">
      <h3 className="h6 fw-bold">Cambiar fecha u hora</h3>
      <p className="small text-surface-muted">Se conserva el servicio y el barbero actual.</p>
      <label className="form-label small fw-semibold" htmlFor="fecha-cambio-reserva">Nueva fecha</label>
      <input
        id="fecha-cambio-reserva"
        type="date"
        className="form-control mb-3"
        min={hoyISO()}
        max={fechaEnTreintaDias()}
        value={fecha}
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.();
          } catch {
            // Fallback para navegadores antiguos
          }
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape') {
            e.preventDefault();
          }
        }}
        onChange={(event) => {
          setFecha(event.target.value);
          setHora(null);
        }}
      />

      {!fecha ? (
        <p className="small text-surface-muted">Selecciona una fecha para consultar horarios.</p>
      ) : disponibilidad.isLoading ? (
        <p className="small text-surface-muted" role="status">Consultando horarios...</p>
      ) : disponibilidad.isError ? (
        <div>
          <ErrorMessage message={mapApiError(disponibilidad.error)} />
          <Button type="button" size="sm" variant="outline-secondary" onClick={() => void disponibilidad.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : horas.length === 0 ? (
        <p className="small text-surface-muted">No hay horarios libres para ese día.</p>
      ) : (
        <div className="d-flex flex-wrap gap-2 mb-3" aria-label="Horarios libres">
          {horas.map((slot) => (
            <button
              key={slot.startTime}
              type="button"
              className={'btn ' + (hora === slot.startTime ? 'btn-primary' : 'btn-outline-primary')}
              aria-pressed={hora === slot.startTime}
              onClick={() => setHora(slot.startTime)}
            >
              {slot.startTime}–{slot.endTime}
            </button>
          ))}
        </div>
      )}

      <div className="d-flex flex-wrap justify-content-end gap-2">
        <Button type="button" variant="outline-secondary" onClick={onCancelar}>Volver</Button>
        <Button
          type="button"
          disabled={!fecha || !hora}
          isLoading={guardando}
          loadingText="Guardando..."
          onClick={() => hora && onGuardar(fecha, hora)}
        >
          Guardar cambio
        </Button>
      </div>
    </div>
  );
}

function DetalleReservaAdmin({
  reserva,
  onCerrar,
}: {
  reserva: ReservaAdministrativaDTO;
  onCerrar?: () => void;
}) {
  return (
    <div className="reservations-admin__detail card card-surface border-0 shadow-sm">
      <div className="reservations-admin__detail-top">
        <div className="reservations-admin__detail-icon">
          <Scissors size={20} aria-hidden="true" />
        </div>
        <div className="d-flex align-items-center gap-2 me-1">
          <span className={`reservations-admin__status reservations-admin__status--${reserva.estado.toLowerCase()}`}>
            {estados[reserva.estado]}
          </span>
          {onCerrar && (
            <button
              type="button"
              className="reservations-admin__detail-close-btn"
              onClick={onCerrar}
              aria-label="Cerrar detalle"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <span className="text-eyebrow d-block mb-1">RESERVA #{reserva.id}</span>
      <h2 className="reservations-admin__detail-title">{reserva.servicio.nombre}</h2>
      <p className="reservations-admin__detail-date text-capitalize">
        {fechaLegible(reserva.fecha)}
      </p>

      {/* Tarjeta de Cliente */}
      <div className="reservations-admin__person-card">
        <div className="reservations-admin__person-avatar">
          <UserRound size={19} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-grow-1">
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="reservations-admin__detail-label">CLIENTE</span>
            <span className="reservations-admin__account-badge">
              {reserva.cliente.esRegistrado ? 'Registrado' : 'Invitado'}
            </span>
          </div>
          <p className="fw-semibold mb-0 text-truncate">
            {reserva.cliente.nombre} {reserva.cliente.apellido ?? ''}
          </p>
          {reserva.cliente.email && (
            <small className="text-surface-muted d-block text-truncate">
              {reserva.cliente.email}
            </small>
          )}
        </div>
        {reserva.cliente.telefono && (
          <a
            className="reservations-admin__call-link"
            href={`tel:${reserva.cliente.telefono}`}
            aria-label={`Llamar a ${reserva.cliente.nombre}`}
            title={`Llamar a ${reserva.cliente.nombre}`}
          >
            <Phone size={17} aria-hidden="true" />
          </a>
        )}
      </div>

      {/* Tarjeta de Barbero */}
      <div className="reservations-admin__person-card">
        <div className="reservations-admin__person-avatar reservations-admin__person-avatar--barber">
          <Scissors size={18} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-grow-1">
          <span className="reservations-admin__detail-label">BARBERO ASIGNADO</span>
          <p className="fw-semibold mb-0 text-truncate">
            {reserva.barbero.nombre} {reserva.barbero.apellido}
          </p>
        </div>
      </div>

      {/* Grid de Horario, Duración y Precio */}
      <dl className="reservations-admin__detail-grid mb-0">
        <div>
          <dt><Clock3 size={15} aria-hidden="true" /> HORARIO</dt>
          <dd>{reserva.hora.slice(0, 5)} – {reserva.horaFin ? reserva.horaFin.slice(0, 5) : '—'}</dd>
        </div>
        <div>
          <dt><Timer size={15} aria-hidden="true" /> DURACIÓN</dt>
          <dd>{formatearDuracion(reserva.servicio.duracionMinutos)}</dd>
        </div>
        <div className="reservations-admin__detail-price">
          <dt>VALOR DEL SERVICIO</dt>
          <dd>{precioCOP(reserva.precio)}</dd>
        </div>
      </dl>
    </div>
  );
}

function PanelContenidoDetalleAdmin({
  reserva,
  editando,
  estadoFinal,
  mensajeAccion,
  errorAccion,
  completarPending,
  marcarNoAsistidaPending,
  cancelarPending,
  modificarPending,
  onEjecutarAccion,
  onIniciarEdicion,
  onCancelarEdicion,
  onGuardarCambio,
  onCancelarReserva,
  onCerrar,
}: {
  reserva: ReservaAdministrativaDTO;
  editando: boolean;
  estadoFinal: boolean;
  mensajeAccion: string | null;
  errorAccion: string | null;
  completarPending: boolean;
  marcarNoAsistidaPending: boolean;
  cancelarPending: boolean;
  modificarPending: boolean;
  onEjecutarAccion: (accion: 'completar' | 'no-asistio') => void;
  onIniciarEdicion: () => void;
  onCancelarEdicion: () => void;
  onGuardarCambio: (fecha: string, hora: string) => void;
  onCancelarReserva: () => void;
  onCerrar?: () => void;
}) {
  return (
    <>
      <DetalleReservaAdmin reserva={reserva} onCerrar={onCerrar} />

      {mensajeAccion && (
        <div className="alert alert-success mt-3" role="status">
          {mensajeAccion}
        </div>
      )}
      {errorAccion && (
        <div className="alert alert-warning mt-3" role="alert">
          {errorAccion}
        </div>
      )}

      {editando && !estadoFinal ? (
        <EditorFechaReserva
          key={reserva.id + ':' + reserva.fecha}
          reserva={reserva}
          onCancelar={onCancelarEdicion}
          onGuardar={onGuardarCambio}
          guardando={modificarPending}
        />
      ) : (
        !estadoFinal && (
          <div className="reservations-admin__detail-actions mt-3">
            <p className="small text-surface-muted mb-2">Acciones para esta cita:</p>
            <div className="d-flex flex-column gap-2">
              <div className="d-flex flex-column flex-sm-row gap-2">
                <Button
                  type="button"
                  variant="primary"
                  isLoading={completarPending}
                  disabled={marcarNoAsistidaPending || cancelarPending}
                  onClick={() => onEjecutarAccion('completar')}
                  icon={<CheckCircle2 size={15} />}
                  className="w-100 flex-sm-fill justify-content-center text-center"
                >
                  Marcar completada
                </Button>
                {(reserva.estado === 'PENDING' || reserva.estado === 'CONFIRMED') && (
                  <Button
                    type="button"
                    variant="outline-secondary"
                    isLoading={marcarNoAsistidaPending}
                    disabled={completarPending || cancelarPending}
                    onClick={() => onEjecutarAccion('no-asistio')}
                    icon={<UserX size={15} />}
                    className="w-100 flex-sm-fill justify-content-center text-center"
                  >
                    No asistió
                  </Button>
                )}
              </div>
              {reserva.estado !== 'IN_PROGRESS' && (
                <div className="d-flex flex-column flex-sm-row gap-2">
                  <Button
                    type="button"
                    variant="outline-primary"
                    onClick={onIniciarEdicion}
                    icon={<Clock3 size={15} />}
                    disabled={completarPending || marcarNoAsistidaPending || cancelarPending}
                    className="w-100 flex-sm-fill justify-content-center text-center"
                  >
                    Reprogramar
                  </Button>
                  <Button
                    type="button"
                    variant="outline-danger"
                    isLoading={cancelarPending}
                    disabled={completarPending || marcarNoAsistidaPending}
                    onClick={onCancelarReserva}
                    className="w-100 flex-sm-fill justify-content-center text-center"
                  >
                    Cancelar reserva
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </>
  );
}

export default function ReservasAdministrativasPage() {
  const confirm = useConfirm();
  const { showToast } = useToastContext();
  const { data: listaBarberos = [] } = useBarberosCatalogo();

  const barberosOrdenados = useMemo(
    () => [...listaBarberos].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [listaBarberos]
  );

  const fechaHoy = useMemo(() => hoyISO(), []);
  const fechaSemana = useMemo(() => fechaEnNDias(6), []);
  const fechaMes = useMemo(() => fechaEnNDias(30), []);

  const [desde, setDesde] = useState(fechaHoy);
  const [hasta, setHasta] = useState(fechaSemana);
  const [estado, setEstado] = useState<EstadoReservaDTO | ''>('');
  const [barberoId, setBarberoId] = useState('');
  const [filtroAplicado, setFiltroAplicado] = useState<FiltroReservasAdministrativasDTO>({
    desde: fechaHoy,
    hasta: fechaSemana,
  });
  const [reservaSeleccionadaId, setReservaSeleccionadaId] = useState<number | null>(null);
  const [editando, setEditando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [mensajeAccion, setMensajeAccion] = useState<string | null>(null);
  const [diasColapsados, setDiasColapsados] = useState<Set<string>>(new Set());

  const toggleDia = (fecha: string) => {
    setDiasColapsados((prev) => {
      const next = new Set(prev);
      if (next.has(fecha)) {
        next.delete(fecha);
      } else {
        next.add(fecha);
      }
      return next;
    });
  };

  const listado = useReservasAdministrativas(filtroAplicado);
  const detalle = useDetalleReservaAdministrativa(reservaSeleccionadaId);
  const cancelarReserva = useCancelarReservaAdministrativa();
  const modificarReserva = useModificarReservaAdministrativa();
  const completarReserva = useCompletarReserva();
  const marcarNoAsistida = useMarcarReservaNoAsistida();
  const reservas = listado.data ?? [];
  const reservaEnLista = useMemo(
    () => reservas.find((r) => r.id === reservaSeleccionadaId) ?? null,
    [reservas, reservaSeleccionadaId]
  );
  const reservaActiva = detalle.data ?? reservaEnLista;

  const diasAgrupados = useMemo(() => {
    if (!reservas.length) return [];

    const mapa = new Map<string, ReservaAdministrativaDTO[]>();
    for (const r of reservas) {
      const lista = mapa.get(r.fecha);
      if (lista) {
        lista.push(r);
      } else {
        mapa.set(r.fecha, [r]);
      }
    }

    const fechasOrdenadas = Array.from(mapa.keys()).sort((a, b) => a.localeCompare(b));

    return fechasOrdenadas.map((fecha) => {
      const [anio, mes, dia] = fecha.split('-').map(Number);
      const fechaObj = new Date(anio, mes - 1, dia, 12);
      const diaSemana = new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(fechaObj);
      const diaNumero = new Intl.DateTimeFormat('es-CO', { day: '2-digit' }).format(fechaObj);
      const esMismoAnio = fechaObj.getFullYear() === new Date().getFullYear();
      const tituloBruto = new Intl.DateTimeFormat('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        ...(esMismoAnio ? {} : { year: 'numeric' }),
      }).format(fechaObj);
      const tituloCompleto = tituloBruto.charAt(0).toUpperCase() + tituloBruto.slice(1);

      const citas = [...mapa.get(fecha)!].sort((a, b) => a.hora.localeCompare(b.hora));

      return {
        fecha,
        diaSemana,
        diaNumero,
        tituloCompleto,
        citas,
      };
    });
  }, [reservas]);

  const filtroInvalido =
    !desde ||
    !hasta ||
    desde > hasta ||
    (barberoId !== '' && (
      !Number.isSafeInteger(Number(barberoId)) || Number(barberoId) < 1 || Number(barberoId) > 2_147_483_647
    ));

  const rango = useMemo(() => {
    if (!filtroAplicado.desde && !filtroAplicado.hasta) return 'Todas las fechas';
    if (filtroAplicado.desde && filtroAplicado.hasta) {
      if (filtroAplicado.desde === filtroAplicado.hasta) {
        return fechaLegible(filtroAplicado.desde);
      }
      return fechaLegible(filtroAplicado.desde) + ' – ' + fechaLegible(filtroAplicado.hasta);
    }
    return filtroAplicado.desde ? 'Desde ' + fechaLegible(filtroAplicado.desde) : 'Hasta ' + fechaLegible(filtroAplicado.hasta!);
  }, [filtroAplicado]);

  const barberoSeleccionadoNombre = useMemo(() => {
    if (!filtroAplicado.barberoId) return null;
    const b = listaBarberos.find((barbero) => barbero.id === filtroAplicado.barberoId);
    return b ? `${b.nombre} ${b.apellido}` : `Barbero #${filtroAplicado.barberoId}`;
  }, [filtroAplicado.barberoId, listaBarberos]);

  const presetActivo = useMemo(() => {
    if (desde === fechaHoy && hasta === fechaHoy) return 'hoy';
    if (desde === fechaHoy && hasta === fechaSemana) return 'semana';
    if (desde === fechaHoy && hasta === fechaMes) return 'mes';
    return null;
  }, [desde, hasta, fechaHoy, fechaSemana, fechaMes]);

  const hayFiltrosModificados =
    desde !== fechaHoy ||
    hasta !== fechaSemana ||
    estado !== '' ||
    barberoId !== '' ||
    filtroAplicado.desde !== fechaHoy ||
    filtroAplicado.hasta !== fechaSemana ||
    Boolean(filtroAplicado.estado) ||
    Boolean(filtroAplicado.barberoId);

  const aplicarPresetFecha = (preset: 'hoy' | 'semana' | 'mes') => {
    let nuevaDesde = fechaHoy;
    let nuevaHasta = fechaHoy;

    if (preset === 'semana') {
      nuevaHasta = fechaSemana;
    } else if (preset === 'mes') {
      nuevaHasta = fechaMes;
    }

    setDesde(nuevaDesde);
    setHasta(nuevaHasta);

    const filtros: FiltroReservasAdministrativasDTO = {
      desde: nuevaDesde,
      hasta: nuevaHasta,
    };
    if (estado) filtros.estado = estado;
    if (barberoId) filtros.barberoId = Number(barberoId);

    setReservaSeleccionadaId(null);
    setEditando(false);
    setErrorAccion(null);
    setFiltroAplicado(filtros);
  };

  const restablecerFiltros = () => {
    setDesde(fechaHoy);
    setHasta(fechaSemana);
    setEstado('');
    setBarberoId('');
    setDiasColapsados(new Set());
    setReservaSeleccionadaId(null);
    setEditando(false);
    setErrorAccion(null);
    setFiltroAplicado({
      desde: fechaHoy,
      hasta: fechaSemana,
    });
  };

  const aplicarFiltros = () => {
    if (filtroInvalido) return;
    const filtros: FiltroReservasAdministrativasDTO = {};
    if (desde) filtros.desde = desde;
    if (hasta) filtros.hasta = hasta;
    if (estado) filtros.estado = estado;
    if (barberoId) filtros.barberoId = Number(barberoId);
    setReservaSeleccionadaId(null);
    setEditando(false);
    setErrorAccion(null);
    setFiltroAplicado(filtros);
  };

  const cancelar = async () => {
    if (!reservaActiva) return;

    const confirmado = await confirm({
      title: 'Cancelar reserva',
      message: (
        <div>
          <p className="mb-2">¿Estás seguro de que deseas cancelar esta reserva?</p>
          <div
            className="p-3 rounded mb-2 border"
            style={{
              backgroundColor: 'var(--surface-app-bg)',
              borderColor: 'var(--surface-card-border)',
            }}
          >
            <div className="fw-bold text-surface-primary mb-1">
              {reservaActiva.servicio.nombre}
            </div>
            <div className="small text-surface-muted mb-1">
              Cliente: <strong>{reservaActiva.cliente.nombre}</strong>
            </div>
            <div className="small text-surface-muted mb-1">
              Barbero: <strong>{reservaActiva.barbero.nombre}</strong>
            </div>
            <div className="small text-surface-muted">
              Fecha y hora: {reservaActiva.fecha} · {reservaActiva.hora}
            </div>
          </div>
          <p className="small text-danger mb-0">
            Esta acción liberará el espacio en la agenda del barbero de inmediato.
          </p>
        </div>
      ),
      confirmLabel: 'Sí, cancelar reserva',
      cancelLabel: 'Volver',
      variant: 'danger',
    });

    if (!confirmado) return;

    setErrorAccion(null);
    setMensajeAccion(null);
    try {
      const resultado = await cancelarReserva.mutateAsync(reservaActiva.id);
      setMensajeAccion(resultado.mensaje);
      showToast('success', resultado.mensaje);
      await listado.refetch();
      await detalle.refetch();
    } catch (error: unknown) {
      const errorMsg = mapApiError(error);
      setErrorAccion(errorMsg);
      showToast('danger', errorMsg);
    }
  };

  const guardarCambio = async (fecha: string, hora: string) => {
    if (!reservaActiva) return;
    setErrorAccion(null);
    setMensajeAccion(null);
    try {
      const resultado = await modificarReserva.mutateAsync({
        id: reservaActiva.id,
        datos: { barberoId: reservaActiva.barbero.id, fecha, hora },
      });
      setMensajeAccion(resultado.mensaje);
      setEditando(false);
      await listado.refetch();
      await detalle.refetch();
    } catch (error: unknown) {
      setErrorAccion(mapApiError(error));
    }
  };

  useEffect(() => {
    if (!reservaSeleccionadaId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setReservaSeleccionadaId(null);
        setEditando(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    if (typeof window !== 'undefined' && window.innerWidth < 1200) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [reservaSeleccionadaId]);

  const seleccionarReserva = (id: number) => {
    setReservaSeleccionadaId((actual) => (actual === id ? null : id));
    setEditando(false);
    setErrorAccion(null);
    setMensajeAccion(null);
  };

  const ejecutarAccionEstado = async (accion: 'completar' | 'no-asistio') => {
    if (!reservaActiva) return;
    const esCompletar = accion === 'completar';

    const confirmado = await confirm({
      title: esCompletar ? 'Completar cita' : 'Marcar inasistencia',
      message: esCompletar ? (
        <div className="d-flex flex-column gap-2 small">
          <p className="mb-0">
            ¿Deseas marcar esta cita como <strong>completada</strong>?
          </p>
          <p className="mb-0 text-surface-muted">
            Esto confirma que el servicio fue prestado y el cliente pagó. Además, se enviará un mensaje de agradecimiento por WhatsApp.
          </p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2 small">
          <p className="mb-0">
            ¿Confirmas que el cliente <strong>no asistió</strong> a su cita?
          </p>
          <p className="mb-0 text-surface-muted">
            La cita quedará registrada como inasistencia (NO_SHOW).
          </p>
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
      const resultado = esCompletar
        ? await completarReserva.mutateAsync(reservaActiva.id)
        : await marcarNoAsistida.mutateAsync(reservaActiva.id);
      setMensajeAccion(resultado.mensaje);
      showToast('success', resultado.mensaje);
      await listado.refetch();
      await detalle.refetch();
    } catch (error: unknown) {
      const errorMsg = mapApiError(error);
      setErrorAccion(errorMsg);
      showToast('danger', errorMsg);
    }
  };

  const estadoFinal = reservaActiva
    ? reservaActiva.estado === 'COMPLETED' || reservaActiva.estado === 'CANCELLED' || reservaActiva.estado === 'NO_SHOW'
    : true;

  return (
    <main className="container-fluid p-3 p-md-4 reservations-admin">
      <header className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <span className="text-eyebrow d-block mb-2">GESTIÓN / AGENDA GENERAL</span>
          <h1 className="h2 fw-bold mb-1">Reservas de la barbería</h1>
          <p className="text-surface-muted mb-0">Consulta, reprograma y actualiza las citas de todos los barberos.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <BackLink to="/dashboard">Volver al panel</BackLink>
          <Link className="btn btn-primary d-inline-flex align-items-center gap-2" to="/reservas/nueva">
            <Scissors size={16} aria-hidden="true" /> Nueva reserva
          </Link>
        </div>
      </header>

      <section className="card card-surface border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-lg-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <div>
              <h2 className="h5 fw-bold mb-1">Filtrar reservas</h2>
              <p className="small text-surface-muted mb-0 d-flex align-items-center gap-2 flex-wrap">
                <span>Mostrando: <strong className="text-surface-primary">{rango}</strong></span>
                {barberoSeleccionadoNombre && (
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle d-inline-flex align-items-center gap-1">
                    <Scissors size={11} aria-hidden="true" /> {barberoSeleccionadoNombre}
                  </span>
                )}
              </p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="reservations-admin__presets-group" role="group" aria-label="Periodos rápidos">
                <button
                  type="button"
                  className={`reservations-admin__preset-btn ${presetActivo === 'hoy' ? 'is-active' : ''}`}
                  onClick={() => aplicarPresetFecha('hoy')}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  className={`reservations-admin__preset-btn ${presetActivo === 'semana' ? 'is-active' : ''}`}
                  onClick={() => aplicarPresetFecha('semana')}
                >
                  Esta semana
                </button>
                <button
                  type="button"
                  className={`reservations-admin__preset-btn ${presetActivo === 'mes' ? 'is-active' : ''}`}
                  onClick={() => aplicarPresetFecha('mes')}
                >
                  Próximos 30 días
                </button>
              </div>

              {hayFiltrosModificados && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none text-surface-muted reservations-admin__reset-link d-inline-flex align-items-center gap-1 p-1"
                  onClick={restablecerFiltros}
                  title="Restablecer filtros a la vista por defecto (esta semana)"
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  <span style={{ fontSize: '0.8rem' }}>Restablecer</span>
                </button>
              )}
            </div>
          </div>
          <div className="row g-3 align-items-end">
            <div className="col-12 col-sm-6 col-lg-3">
              <label className="form-label small fw-semibold" htmlFor="admin-reservas-desde">Desde</label>
              <input
                id="admin-reservas-desde"
                type="date"
                className="form-control"
                value={desde}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {
                    // Fallback
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape') {
                    e.preventDefault();
                  }
                }}
                onChange={(event) => setDesde(event.target.value)}
              />
            </div>
            <div className="col-12 col-sm-6 col-lg-3">
              <label className="form-label small fw-semibold" htmlFor="admin-reservas-hasta">Hasta</label>
              <input
                id="admin-reservas-hasta"
                type="date"
                className="form-control"
                value={hasta}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {
                    // Fallback
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'Escape') {
                    e.preventDefault();
                  }
                }}
                onChange={(event) => setHasta(event.target.value)}
              />
            </div>
            <div className="col-12 col-sm-4 col-lg-2">
              <label className="form-label small fw-semibold" htmlFor="admin-reservas-estado">Estado</label>
              <select id="admin-reservas-estado" className="form-select" value={estado} onChange={(event) => setEstado(event.target.value as EstadoReservaDTO | '')}>
                <option value="">Todos</option>
                {Object.entries(estados).map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>{etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-4 col-lg-2">
              <label className="form-label small fw-semibold" htmlFor="admin-reservas-barbero">Barbero</label>
              <select
                id="admin-reservas-barbero"
                className="form-select"
                value={barberoId}
                onChange={(event) => setBarberoId(event.target.value)}
              >
                <option value="">Todos los barberos</option>
                {barberosOrdenados.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} {b.apellido}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-4 col-lg-2">
              <Button type="button" className="w-100" disabled={filtroInvalido} onClick={aplicarFiltros}>Aplicar</Button>
              {hayFiltrosModificados && (
                <div className="text-center mt-1">
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-decoration-none text-surface-muted reservations-admin__reset-link p-0 d-inline-flex align-items-center gap-1"
                    onClick={restablecerFiltros}
                    title="Restablecer filtros a la vista por defecto (esta semana)"
                  >
                    <RotateCcw size={12} aria-hidden="true" />
                    <span style={{ fontSize: '0.78rem' }}>Restablecer</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          {filtroInvalido && <p className="small text-danger mt-2 mb-0">Revisa las fechas seleccionadas.</p>}
        </div>
      </section>

      <div className="row g-4">
        <section className="col-12 col-xl-7" aria-labelledby="admin-listado-titulo">
          <div className="card card-surface border-0 shadow-sm">
            <div className="card-body p-3 p-lg-4">
              <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                <div>
                  <span className="text-eyebrow">RESULTADOS</span>
                  <h2 id="admin-listado-titulo" className="h5 fw-bold mb-0">Citas encontradas</h2>
                </div>
                <Button type="button" size="sm" variant="outline-secondary" isLoading={listado.isFetching} onClick={() => void listado.refetch()} icon={<RotateCw size={15} />}>
                  Actualizar
                </Button>
              </div>

              {listado.isError && <ErrorMessage message={mapApiError(listado.error)} />}
              {listado.isLoading && (
                <output className="text-surface-muted d-block py-3">Cargando reservas...</output>
              )}
              {listado.isSuccess && reservas.length === 0 && (
                <div className="text-center py-5">
                  <CalendarDays size={30} className="text-surface-muted mb-2" aria-hidden="true" />
                  <p className="fw-semibold mb-1">No encontramos reservas</p>
                  <p className="small text-surface-muted mb-0">Prueba con otro periodo o estado.</p>
                </div>
              )}
              {listado.isSuccess && reservas.length > 0 && (
                <div className="d-flex flex-column gap-3">
                  {diasAgrupados.map((dia) => (
                    <section key={dia.fecha} className="reservations-admin__day-group" aria-label={dia.tituloCompleto}>
                      <header
                        className="reservations-admin__day-header"
                        onClick={() => toggleDia(dia.fecha)}
                        role="button"
                        aria-expanded={!diasColapsados.has(dia.fecha)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleDia(dia.fecha);
                          }
                        }}
                      >
                        <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0 overflow-hidden">
                          <div className="reservations-admin__day-date-badge flex-shrink-0" aria-hidden="true">
                            <span>{dia.diaSemana}</span>
                            <strong>{dia.diaNumero}</strong>
                          </div>
                          <div className="flex-grow-1 min-w-0 overflow-hidden">
                            <h3 className="h6 fw-bold mb-0 text-truncate" title={dia.tituloCompleto}>{dia.tituloCompleto}</h3>
                            <small className="text-surface-muted text-truncate d-block">
                              {dia.citas.length} {dia.citas.length === 1 ? 'cita programada' : 'citas programadas'}
                            </small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                          <span className="reservations-admin__day-count">
                            {dia.citas.length} {dia.citas.length === 1 ? 'cita' : 'citas'}
                          </span>
                          <ChevronDown
                            size={18}
                            className={`reservations-admin__day-chevron ${diasColapsados.has(dia.fecha) ? 'is-collapsed' : ''}`}
                            aria-hidden="true"
                          />
                        </div>
                      </header>

                      {!diasColapsados.has(dia.fecha) && (
                        <div className="d-flex flex-column gap-2">
                          {dia.citas.map((reserva) => (
                            <article key={reserva.id} className={'reservations-admin__row' + (reservaSeleccionadaId === reserva.id ? ' is-selected' : '')}>
                              <button type="button" className="reservations-admin__select" onClick={() => seleccionarReserva(reserva.id)} aria-pressed={reservaSeleccionadaId === reserva.id}>
                                <span className="reservations-admin__date">
                                  <strong>{reserva.hora.slice(0, 5)}</strong>
                                  <small>{reserva.horaFin ? reserva.horaFin.slice(0, 5) : '—'}</small>
                                </span>
                                <span className="reservations-admin__main">
                                  <strong>{reserva.servicio.nombre}</strong>
                                  <span><UserRound size={13} aria-hidden="true" /> {reserva.cliente.nombre} {reserva.cliente.apellido ?? ''}</span>
                                  <small className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                                    <span className="reservations-admin__barber-badge">
                                      <Scissors size={12} aria-hidden="true" />
                                      <span>{reserva.barbero.nombre} {reserva.barbero.apellido}</span>
                                    </span>
                                    <span className="text-surface-muted">·</span>
                                    <span className="text-surface-muted small">{reserva.cliente.esRegistrado ? 'Registrado' : 'Invitado'}</span>
                                  </small>
                                </span>
                                <span className={'reservations-admin__status reservations-admin__status--' + reserva.estado.toLowerCase()}>{estados[reserva.estado]}</span>
                                <ChevronRight size={17} aria-hidden="true" />
                              </button>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside id="admin-detalle-reserva" className="col-12 col-xl-5 reservations-admin__aside" aria-label="Detalle de reserva">
          <div className="reservations-admin__detail-sticky">
            {!reservaActiva && (
              <div className="reservations-admin__detail-placeholder card card-surface border-0 shadow-sm">
                <span><Scissors size={24} aria-hidden="true" /></span>
                <h2 className="h5 fw-bold">Detalles de la cita</h2>
                <p className="small text-surface-muted mb-0">
                  Selecciona una reserva para consultar la información completa del servicio, barbero y cliente.
                </p>
              </div>
            )}
            {reservaActiva && (
              <PanelContenidoDetalleAdmin
                reserva={reservaActiva}
                editando={editando}
                estadoFinal={estadoFinal}
                mensajeAccion={mensajeAccion}
                errorAccion={errorAccion}
                completarPending={completarReserva.isPending}
                marcarNoAsistidaPending={marcarNoAsistida.isPending}
                cancelarPending={cancelarReserva.isPending}
                modificarPending={modificarReserva.isPending}
                onEjecutarAccion={ejecutarAccionEstado}
                onIniciarEdicion={() => setEditando(true)}
                onCancelarEdicion={() => setEditando(false)}
                onGuardarCambio={(fecha, hora) => void guardarCambio(fecha, hora)}
                onCancelarReserva={() => void cancelar()}
                onCerrar={() => {
                  setReservaSeleccionadaId(null);
                  setEditando(false);
                }}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Modal Bottom Sheet exclusivo para pantallas móviles / tablets (< 1200px) */}
      {reservaActiva && (
        <div
          className="reservations-admin__mobile-sheet-overlay"
          aria-modal="true"
          aria-label="Detalle de la reserva"
        >
          <button
            type="button"
            className="border-0 bg-transparent"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'default' }}
            onClick={() => {
              setReservaSeleccionadaId(null);
              setEditando(false);
            }}
            aria-label="Cerrar modal al hacer clic afuera"
          />
          <div
            className="reservations-admin__mobile-sheet-content position-relative"
            style={{ zIndex: 1 }}
          >
            <div className="reservations-admin__mobile-sheet-header">
              <div className="reservations-admin__mobile-sheet-drag-handle" aria-hidden="true" />
              <button
                type="button"
                className="reservations-admin__mobile-sheet-close"
                onClick={() => {
                  setReservaSeleccionadaId(null);
                  setEditando(false);
                }}
                aria-label="Cerrar detalle"
              >
                <X size={20} />
              </button>
            </div>
            <div className="reservations-admin__mobile-sheet-body">
              <PanelContenidoDetalleAdmin
                reserva={reservaActiva}
                editando={editando}
                estadoFinal={estadoFinal}
                mensajeAccion={mensajeAccion}
                errorAccion={errorAccion}
                completarPending={completarReserva.isPending}
                marcarNoAsistidaPending={marcarNoAsistida.isPending}
                cancelarPending={cancelarReserva.isPending}
                modificarPending={modificarReserva.isPending}
                onEjecutarAccion={ejecutarAccionEstado}
                onIniciarEdicion={() => setEditando(true)}
                onCancelarEdicion={() => setEditando(false)}
                onGuardarCambio={(fecha, hora) => void guardarCambio(fecha, hora)}
                onCancelarReserva={() => void cancelar()}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
