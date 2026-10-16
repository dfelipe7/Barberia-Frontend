import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, type Path } from 'react-hook-form';
import { Clock3, Info } from 'lucide-react';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import BackLink from '../../../shared/ui/BackLink';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useToastContext } from '../../../shared/ui/ToastContext';
import { DisponibilidadFechaSection } from '../components/DisponibilidadFechaSection';
import { BloqueosHorarioSection } from '../components/BloqueosHorarioSection';
import { useGuardarMiHorario, useMiHorario } from '../api/horarios.facade';
import {
  API_A_DIA,
  DIA_A_API,
  DIAS_SEMANA,
  HORAS_INICIO_FRANJA,
  type DiaSemana,
  type HorarioSemanalDTO,
} from '../api/horarios.dto';
import {
  horarioSemanalSchema,
  type HorarioSemanalFormValues,
} from '../schemas/horarios.schema';

const crearHorarioVacio = (): HorarioSemanalFormValues => ({
  dias: DIAS_SEMANA.map(({ codigo }) => ({ diaSemana: codigo, franjas: [] })),
});

const convertirADatosFormulario = (
  horario?: HorarioSemanalDTO,
): HorarioSemanalFormValues => {
  const franjasPorDia: Record<DiaSemana, string[]> = {
    LUNES: [],
    MARTES: [],
    MIERCOLES: [],
    JUEVES: [],
    VIERNES: [],
    SABADO: [],
    DOMINGO: [],
  };

  for (const franja of horario?.franjas ?? []) {
    franjasPorDia[API_A_DIA[franja.dayOfWeek]].push(franja.startTime);
  }

  return {
    dias: DIAS_SEMANA.map(({ codigo }) => ({
      diaSemana: codigo,
      franjas: [...new Set(franjasPorDia[codigo])]
        .filter((hora): hora is (typeof HORAS_INICIO_FRANJA)[number] =>
          HORAS_INICIO_FRANJA.some((opcion) => opcion === hora),
        )
        .sort(),
    })),
  };
};

const sumarUnaHora = (hora: string) => {
  const [horas, minutos] = hora.split(':').map(Number);
  return String(horas + 1).padStart(2, '0') + ':' + String(minutos).padStart(2, '0');
};

const rutaFranjas = (indice: number) => ('dias.' + indice + '.franjas') as Path<HorarioSemanalFormValues>;

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
    control,
    setValue,
    reset,
    handleSubmit,
    formState: { isDirty },
  } = useForm<HorarioSemanalFormValues>({
    resolver: zodResolver(horarioSemanalSchema),
    defaultValues: crearHorarioVacio(),
  });

  useEffect(() => {
    if (horario) reset(convertirADatosFormulario(horario));
  }, [horario, reset]);

  const diasFormulario = useWatch({ control, name: 'dias' }) ?? [];
  const diasActivos = diasFormulario.filter((dia) => dia.franjas.length > 0).length;

  const onGuardar = async (valores: HorarioSemanalFormValues) => {
    setErrorGuardar(null);
    const franjas = valores.dias.flatMap((dia) =>
      [...new Set(dia.franjas)].sort().map((startTime) => ({
        dayOfWeek: DIA_A_API[dia.diaSemana],
        startTime,
        endTime: sumarUnaHora(startTime),
      })),
    );

    try {
      await guardarHorario.mutateAsync({ franjas });
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
      <header className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <span className="text-eyebrow d-block mb-2">OPERATIVO / DISPONIBILIDAD</span>
          <h1 className="h2 fw-bold mb-1">Mi horario de atención</h1>
          <p className="text-surface-muted mb-0">
            Define los bloques de una hora en los que puedes recibir reservas.
          </p>
        </div>
        <BackLink to="/reservas">Volver a mis reservas</BackLink>
      </header>

      <section className="card card-surface border-0 shadow-sm">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h2 className="h5 fw-bold mb-1">Horario semanal</h2>
              <p className="text-surface-muted small mb-0">
                {diasActivos === 0
                  ? 'No tienes bloques de atención configurados.'
                  : diasActivos + (diasActivos === 1 ? ' día habilitado' : ' días habilitados')}
              </p>
            </div>
            <span className="badge rounded-pill text-bg-light border d-inline-flex align-items-center gap-1">
              <Clock3 size={14} aria-hidden="true" />
              Hora local · Popayán
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
                      <th scope="col">Bloques disponibles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DIAS_SEMANA.map(({ codigo, nombre }, indice) => {
                      const ruta = rutaFranjas(indice);
                      const seleccionadas = diasFormulario[indice]?.franjas ?? [];

                      return (
                        <tr key={codigo}>
                          <th scope="row" className="fw-semibold text-nowrap">
                            {nombre}
                          </th>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              {HORAS_INICIO_FRANJA.map((hora) => {
                                const id = 'franja-' + codigo + '-' + hora.replace(':', '');
                                const marcada = seleccionadas.includes(hora);

                                return (
                                  <label
                                    key={hora}
                                    htmlFor={id}
                                    className={'btn btn-sm rounded-pill ' + (marcada ? 'btn-primary' : 'btn-outline-secondary')}
                                  >
                                    <input
                                      id={id}
                                      className="visually-hidden"
                                      type="checkbox"
                                      checked={marcada}
                                      onChange={(event) => {
                                        const siguiente = event.target.checked
                                          ? [...seleccionadas, hora].sort()
                                          : seleccionadas.filter((valor) => valor !== hora);
                                        setValue(ruta, siguiente, {
                                          shouldDirty: true,
                                          shouldTouch: true,
                                          shouldValidate: true,
                                        });
                                      }}
                                    />
                                    {hora}–{sumarUnaHora(hora)}
                                  </label>
                                );
                              })}
                            </div>
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
                  El backend guarda cada bloque como una franja de 60 minutos entre 09:00 y 20:00.
                  Selecciona cada hora por separado; los espacios sin seleccionar quedan libres de atención.
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

      <DisponibilidadFechaSection />
      <BloqueosHorarioSection />
    </div>
  );
};

export default HorariosPage;
