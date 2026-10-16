import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Path } from 'react-hook-form';
import { Clock3, Info } from 'lucide-react';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useToastContext } from '../../../shared/ui/ToastContext';
import { NoDisponibilidadSection } from '../components/NoDisponibilidadSection';
import { DisponibilidadFechaSection } from '../components/DisponibilidadFechaSection';
import { BloqueosHorarioSection } from '../components/BloqueosHorarioSection';
import { useGuardarMiHorario, useMiHorario } from '../api/horarios.facade';
import {
  DIAS_SEMANA,
  type HorarioDiaDTO,
  type HorarioSemanalDTO,
} from '../api/horarios.dto';
import {
  horarioSemanalSchema,
  type HorarioSemanalFormValues,
} from '../schemas/horarios.schema';

const crearHorarioVacio = (): HorarioSemanalFormValues => ({
  dias: DIAS_SEMANA.map(({ codigo }) => ({
    diaSemana: codigo,
    activo: false,
    horaInicio: '',
    horaFin: '',
  })),
});

const convertirADatosFormulario = (
  horario?: HorarioSemanalDTO
): HorarioSemanalFormValues => {
  const diasConfigurados = horario?.dias ?? [];

  return {
    dias: DIAS_SEMANA.map(({ codigo }) => {
      const diaGuardado = diasConfigurados.find((dia) => dia.diaSemana === codigo);
      return {
        diaSemana: codigo,
        activo: diaGuardado?.activo ?? false,
        horaInicio: diaGuardado?.horaInicio ?? '',
        horaFin: diaGuardado?.horaFin ?? '',
      };
    }),
  };
};

const crearRutaCampo = (
  indice: number,
  campo: 'activo' | 'horaInicio' | 'horaFin'
): Path<HorarioSemanalFormValues> =>
  ('dias.' + indice + '.' + campo) as Path<HorarioSemanalFormValues>;

export const HorariosPage = () => {
  const {
    data: horario,
    isLoading: cargando,
    error: errorConsulta,
    refetch: consultarHorario,
  } = useMiHorario();
  const guardarHorario = useGuardarMiHorario();
  const { showToast } = useToastContext();
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  const {
    register,
    watch,
    reset,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<HorarioSemanalFormValues>({
    resolver: zodResolver(horarioSemanalSchema),
    defaultValues: crearHorarioVacio(),
  });

  useEffect(() => {
    if (horario) {
      reset(convertirADatosFormulario(horario));
    }
  }, [horario, reset]);

  const diasActivos = (watch('dias') ?? []).filter((dia) => dia.activo).length;

  const onGuardar = async (valores: HorarioSemanalFormValues) => {
    setErrorGuardar(null);
    const datos: { dias: HorarioDiaDTO[] } = {
      dias: valores.dias.map((dia) => ({
        diaSemana: dia.diaSemana,
        activo: dia.activo,
        horaInicio: dia.activo ? (dia.horaInicio ?? '') : null,
        horaFin: dia.activo ? (dia.horaFin ?? '') : null,
      })),
    };

    try {
      await guardarHorario.mutateAsync(datos);
      showToast('success', 'Horario guardado correctamente.');
    } catch (error: unknown) {
      const mensaje = mapApiError(error);
      setErrorGuardar(mensaje);
      showToast('danger', mensaje);
    }
  };

  const descartarCambios = () => {
    reset(convertirADatosFormulario(horario));
    setErrorGuardar(null);
  };

  return (
    <div className="container py-4" style={{ maxWidth: '1040px' }}>
      <header className="mb-4">
        <span className="text-eyebrow d-block mb-2">OPERATIVO / DISPONIBILIDAD</span>
        <h1 className="h2 fw-bold mb-1">Mi horario de atención</h1>
        <p className="text-surface-muted mb-0">
          Define los días y las horas en los que puedes recibir reservas.
        </p>
      </header>

      <section className="card card-surface border-0 shadow-sm">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h2 className="h5 fw-bold mb-1">Horario semanal</h2>
              <p className="text-surface-muted small mb-0">
                {diasActivos === 0
                  ? 'No tienes un horario configurado.'
                  : diasActivos + (diasActivos === 1 ? ' día habilitado' : ' días habilitados')}
              </p>
            </div>
            <span className="badge rounded-pill text-bg-light border d-inline-flex align-items-center gap-1">
              <Clock3 size={14} aria-hidden="true" />
              Hora local
            </span>
          </div>

          {cargando && (
            <p className="small text-surface-muted" role="status">
              Consultando el horario guardado...
            </p>
          )}

          {errorConsulta && (
            <div className="alert alert-warning py-2">
              <ErrorMessage message={mapApiError(errorConsulta)} />
              <button
                type="button"
                className="btn btn-sm btn-outline-warning mt-2"
                onClick={() => void consultarHorario()}
                disabled={cargando}
              >
                Reintentar consulta
              </button>
            </div>
          )}

          {errorGuardar && <ErrorMessage message={errorGuardar} />}

          <form onSubmit={handleSubmit(onGuardar)} noValidate>
            <fieldset
              className="border-0 p-0 m-0"
              disabled={cargando || guardarHorario.isPending}
            >
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr className="small text-surface-muted">
                      <th scope="col">Día</th>
                      <th scope="col">Recibo reservas</th>
                      <th scope="col">Desde</th>
                      <th scope="col">Hasta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DIAS_SEMANA.map(({ codigo, nombre }, indice) => {
                      const rutaActivo = crearRutaCampo(indice, 'activo');
                      const rutaInicio = crearRutaCampo(indice, 'horaInicio');
                      const rutaFin = crearRutaCampo(indice, 'horaFin');
                      const activo = Boolean(watch(rutaActivo));
                      const erroresDia = errors.dias?.[indice];

                      return (
                        <tr key={codigo}>
                          <th scope="row" className="fw-semibold">
                            {nombre}
                          </th>
                          <td>
                            <div className="form-check form-switch mb-0">
                              <input
                                id={'dia-activo-' + codigo}
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                aria-label={'Habilitar ' + nombre}
                                {...register(rutaActivo)}
                              />
                            </div>
                          </td>
                          <td>
                            <label className="visually-hidden" htmlFor={'hora-inicio-' + codigo}>
                              Hora de inicio, {nombre}
                            </label>
                            <input
                              id={'hora-inicio-' + codigo}
                              type="time"
                              className={'form-control' + (erroresDia?.horaInicio ? ' is-invalid' : '')}
                              aria-invalid={Boolean(erroresDia?.horaInicio)}
                              disabled={!activo}
                              {...register(rutaInicio)}
                            />
                            {erroresDia?.horaInicio?.message && (
                              <div className="invalid-feedback d-block">
                                {erroresDia.horaInicio.message}
                              </div>
                            )}
                          </td>
                          <td>
                            <label className="visually-hidden" htmlFor={'hora-fin-' + codigo}>
                              Hora de finalización, {nombre}
                            </label>
                            <input
                              id={'hora-fin-' + codigo}
                              type="time"
                              className={'form-control' + (erroresDia?.horaFin ? ' is-invalid' : '')}
                              aria-invalid={Boolean(erroresDia?.horaFin)}
                              disabled={!activo}
                              {...register(rutaFin)}
                            />
                            {erroresDia?.horaFin?.message && (
                              <div className="invalid-feedback d-block">
                                {erroresDia.horaFin.message}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="d-flex align-items-start gap-2 small text-surface-muted mt-3">
                <Info size={16} className="flex-shrink-0 mt-1" aria-hidden="true" />
                <p className="mb-0">
                  Si no atiendes un día, déjalo desactivado. En los días activos debes indicar
                  una hora de inicio y otra de finalización.
                </p>
              </div>

              <div className="d-flex flex-wrap justify-content-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={descartarCambios}
                  disabled={!isDirty || guardarHorario.isPending}
                >
                  Descartar cambios
                </Button>
                <Button
                  type="submit"
                  isLoading={guardarHorario.isPending}
                  loadingText="Guardando horario..."
                >
                  Guardar horario
                </Button>
              </div>
            </fieldset>
          </form>
        </div>
      </section>

      <NoDisponibilidadSection />
      <DisponibilidadFechaSection />
      <BloqueosHorarioSection />
    </div>
  );
};

export default HorariosPage;
