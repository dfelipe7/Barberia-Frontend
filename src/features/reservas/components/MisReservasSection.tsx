import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { obtenerNegocioSlugActivo } from '../../../shared/lib/http/axios';
import { isAxiosError } from 'axios';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import Modal from '../../../shared/ui/Modal';
import { CalendarDays } from 'lucide-react';
import { useCancelarMiReserva, useDetalleReserva, useMisReservas } from '../api/reservas.facade';

const formatearFecha = (valor: string) => {
  const [anio, mes, dia] = valor.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(
    new Date(anio, mes - 1, dia, 12),
  );
};

const estadoReserva = (estado: string) =>
  ({
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    IN_PROGRESS: 'En progreso',
    CANCELLED: 'Cancelada',
    COMPLETED: 'Completada',
    NO_SHOW: 'No asistió',
  })[estado] ?? estado;

const renderBadgeEstado = (estado: string) => {
  switch (estado) {
    case 'CONFIRMED':
      return <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle">Confirmada</span>;
    case 'PENDING':
      return <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning-subtle">Pendiente</span>;
    case 'IN_PROGRESS':
      return <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle">En progreso</span>;
    case 'COMPLETED':
      return <span className="badge rounded-pill bg-info-subtle text-info-emphasis border border-info-subtle">Completada</span>;
    case 'CANCELLED':
      return <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle">Cancelada</span>;
    case 'NO_SHOW':
      return <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">No asistió</span>;
    default:
      return <span className="badge rounded-pill bg-body-tertiary text-surface-muted border">{estadoReserva(estado)}</span>;
  }
};

const reservaGestionable = (estado: string) =>
  estado === 'PENDING' || estado === 'CONFIRMED';

interface DetalleReservaBoxProps {
  detalle: any;
}

const DetalleReservaBox: React.FC<DetalleReservaBoxProps> = ({ detalle }) => {
  if (detalle.isLoading) {
    return (
      <div className="border rounded-3 p-3 mt-3" aria-live="polite">
        <output className="small text-surface-muted mb-0 d-block">Cargando detalle...</output>
      </div>
    );
  }

  if (detalle.error) {
    return (
      <div className="border rounded-3 p-3 mt-3" aria-live="polite">
        <ErrorMessage message={mapApiError(detalle.error)} />
      </div>
    );
  }

  if (!detalle.data) return null;

  return (
    <div className="border rounded-3 p-3 mt-3" aria-live="polite">
      <dl className="row mb-0">
        <dt className="col-sm-4 text-surface-muted">Reserva</dt>
        <dd className="col-sm-8">#{detalle.data.id} · {estadoReserva(detalle.data.estado)}</dd>
        <dt className="col-sm-4 text-surface-muted">Servicio</dt>
        <dd className="col-sm-8">{detalle.data.servicio.nombre}</dd>
        <dt className="col-sm-4 text-surface-muted">Barbero</dt>
        <dd className="col-sm-8">{detalle.data.barbero.nombre} {detalle.data.barbero.apellido}</dd>
        <dt className="col-sm-4 text-surface-muted">Fecha y hora</dt>
        <dd className="col-sm-8">{formatearFecha(detalle.data.fecha)} · {detalle.data.hora}–{detalle.data.horaFin}</dd>
        <dt className="col-sm-4 text-surface-muted">Precio aplicado</dt>
        <dd className="col-sm-8 mb-0">
          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(detalle.data.precio)}
        </dd>
      </dl>
    </div>
  );
};

export interface MisReservasSectionProps {
  onCerrar?: () => void;
}

export const MisReservasSection: React.FC<MisReservasSectionProps> = ({ onCerrar }) => {
  const { slug: paramSlug } = useParams<{ slug?: string }>();
  const slugActivo = paramSlug || obtenerNegocioSlugActivo() || '';
  const rutaReservar = slugActivo ? `/${slugActivo}/reservar` : '/reservar';
  const consulta = useMisReservas(true);
  const cancelarReserva = useCancelarMiReserva();

  useEffect(() => {
    if (consulta.error && isAxiosError(consulta.error)) {
      const status = consulta.error.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('token_cliente_barberia');
        localStorage.removeItem('cliente_barberia');
      }
    }
  }, [consulta.error]);
  const [reservaSeleccionadaId, setReservaSeleccionadaId] = useState<number | null>(null);
  const [reservaCancelarId, setReservaCancelarId] = useState<number | null>(null);
  const [avisoCancelacion, setAvisoCancelacion] = useState<string | null>(null);
  const [errorCancelar, setErrorCancelar] = useState<string | null>(null);
  const detalle = useDetalleReserva(reservaSeleccionadaId);

  const confirmarCancelacion = async () => {
    if (reservaCancelarId === null) return;
    setErrorCancelar(null);
    try {
      const resultado = await cancelarReserva.mutateAsync(reservaCancelarId);
      setAvisoCancelacion(resultado.mensaje || 'La reserva se canceló correctamente.');
      setReservaCancelarId(null);
    } catch (error: unknown) {
      setErrorCancelar(mapApiError(error));
    }
  };

  return (
    <>
      <section id="mis-reservas" className="card card-surface border-0 shadow-sm">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <CalendarDays size={20} className="text-primary" aria-hidden="true" />
              <h2 className="h5 fw-bold mb-0">Mis reservas</h2>
            </div>
            {onCerrar && (
              <button
                type="button"
                className="btn-close"
                onClick={onCerrar}
                aria-label="Cerrar mis reservas"
              />
            )}
          </div>
          <p className="small text-surface-muted mb-3">
            Consulta tus citas, modifica una reserva activa o cancélala si cambian tus planes.
          </p>

          {avisoCancelacion && <div className="alert alert-success py-2">{avisoCancelacion}</div>}

          {consulta.isLoading && (
            <output className="small text-surface-muted d-block">Cargando tus reservas...</output>
          )}

          {!consulta.isLoading && consulta.error && (
            isAxiosError(consulta.error) &&
            (consulta.error.response?.status === 401 || consulta.error.response?.status === 403) ? (
              <p className="small text-surface-muted mb-0">
                Tu sesión de cliente no está activa en esta barbería.{' '}
                <button
                  type="button"
                  className="btn btn-link p-0 text-primary text-decoration-none small align-baseline fw-semibold"
                  onClick={() => {
                    localStorage.removeItem('token_cliente_barberia');
                    localStorage.removeItem('cliente_barberia');
                    window.location.reload();
                  }}
                >
                  Haz clic aquí para refrescar
                </button>{' '}
                y agendar como invitado o iniciar sesión con una cuenta de este negocio.
              </p>
            ) : (
              <ErrorMessage message={mapApiError(consulta.error)} />
            )
          )}

          {!consulta.isLoading && !consulta.error && (consulta.data?.reservas ?? []).length === 0 && (
            <p className="small text-surface-muted mb-0">
              {consulta.data?.mensaje || 'No tienes reservas registradas.'}
            </p>
          )}

          {!consulta.isLoading && !consulta.error && (consulta.data?.reservas ?? []).length > 0 && (
            <ul className="list-group list-group-flush">
              {consulta.data?.reservas.map((reserva) => (
                <li
                  key={reserva.id}
                  className="list-group-item card-surface px-0 py-3 d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom"
                >
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                      <span className="fw-semibold text-truncate">
                        {reserva.servicio.nombre} · {formatearFecha(reserva.fecha)}
                      </span>
                      {renderBadgeEstado(reserva.estado)}
                    </div>
                    <span className="small text-surface-muted d-block">
                      {reserva.hora}–{reserva.horaFin} con {reserva.barbero.nombre} {reserva.barbero.apellido}
                    </span>
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    {reservaGestionable(reserva.estado) && (
                      <>
                        <Link
                          className="btn btn-sm btn-outline-primary"
                          to={rutaReservar}
                          state={{
                            reservaId: reserva.id,
                            servicioId: reserva.servicio.id,
                            barberoId: reserva.barbero.id,
                          }}
                        >
                          Modificar
                        </Link>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline-danger"
                          onClick={() => {
                            setErrorCancelar(null);
                            setReservaCancelarId(reserva.id);
                          }}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline-secondary"
                      aria-expanded={reservaSeleccionadaId === reserva.id}
                      onClick={() =>
                        setReservaSeleccionadaId((actual) => actual === reserva.id ? null : reserva.id)
                      }
                    >
                      {reservaSeleccionadaId === reserva.id ? 'Ocultar' : 'Detalle'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {reservaSeleccionadaId !== null && (
            <DetalleReservaBox detalle={detalle} />
          )}
        </div>
      </section>

      <Modal
        isOpen={reservaCancelarId !== null}
        onClose={() => {
          if (!cancelarReserva.isPending) setReservaCancelarId(null);
        }}
        title="¿Estás seguro de que deseas cancelar esta reserva?"
        size="sm"
        role="alertdialog"
        ariaLabelledBy="cancelar-reserva-titulo"
      >
        <p className="mb-3">La reserva quedará cancelada y su horario podrá volver a ofrecerse.</p>
        {errorCancelar && <ErrorMessage message={errorCancelar} />}
        <div className="d-flex justify-content-end gap-2">
          <Button
            type="button"
            variant="outline-secondary"
            disabled={cancelarReserva.isPending}
            onClick={() => setReservaCancelarId(null)}
          >
            No
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={cancelarReserva.isPending}
            loadingText="Cancelando..."
            onClick={() => void confirmarCancelacion()}
          >
            Sí, cancelar
          </Button>
        </div>
      </Modal>
    </>
  );
};
