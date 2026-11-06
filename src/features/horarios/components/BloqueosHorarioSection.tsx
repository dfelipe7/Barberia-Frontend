import { useState } from 'react';
import { isAxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  Pencil,
  RotateCcw,
  Sparkles,
  Tag,
} from 'lucide-react';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useToastContext } from '../../../shared/ui/ToastContext';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import {
  useActualizarBloqueoHorario,
  useBloqueosHorario,
  useCrearBloqueoHorario,
  useMiHorario,
  useReactivarBloqueoHorario,
} from '../api/horarios.facade';
import type {
  BloqueoHorarioDTO,
  DiaSemanaApi,
  EstadoBloqueoHorarioDTO,
  RazonBloqueoHorarioDTO,
} from '../api/horarios.dto';
import {
  noDisponibilidadSchema,
  type NoDisponibilidadFormValues,
} from '../schemas/noDisponibilidad.schema';

const ESTILOS_BLOQUEO: Record<
  EstadoBloqueoHorarioDTO,
  { label: string; badgeClase: string; dot: string }
> = {
  ACTIVE: {
    label: 'Bloqueando',
    badgeClase: 'bloqueo-status-badge--active',
    dot: '●',
  },
  REACTIVATED: {
    label: 'Liberado',
    badgeClase: 'bloqueo-status-badge--reactivated',
    dot: '✓',
  },
  CANCELLED: {
    label: 'Cancelado',
    badgeClase: 'bloqueo-status-badge--cancelled',
    dot: '✕',
  },
};

const RAZONES_BLOQUEO: ReadonlyArray<{ value: RazonBloqueoHorarioDTO; label: string }> = [
  { value: 'PERSONAL', label: 'Asunto personal' },
  { value: 'MEDICAL', label: 'Cita médica' },
  { value: 'VACATION', label: 'Vacaciones' },
  { value: 'OTHER', label: 'Otro motivo' },
];

const HORAS_BLOQUEO = Array.from({ length: 12 }, (_, indice) =>
  String(indice + 9).padStart(2, '0') + ':00',
);
const DIAS_POR_INDICE: DiaSemanaApi[] = [
  'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
];

const valoresVacios: NoDisponibilidadFormValues = {
  fecha: '',
  horaInicio: '',
  horaFin: '',
  razon: '',
  notas: '',
};

const formatearFecha = (valor: string) => {
  const [anio, mes, dia] = valor.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(
    new Date(anio, mes - 1, dia, 12),
  );
};

const obtenerFechaHoy = () => {
  const ahora = new Date();
  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, '0');
  const day = String(ahora.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const obtenerFechaMax = () => {
  const anio = new Date().getFullYear();
  return `${anio + 1}-12-31`;
};

const ordenarBloqueos = (bloqueos: BloqueoHorarioDTO[]) =>
  [...bloqueos].sort((a, b) => {
    // 1. Nuevos creados primero (por createdAt descendente si existe)
    if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt) {
      return b.createdAt.localeCompare(a.createdAt);
    }
    // 2. Por ID descendente (el ID autoincremental más alto es el más reciente)
    if (a.id !== b.id) {
      return b.id - a.id;
    }
    // 3. Fallback: fecha y hora descendente (más futuro primero)
    return (b.date + b.startTime).localeCompare(a.date + a.startTime);
  });

const minutosDeHora = (hora: string) => {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
};

const franjasFueraDeHorario = (
  fecha: string,
  horaInicio: string,
  horaFin: string,
  franjasSemanales: NonNullable<ReturnType<typeof useMiHorario>['data']>['franjas'],
) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !horaInicio || !horaFin) return [];
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const fechaCalendario = new Date(Date.UTC(anio, mes - 1, dia, 12));
  if (
    fechaCalendario.getUTCFullYear() !== anio ||
    fechaCalendario.getUTCMonth() !== mes - 1 ||
    fechaCalendario.getUTCDate() !== dia
  ) {
    return [];
  }
  const diaSemanaApi = DIAS_POR_INDICE[fechaCalendario.getUTCDay()];
  const franjasDia = franjasSemanales.filter((item) => item.dayOfWeek === diaSemanaApi);
  const inicioMin = minutosDeHora(horaInicio);
  const finMin = minutosDeHora(horaFin);
  const fuera: string[] = [];
  for (let actual = inicioMin; actual < finMin; actual += 60) {
    const horaString =
      String(Math.floor(actual / 60)).padStart(2, '0') +
      ':' +
      String(actual % 60).padStart(2, '0');
    const estaEnHorario = franjasDia.some((item) => item.startTime === horaString);
    if (!estaEnHorario) {
      fuera.push(horaString);
    }
  }
  return fuera;
};

const mensajeErrorBloqueo = (error: unknown) => {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join('. ');
    if (typeof data?.message === 'string') return data.message;
  }
  return 'Ocurrió un error inesperado al procesar el bloqueo.';
};

export const BloqueosHorarioSection = () => {
  const { showToast } = useToastContext();
  const confirm = useConfirm();
  const hoy = obtenerFechaHoy();
  const fechaMax = obtenerFechaMax();
  const [bloqueoEnEdicion, setBloqueoEnEdicion] = useState<BloqueoHorarioDTO | null>(null);

  const consulta = useBloqueosHorario();
  const horarioSemanal = useMiHorario();
  const crearBloqueo = useCrearBloqueoHorario();
  const actualizarBloqueo = useActualizarBloqueoHorario();
  const reactivarBloqueo = useReactivarBloqueoHorario();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<NoDisponibilidadFormValues>({
    resolver: zodResolver(noDisponibilidadSchema),
    defaultValues: valoresVacios,
  });

  const fecha = useWatch({ control, name: 'fecha' });
  const horaInicio = useWatch({ control, name: 'horaInicio' });
  const horaFin = useWatch({ control, name: 'horaFin' });
  const notas = useWatch({ control, name: 'notas' }) ?? '';

  const guardando = crearBloqueo.isPending || actualizarBloqueo.isPending;
  const rangoValido = Boolean(
    fecha && horaInicio && horaFin && horaInicio < horaFin && /^\d{4}-\d{2}-\d{2}$/.test(fecha),
  );
  const horasFuera =
    rangoValido && horarioSemanal.data
      ? franjasFueraDeHorario(fecha, horaInicio, horaFin, horarioSemanal.data.franjas)
      : [];

  const iniciarEdicion = (bloqueo: BloqueoHorarioDTO) => {
    setBloqueoEnEdicion(bloqueo);
    reset({
      fecha: bloqueo.date,
      horaInicio: bloqueo.startTime,
      horaFin: bloqueo.endTime,
      razon: (bloqueo.reason as NoDisponibilidadFormValues['razon']) ?? '',
      notas: bloqueo.notes ?? '',
    });
  };

  const cancelarEdicion = () => {
    setBloqueoEnEdicion(null);
    reset(valoresVacios);
  };

  const onGuardar = async (values: NoDisponibilidadFormValues) => {
    try {
      if (bloqueoEnEdicion) {
        const resultado = await actualizarBloqueo.mutateAsync({
          id: bloqueoEnEdicion.id,
          datos: {
            date: values.fecha,
            startTime: values.horaInicio,
            endTime: values.horaFin,
            reason: (values.razon as RazonBloqueoHorarioDTO) || null,
            notes: values.notas?.trim() || null,
          },
        });
        showToast('success', resultado.mensaje || 'Bloqueo actualizado.');
        cancelarEdicion();
      } else {
        const resultado = await crearBloqueo.mutateAsync({
          date: values.fecha,
          startTime: values.horaInicio,
          endTime: values.horaFin,
          reason: (values.razon as RazonBloqueoHorarioDTO) || undefined,
          notes: values.notas?.trim() || undefined,
        });
        showToast('success', resultado.mensaje || 'Bloqueo guardado.');
        reset(valoresVacios);
      }
    } catch (error: unknown) {
      showToast('danger', mensajeErrorBloqueo(error));
    }
  };

  const onLiberarHorario = async (bloqueo: BloqueoHorarioDTO) => {
    const aceptado = await confirm({
      title: 'Liberar horario',
      message:
        '¿Deseas liberar las horas del ' +
        formatearFecha(bloqueo.date) +
        ' (' +
        bloqueo.startTime +
        ' a ' +
        bloqueo.endTime +
        ')? Volverán a quedar disponibles para que los clientes agenden citas.',
      confirmLabel: 'Sí, liberar horario',
      variant: 'primary',
    });
    if (!aceptado) return;
    try {
      const resultado = await reactivarBloqueo.mutateAsync(bloqueo.id);
      showToast('success', resultado.mensaje || 'Franja liberada correctamente.');
    } catch (error: unknown) {
      showToast('danger', mensajeErrorBloqueo(error));
    }
  };

  const bloqueos = ordenarBloqueos(consulta.data ?? []);
  const bloqueosActivosCount = bloqueos.filter((b) => b.status === 'ACTIVE').length;
  const horaFinRegistrada = register('horaFin');

  return (
    <section className="card card-surface border-0 shadow-sm mt-4">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h2 className="h5 fw-bold mb-1">Ausencias y bloqueos temporales</h2>
            <p className="small text-surface-muted mb-0">
              Bloquea una o más horas de tu jornada. Los horarios se seleccionan en punto y deben estar ofrecidos en el día elegido.
            </p>
          </div>
          {bloqueosActivosCount > 0 && (
            <span className="bloqueo-status-badge bloqueo-status-badge--active">
              <span className="bloqueo-status-dot" aria-hidden="true">●</span>
              {bloqueosActivosCount} activo{bloqueosActivosCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {horarioSemanal.error && (
          <div className="alert alert-warning py-2" role="alert">
            <ErrorMessage message="No pudimos consultar tu horario semanal; no podremos validar el rango hasta que vuelva a estar disponible." />
            <button
              type="button"
              className="btn btn-sm btn-outline-warning mt-2"
              onClick={() => void horarioSemanal.refetch()}
              disabled={horarioSemanal.isFetching}
            >
              Reintentar consulta
            </button>
          </div>
        )}

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

        <div className="bloqueo-form-box p-3 p-md-4 rounded-3 mb-4">
          {bloqueoEnEdicion && (
            <div className="bloqueo-editing-banner d-flex align-items-center justify-content-between p-2 px-3 mb-3 rounded-2">
              <div className="d-flex align-items-center gap-2 small">
                <Pencil size={15} className="text-warning flex-shrink-0" />
                <span>
                  Editando bloqueo del <strong>{formatearFecha(bloqueoEnEdicion.date)}</strong> ({bloqueoEnEdicion.startTime} – {bloqueoEnEdicion.endTime})
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none py-0 px-2"
                onClick={cancelarEdicion}
              >
                Cancelar edición
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onGuardar)} noValidate>
            <fieldset className="border-0 p-0 m-0" disabled={guardando}>
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-3">
                  <label htmlFor="bloqueo-fecha" className="form-label small fw-semibold">
                    Fecha (toca para elegir día)
                  </label>
                  <input
                    id="bloqueo-fecha"
                    type="date"
                    className={'form-control' + (errors.fecha ? ' is-invalid' : '')}
                    aria-invalid={Boolean(errors.fecha)}
                    min={hoy}
                    max={fechaMax}
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
                    {...register('fecha')}
                  />
                  {errors.fecha?.message && <div className="invalid-feedback">{errors.fecha.message}</div>}
                </div>

                <div className="col-6 col-md-2">
                  <label htmlFor="bloqueo-inicio" className="form-label small fw-semibold">Desde</label>
                  <select
                    id="bloqueo-inicio"
                    className={'form-select' + (errors.horaInicio ? ' is-invalid' : '')}
                    aria-invalid={Boolean(errors.horaInicio)}
                    {...register('horaInicio', {
                      onChange: (event) => {
                        const siguienteInicio = event.target.value as string;
                        if (horaFin && horaFin <= siguienteInicio) {
                          setValue('horaFin', '', { shouldValidate: true, shouldDirty: true });
                        }
                      },
                    })}
                  >
                    <option value="">Elige hora</option>
                    {HORAS_BLOQUEO.slice(0, -1).map((hora) => <option key={hora} value={hora}>{hora}</option>)}
                  </select>
                  {errors.horaInicio?.message && <div className="invalid-feedback">{errors.horaInicio.message}</div>}
                </div>

                <div className="col-6 col-md-2">
                  <label htmlFor="bloqueo-fin" className="form-label small fw-semibold">Hasta</label>
                  <select
                    id="bloqueo-fin"
                    className={'form-select' + (errors.horaFin ? ' is-invalid' : '')}
                    aria-invalid={Boolean(errors.horaFin)}
                    {...horaFinRegistrada}
                  >
                    <option value="">Elige hora</option>
                    {HORAS_BLOQUEO.filter((hora) => !horaInicio || hora > horaInicio).map((hora) => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </select>
                  {errors.horaFin?.message && <div className="invalid-feedback">{errors.horaFin.message}</div>}
                </div>

                <div className="col-12 col-md-3">
                  <label htmlFor="bloqueo-razon" className="form-label small fw-semibold">
                    Motivo <span className="text-surface-muted fw-normal">(opcional)</span>
                  </label>
                  <select id="bloqueo-razon" className="form-select" {...register('razon')}>
                    <option value="">Selecciona un motivo</option>
                    {RAZONES_BLOQUEO.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}
                  </select>
                </div>

                <div className="col-12 col-md-2 d-grid">
                  <Button
                    type="submit"
                    isLoading={guardando}
                    loadingText="Guardando..."
                    icon={bloqueoEnEdicion ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
                  >
                    {bloqueoEnEdicion ? 'Guardar cambios' : 'Guardar bloqueo'}
                  </Button>
                </div>
              </div>

              <div className="row g-3 mt-1 align-items-end">
                <div className="col-12 col-lg-9">
                  <label htmlFor="bloqueo-notas" className="form-label small fw-semibold">
                    Nota privada <span className="text-surface-muted fw-normal">(opcional)</span>
                  </label>
                  <textarea
                    id="bloqueo-notas"
                    className={'form-control' + (errors.notas ? ' is-invalid' : '')}
                    rows={2}
                    maxLength={500}
                    aria-describedby="bloqueo-notas-ayuda"
                    placeholder="Escribe detalles internos sobre la ausencia..."
                    {...register('notas')}
                  />
                  <div id="bloqueo-notas-ayuda" className="form-text d-flex justify-content-between">
                    <span>{errors.notas?.message ?? 'Solo tú puedes consultar esta nota.'}</span>
                    <span>{notas.length}/500</span>
                  </div>
                </div>
                {bloqueoEnEdicion && (
                  <div className="col-12 col-lg-3 d-grid">
                    <Button type="button" variant="outline-secondary" onClick={cancelarEdicion}>
                      Dejar de editar
                    </Button>
                  </div>
                )}
              </div>
            </fieldset>
          </form>

          {horarioSemanal.isLoading && (
            <output className="small text-surface-muted mt-3 mb-0 d-block">Consultando tu horario semanal para validar el bloqueo...</output>
          )}
          {rangoValido && horarioSemanal.data && horasFuera.length > 0 && (
            <div className="alert alert-danger py-2 mt-3 mb-0" role="alert">
              El rango incluye {horasFuera.join(', ')}, horas que no están ofrecidas en tu horario semanal para ese día. Cambia el intervalo o actualiza primero tu horario semanal.
            </div>
          )}
          {rangoValido && horarioSemanal.data && horasFuera.length === 0 && (
            <output className="small text-success mt-3 mb-0 d-flex align-items-center gap-2">
              <CheckCircle2 size={15} aria-hidden="true" />
              El rango coincide con tu horario semanal.
            </output>
          )}
        </div>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h3 className="h6 fw-bold mb-0 d-flex align-items-center gap-2">
              <span>Historial de bloqueos</span>
              {bloqueos.length > 0 && (
                <span className="badge rounded-pill bg-body-secondary text-surface-muted px-2 py-1">
                  {bloqueos.length}
                </span>
              )}
            </h3>
            <p className="small text-surface-muted mb-0 mt-1">
              Los nuevos bloqueos y modificaciones aparecen en la parte superior.
            </p>
          </div>
        </div>

        {consulta.isLoading && (
          <output className="small text-surface-muted d-block">Cargando bloqueos...</output>
        )}
        {!consulta.isLoading && bloqueos.length === 0 && (
          <p className="small text-surface-muted mb-0">No tienes bloqueos registrados.</p>
        )}
        {!consulta.isLoading && bloqueos.length > 0 && (
          <div className="bloqueos-list d-flex flex-column gap-2">
            {bloqueos.map((bloqueo) => {
              const estilo = ESTILOS_BLOQUEO[bloqueo.status];
              const razonObj = RAZONES_BLOQUEO.find((item) => item.value === bloqueo.reason);
              const razonTexto = razonObj?.label ?? bloqueo.reason;
              const esActivo = bloqueo.status === 'ACTIVE';

              return (
                <div
                  key={bloqueo.id}
                  className={`bloqueo-card ${esActivo ? 'bloqueo-card--active' : 'bloqueo-card--inactive'}`}
                >
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div>
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <Calendar size={15} className="text-brand-blue flex-shrink-0" aria-hidden="true" />
                          <span className="fw-bold">{formatearFecha(bloqueo.date)}</span>
                        </div>
                        <span className="bloqueo-time-badge">
                          <Clock size={12} className="opacity-75" aria-hidden="true" />
                          {bloqueo.startTime}–{bloqueo.endTime}
                        </span>
                        {razonTexto && (
                          <span className="bloqueo-reason-chip">
                            <Tag size={12} className="opacity-75" aria-hidden="true" />
                            {razonTexto}
                          </span>
                        )}
                      </div>
                      {bloqueo.notes && (
                        <div className="bloqueo-notes-text small text-surface-muted d-flex align-items-center gap-1 mt-1">
                          <Lock size={12} className="opacity-75 flex-shrink-0" aria-hidden="true" />
                          <span className="text-truncate">{bloqueo.notes}</span>
                        </div>
                      )}
                    </div>

                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <span className={`bloqueo-status-badge ${estilo.badgeClase}`}>
                        <span className="bloqueo-status-dot" aria-hidden="true">{estilo.dot}</span>
                        {estilo.label}
                      </span>

                      {esActivo && (
                        <div className="d-flex align-items-center gap-2">
                          <Button
                            type="button"
                            variant="outline-primary"
                            size="sm"
                            icon={<Pencil size={14} aria-hidden="true" />}
                            disabled={guardando || reactivarBloqueo.isPending}
                            onClick={() => iniciarEdicion(bloqueo)}
                            aria-label={'Editar bloqueo del ' + formatearFecha(bloqueo.date)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline-success"
                            size="sm"
                            icon={<RotateCcw size={14} aria-hidden="true" />}
                            disabled={reactivarBloqueo.isPending || guardando}
                            isLoading={reactivarBloqueo.isPending && reactivarBloqueo.variables === bloqueo.id}
                            loadingText="Liberando..."
                            onClick={() => void onLiberarHorario(bloqueo)}
                            aria-label={'Liberar horario del ' + formatearFecha(bloqueo.date) + ' de ' + bloqueo.startTime + ' a ' + bloqueo.endTime}
                          >
                            Liberar horario
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
