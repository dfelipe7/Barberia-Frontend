import { useState, type FormEvent } from 'react';
import { CalendarDays } from 'lucide-react';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useDisponibilidadFecha } from '../api/horarios.facade';
import type { EstadoFranjaDTO } from '../api/horarios.dto';

const ESTADOS: Record<EstadoFranjaDTO, string> = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Reservado',
  BLOCKED: 'Bloqueado',
  GENERAL_CLOSURE: 'Cierre general',
  OUTSIDE_SCHEDULE: 'Fuera de horario',
};

const formatearFecha = (valor: string) => {
  const [anio, mes, dia] = valor.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(
    new Date(anio, mes - 1, dia, 12),
  );
};

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
            Consulta el estado de cada franja para una fecha.
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
            ) : consulta.data?.slots.length ? (
              <div>
                <h3 className="h6 fw-bold mb-2">
                  Franjas del {formatearFecha(consulta.data.fecha)}
                </h3>
                <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                  {consulta.data.slots.map((slot) => (
                    <li
                      key={slot.startTime}
                      className="d-flex flex-wrap justify-content-between align-items-center gap-2 border rounded-3 px-3 py-2"
                    >
                      <span className="fw-semibold">
                        {slot.startTime}–{slot.endTime}
                      </span>
                      <span className="badge rounded-pill text-bg-light border">
                        {ESTADOS[slot.status] ?? slot.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="small text-surface-muted mb-0" role="status">
                No hay franjas configuradas para la fecha seleccionada.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
