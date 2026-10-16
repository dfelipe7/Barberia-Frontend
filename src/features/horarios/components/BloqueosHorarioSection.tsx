import { isAxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { RotateCcw } from 'lucide-react';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useToastContext } from '../../../shared/ui/ToastContext';
import {
  useBloqueosHorario,
  useCrearBloqueoHorario,
  useReactivarBloqueoHorario,
} from '../api/horarios.facade';
import type { BloqueoHorarioDTO } from '../api/horarios.dto';
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

const ordenarBloqueos = (bloqueos: BloqueoHorarioDTO[]) =>
  [...bloqueos].sort((a, b) =>
    (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio)
  );

const mensajeErrorReactivacion = (error: unknown) =>
  isAxiosError(error) && error.response?.status === 404
    ? 'No existe un bloqueo que pueda ser reactivado.'
    : mapApiError(error);

export const BloqueosHorarioSection = () => {
  const consulta = useBloqueosHorario();
  const crearBloqueo = useCrearBloqueoHorario();
  const reactivarBloqueo = useReactivarBloqueoHorario();
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
      await crearBloqueo.mutateAsync(valores);
      reset();
      showToast('success', 'Horario bloqueado correctamente.');
    } catch (error: unknown) {
      showToast('danger', mapApiError(error));
    }
  };

  const onReactivar = async (id: number | string) => {
    try {
      await reactivarBloqueo.mutateAsync(id);
      showToast('success', 'Horario reactivado correctamente.');
    } catch (error: unknown) {
      showToast('danger', mensajeErrorReactivacion(error));
    }
  };

  const bloqueos = ordenarBloqueos(consulta.data ?? []);

  return (
    <section className="card card-surface border-0 shadow-sm mt-4">
      <div className="card-body p-3 p-md-4">
        <div className="mb-3">
          <h2 className="h5 fw-bold mb-1">Bloqueos temporales</h2>
          <p className="small text-surface-muted mb-0">
            Bloquea un rango para impedir nuevas reservas y reactívalo cuando vuelvas a estar disponible.
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

        <form onSubmit={handleSubmit(onGuardar)} noValidate>
          <fieldset className="border-0 p-0 m-0" disabled={crearBloqueo.isPending}>
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-4">
                <label htmlFor="bloqueo-fecha" className="form-label small fw-semibold">
                  Fecha
                </label>
                <input
                  id="bloqueo-fecha"
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
                <label htmlFor="bloqueo-inicio" className="form-label small fw-semibold">
                  Desde
                </label>
                <input
                  id="bloqueo-inicio"
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
                <label htmlFor="bloqueo-fin" className="form-label small fw-semibold">
                  Hasta
                </label>
                <input
                  id="bloqueo-fin"
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
                  isLoading={crearBloqueo.isPending}
                  loadingText="Bloqueando..."
                >
                  Bloquear horario
                </Button>
              </div>
            </div>
          </fieldset>
        </form>

        {crearBloqueo.error && <ErrorMessage message={mapApiError(crearBloqueo.error)} />}
        {reactivarBloqueo.error && (
          <ErrorMessage message={mensajeErrorReactivacion(reactivarBloqueo.error)} />
        )}

        <hr className="my-4" />

        <h3 className="h6 fw-bold mb-3">Horarios bloqueados</h3>
        {consulta.isLoading ? (
          <p className="small text-surface-muted" role="status">
            Cargando bloqueos...
          </p>
        ) : bloqueos.length === 0 ? (
          <p className="small text-surface-muted mb-0">
            No tienes horarios bloqueados.
          </p>
        ) : (
          <ul className="list-group list-group-flush">
            {bloqueos.map((bloqueo) => (
              <li
                key={bloqueo.id}
                className="list-group-item card-surface px-0 d-flex flex-wrap align-items-center justify-content-between gap-2"
              >
                <span>
                  <span className="fw-semibold d-block">{formatearFecha(bloqueo.fecha)}</span>
                  <span className="small text-surface-muted">
                    {bloqueo.horaInicio} – {bloqueo.horaFin}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="outline-success"
                  size="sm"
                  icon={<RotateCcw size={15} aria-hidden="true" />}
                  disabled={reactivarBloqueo.isPending}
                  isLoading={
                    reactivarBloqueo.isPending && reactivarBloqueo.variables === bloqueo.id
                  }
                  loadingText="Reactivando..."
                  onClick={() => void onReactivar(bloqueo.id)}
                  aria-label={`Reactivar horario del ${formatearFecha(bloqueo.fecha)} de ${bloqueo.horaInicio} a ${bloqueo.horaFin}`}
                >
                  Reactivar horario
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
