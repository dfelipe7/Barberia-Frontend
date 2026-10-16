import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useToastContext } from '../../../shared/ui/ToastContext';
import {
  useCrearPeriodoNoDisponibilidad,
  usePeriodosNoDisponibilidad,
} from '../api/horarios.facade';
import type { PeriodoNoDisponibilidadDTO } from '../api/horarios.dto';
import {
  noDisponibilidadSchema,
  type NoDisponibilidadFormValues,
} from '../schemas/noDisponibilidad.schema';

const formatearFecha = (valor: string) => {
  const [anio, mes, dia] = valor.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(
    new Date(anio, mes - 1, dia, 12)
  );
};

const ordenarPeriodos = (periodos: PeriodoNoDisponibilidadDTO[]) =>
  [...periodos].sort((a, b) =>
    (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio)
  );

export const NoDisponibilidadSection = () => {
  const consulta = usePeriodosNoDisponibilidad();
  const crearPeriodo = useCrearPeriodoNoDisponibilidad();
  const { showToast } = useToastContext();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoDisponibilidadFormValues>({
    resolver: zodResolver(noDisponibilidadSchema),
    defaultValues: { fecha: '', horaInicio: '', horaFin: '' },
  });

  const onGuardar = async (valores: NoDisponibilidadFormValues) => {
    try {
      await crearPeriodo.mutateAsync(valores);
      reset();
      showToast('success', 'Periodo de no disponibilidad registrado.');
    } catch (error: unknown) {
      showToast('danger', mapApiError(error));
    }
  };

  const periodos = ordenarPeriodos(consulta.data ?? []);

  return (
    <section className="card card-surface border-0 shadow-sm mt-4">
      <div className="card-body p-3 p-md-4">
        <div className="mb-3">
          <h2 className="h5 fw-bold mb-1">Periodos de no disponibilidad</h2>
          <p className="small text-surface-muted mb-0">
            Registra fechas y horas en las que no podrás atender.
          </p>
        </div>

        {consulta.error && (
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
        )}

        {crearPeriodo.error && (
          <ErrorMessage message={mapApiError(crearPeriodo.error)} />
        )}

        <form onSubmit={handleSubmit(onGuardar)} noValidate>
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label htmlFor="no-disponible-fecha" className="form-label small fw-semibold">
                Fecha
              </label>
              <input
                id="no-disponible-fecha"
                type="date"
                className={'form-control' + (errors.fecha ? ' is-invalid' : '')}
                aria-invalid={Boolean(errors.fecha)}
                {...register('fecha')}
              />
              {errors.fecha?.message && (
                <div className="invalid-feedback">{errors.fecha.message}</div>
              )}
            </div>

            <div className="col-6 col-md-3">
              <label htmlFor="no-disponible-inicio" className="form-label small fw-semibold">
                Desde
              </label>
              <input
                id="no-disponible-inicio"
                type="time"
                className={'form-control' + (errors.horaInicio ? ' is-invalid' : '')}
                aria-invalid={Boolean(errors.horaInicio)}
                {...register('horaInicio')}
              />
              {errors.horaInicio?.message && (
                <div className="invalid-feedback">{errors.horaInicio.message}</div>
              )}
            </div>

            <div className="col-6 col-md-3">
              <label htmlFor="no-disponible-fin" className="form-label small fw-semibold">
                Hasta
              </label>
              <input
                id="no-disponible-fin"
                type="time"
                className={'form-control' + (errors.horaFin ? ' is-invalid' : '')}
                aria-invalid={Boolean(errors.horaFin)}
                {...register('horaFin')}
              />
              {errors.horaFin?.message && (
                <div className="invalid-feedback">{errors.horaFin.message}</div>
              )}
            </div>

            <div className="col-12 col-md-2 d-grid">
              <Button
                type="submit"
                isLoading={crearPeriodo.isPending}
                loadingText="Guardando..."
              >
                Agregar periodo
              </Button>
            </div>
          </div>
        </form>

        <hr className="my-4" />

        <h3 className="h6 fw-bold mb-3">Periodos registrados</h3>
        {consulta.isLoading ? (
          <p className="small text-surface-muted" role="status">
            Cargando periodos...
          </p>
        ) : periodos.length === 0 ? (
          <p className="small text-surface-muted mb-0">
            No tienes periodos de no disponibilidad registrados.
          </p>
        ) : (
          <ul className="list-group list-group-flush">
            {periodos.map((periodo) => (
              <li
                key={periodo.id}
                className="list-group-item card-surface px-0 d-flex flex-wrap justify-content-between gap-2"
              >
                <span className="fw-semibold">{formatearFecha(periodo.fecha)}</span>
                <span className="text-surface-muted">
                  {periodo.horaInicio} – {periodo.horaFin}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
