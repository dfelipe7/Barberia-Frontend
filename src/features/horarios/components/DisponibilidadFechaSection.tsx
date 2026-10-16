import { useState, type FormEvent } from 'react';
import { CalendarDays } from 'lucide-react';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useDisponibilidadFecha } from '../api/horarios.facade';

export const DisponibilidadFechaSection = () => {
  const [fecha, setFecha] = useState('');
  const [fechaConsultada, setFechaConsultada] = useState('');
  const consulta = useDisponibilidadFecha(fechaConsultada);

  const consultar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (fecha) setFechaConsultada(fecha);
  };

  return (
    <section className="card card-surface border-0 shadow-sm mt-4">
      <div className="card-body p-3 p-md-4">
        <div className="mb-3">
          <h2 className="h5 fw-bold mb-1">Consultar disponibilidad</h2>
          <p className="small text-surface-muted mb-0">
            Selecciona un día para ver las horas en las que puedes recibir reservas.
          </p>
        </div>

        <form onSubmit={consultar} className="row g-3 align-items-end">
          <div className="col-12 col-sm-7 col-md-5">
            <label htmlFor="disponibilidad-fecha" className="form-label small fw-semibold">
              Fecha
            </label>
            <input
              id="disponibilidad-fecha"
              type="date"
              className="form-control"
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
              required
            />
          </div>
          <div className="col-12 col-sm-auto">
            <Button type="submit" icon={<CalendarDays size={16} aria-hidden="true" />}>
              Consultar fecha
            </Button>
          </div>
        </form>

        {fechaConsultada && (
          <div className="mt-4" aria-live="polite">
            {consulta.isLoading ? (
              <p className="small text-surface-muted" role="status">
                Consultando disponibilidad...
              </p>
            ) : consulta.error ? (
              <div className="alert alert-warning py-2">
                <ErrorMessage message={mapApiError(consulta.error)} />
                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning mt-2"
                  onClick={() => void consulta.refetch()}
                  disabled={consulta.isFetching}
                >
                  Reintentar consulta
                </button>
              </div>
            ) : consulta.data?.fecha === fechaConsultada &&
              consulta.data.horariosDisponibles.length > 0 ? (
              <div>
                <h3 className="h6 fw-bold mb-2">
                  Horas disponibles para {fechaConsultada}
                </h3>
                <ul className="list-inline d-flex flex-wrap gap-2 mb-0">
                  {consulta.data.horariosDisponibles.map((hora) => (
                    <li
                      key={hora}
                      className="list-inline-item border rounded-pill px-3 py-2 mb-0"
                    >
                      {hora}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="small text-surface-muted mb-0" role="status">
                No hay horarios disponibles para la fecha seleccionada.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
