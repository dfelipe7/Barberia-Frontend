import { useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Phone,
  Scissors,
  Timer,
  UserRound,
  UserX,
  X,
} from 'lucide-react';
import type { ReservaAdministrativaDTO } from '../api/reservas.dto';
import { useDisponibilidadReserva } from '../api/reservas.facade';
import {
  ESTADOS_RESERVA_LABELS,
  hoyISO,
  fechaEnTreintaDias,
  precioCOP,
  formatearDuracionMinutos as formatearDuracion,
  fechaLegible,
} from '../lib/reservaFechas';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';

export { ESTADOS_RESERVA_LABELS };

interface EditorFechaReservaProps {
  readonly reserva: ReservaAdministrativaDTO;
  readonly onCancelar: () => void;
  readonly onGuardar: (fecha: string, hora: string) => void;
  readonly guardando: boolean;
}

function EditorFechaReserva({
  reserva,
  onCancelar,
  onGuardar,
  guardando,
}: Readonly<EditorFechaReservaProps>) {
  const [fecha, setFecha] = useState(reserva.fecha);
  const [hora, setHora] = useState<string | null>(null);
  const disponibilidad = useDisponibilidadReserva(fecha ? {
    servicioId: reserva.servicio.id,
    barberoId: reserva.barbero.id,
    fecha,
  } : undefined);
  const horas = disponibilidad.data?.slots.filter((slot) => slot.available) ?? [];

  const renderContenidoHorarios = () => {
    if (!fecha) {
      return <p className="small text-surface-muted">Selecciona una fecha para consultar horarios.</p>;
    }
    if (disponibilidad.isLoading) {
      return <output className="small text-surface-muted d-block">Consultando horarios...</output>;
    }
    if (disponibilidad.isError) {
      return (
        <div>
          <ErrorMessage message={mapApiError(disponibilidad.error)} />
          <Button type="button" size="sm" variant="outline-secondary" onClick={() => void disponibilidad.refetch()}>
            Reintentar
          </Button>
        </div>
      );
    }
    if (horas.length === 0) {
      return <p className="small text-surface-muted">No hay horarios libres para ese día.</p>;
    }
    return (
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
    );
  };

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

      {renderContenidoHorarios()}

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

interface DetalleReservaAdminProps {
  readonly reserva: ReservaAdministrativaDTO;
  readonly onCerrar?: () => void;
}

function DetalleReservaAdmin({
  reserva,
  onCerrar,
}: Readonly<DetalleReservaAdminProps>) {
  return (
    <div className="reservations-admin__detail card card-surface border-0 shadow-sm">
      <div className="reservations-admin__detail-top">
        <div className="reservations-admin__detail-icon">
          <Scissors size={20} aria-hidden="true" />
        </div>
        <div className="d-flex align-items-center gap-2 me-1">
          <span className={`reservations-admin__status reservations-admin__status--${reserva.estado.toLowerCase()}`}>
            {ESTADOS_RESERVA_LABELS[reserva.estado]}
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

interface PanelContenidoDetalleAdminProps {
  readonly reserva: ReservaAdministrativaDTO;
  readonly editando: boolean;
  readonly estadoFinal: boolean;
  readonly mensajeAccion: string | null;
  readonly errorAccion: string | null;
  readonly completarPending: boolean;
  readonly marcarNoAsistidaPending: boolean;
  readonly cancelarPending: boolean;
  readonly modificarPending: boolean;
  readonly onEjecutarAccion: (accion: 'completar' | 'no-asistio') => void;
  readonly onIniciarEdicion: () => void;
  readonly onCancelarEdicion: () => void;
  readonly onGuardarCambio: (fecha: string, hora: string) => void;
  readonly onCancelarReserva: () => void;
  readonly onCerrar?: () => void;
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
}: Readonly<PanelContenidoDetalleAdminProps>) {
  return (
    <>
      <DetalleReservaAdmin reserva={reserva} onCerrar={onCerrar} />

      {mensajeAccion && (
        <output className="alert alert-success mt-3 d-block">
          {mensajeAccion}
        </output>
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
          <div className="reservations-admin__detail-actions mt-2">
            <p className="small text-surface-muted mb-2">Acciones para esta cita:</p>
            <div className="d-flex flex-column gap-2">
              <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                <Button
                  type="button"
                  variant="primary"
                  isLoading={completarPending}
                  disabled={marcarNoAsistidaPending || cancelarPending}
                  onClick={() => onEjecutarAccion('completar')}
                  icon={<CheckCircle2 size={15} />}
                  className="w-100 justify-content-center text-center"
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
                    className="w-100 justify-content-center text-center"
                  >
                    No asistió
                  </Button>
                )}
              </div>
              {reserva.estado !== 'IN_PROGRESS' && (
                <div className="d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                  <Button
                    type="button"
                    variant="outline-primary"
                    onClick={onIniciarEdicion}
                    icon={<Clock3 size={15} />}
                    disabled={completarPending || marcarNoAsistidaPending || cancelarPending}
                    className="w-100 justify-content-center text-center"
                  >
                    Reprogramar
                  </Button>
                  <Button
                    type="button"
                    variant="outline-danger"
                    isLoading={cancelarPending}
                    disabled={completarPending || marcarNoAsistidaPending}
                    onClick={onCancelarReserva}
                    className="w-100 justify-content-center text-center"
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

export interface ReservaDetalleDrawerProps {
  readonly reservaActiva: ReservaAdministrativaDTO | null;
  readonly editando: boolean;
  readonly setEditando: (editando: boolean) => void;
  readonly estadoFinal: boolean;
  readonly mensajeAccion: string | null;
  readonly errorAccion: string | null;
  readonly completarPending: boolean;
  readonly marcarNoAsistidaPending: boolean;
  readonly cancelarPending: boolean;
  readonly modificarPending: boolean;
  readonly onEjecutarAccion: (accion: 'completar' | 'no-asistio') => void;
  readonly onGuardarCambio: (fecha: string, hora: string) => void;
  readonly onCancelarReserva: () => void;
  readonly onCerrar: () => void;
}

export default function ReservaDetalleDrawer({
  reservaActiva,
  editando,
  setEditando,
  estadoFinal,
  mensajeAccion,
  errorAccion,
  completarPending,
  marcarNoAsistidaPending,
  cancelarPending,
  modificarPending,
  onEjecutarAccion,
  onGuardarCambio,
  onCancelarReserva,
  onCerrar,
}: Readonly<ReservaDetalleDrawerProps>) {
  return (
    <>
      <aside id="admin-detalle-reserva" className="col-12 col-xl-5 col-xxl-4 reservations-admin__aside" aria-label="Detalle de reserva">
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
              completarPending={completarPending}
              marcarNoAsistidaPending={marcarNoAsistidaPending}
              cancelarPending={cancelarPending}
              modificarPending={modificarPending}
              onEjecutarAccion={onEjecutarAccion}
              onIniciarEdicion={() => setEditando(true)}
              onCancelarEdicion={() => setEditando(false)}
              onGuardarCambio={onGuardarCambio}
              onCancelarReserva={onCancelarReserva}
              onCerrar={onCerrar}
            />
          )}
        </div>
      </aside>

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
            onClick={onCerrar}
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
                onClick={onCerrar}
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
                completarPending={completarPending}
                marcarNoAsistidaPending={marcarNoAsistidaPending}
                cancelarPending={cancelarPending}
                modificarPending={modificarPending}
                onEjecutarAccion={onEjecutarAccion}
                onIniciarEdicion={() => setEditando(true)}
                onCancelarEdicion={() => setEditando(false)}
                onGuardarCambio={onGuardarCambio}
                onCancelarReserva={onCancelarReserva}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

