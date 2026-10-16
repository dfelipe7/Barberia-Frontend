import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import Modal from '../../../shared/ui/Modal';
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

const reservaGestionable = (estado: string) =>
  estado === 'PENDING' || estado === 'CONFIRMED';

export const MisReservasSection = () => {
  const consulta = useMisReservas(true);
  const cancelarReserva = useCancelarMiReserva();
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
      <section id="mis-reservas" className="card card-surface border-0 shadow-sm mt-4">
        <div className="card-body p-3 p-md-4">
          <h2 className="h5 fw-bold mb-1">Mis reservas</h2>
          <p className="small text-surface-muted mb-3">
            Consulta tus citas, modifica una reserva activa o cancélala si cambian tus planes.
          </p>

          {avisoCancelacion && <div className="alert alert-success py-2" role="status">{avisoCancelacion}</div>}

          {consulta.isLoading ? (
            <p className="small text-surface-muted" role="status">Cargando tus reservas...</p>
          ) : consulta.error ? (
            <ErrorMessage message={mapApiError(consulta.error)} />
          ) : (consulta.data?.reservas ?? []).length === 0 ? (
            <p className="small text-surface-muted mb-0">
              {consulta.data?.mensaje || 'No tienes reservas registradas.'}
            </p>
          ) : (
            <ul className="list-group list-group-flush">
              {consulta.data?.reservas.map((reserva) => (
                <li
                  key={reserva.id}
                  className="list-group-item card-surface px-0 d-flex flex-wrap align-items-center justify-content-between gap-3"
                >
                  <div className="flex-grow-1">
                    <span className="fw-semibold d-block">
                      {reserva.servicio.nombre} · {formatearFecha(reserva.fecha)}
                    </span>
                    <span className="small text-surface-muted">
                      {reserva.hora}–{reserva.horaFin} con {reserva.barbero.nombre} {reserva.barbero.apellido}
                      {' · ' + estadoReserva(reserva.estado)}
                    </span>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {reservaGestionable(reserva.estado) && (
                      <>
                        <Link
                          className="btn btn-sm btn-outline-primary"
                          to="/reservar"
                          state={{
                            reservaId: reserva.id,
                            servicioId: reserva.servicio.id,
                            barberoId: reserva.barbero.id,
                          }}
                        >
                          Modificar reserva
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
                          Cancelar reserva
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
                      {reservaSeleccionadaId === reserva.id ? 'Ocultar detalle' : 'Ver detalle'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {reservaSeleccionadaId !== null && (
            <div className="border rounded-3 p-3 mt-3" aria-live="polite">
              {detalle.isLoading ? (
                <p className="small text-surface-muted mb-0" role="status">Cargando detalle...</p>
              ) : detalle.error ? (
                <ErrorMessage message={mapApiError(detalle.error)} />
              ) : detalle.data ? (
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
              ) : null}
            </div>
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
