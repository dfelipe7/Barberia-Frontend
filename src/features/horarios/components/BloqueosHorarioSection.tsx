import { useState } from 'react';
import { isAxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Ban, Pencil, RotateCcw } from 'lucide-react';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useToastContext } from '../../../shared/ui/ToastContext';
import {
  useActualizarBloqueoHorario,
  useBloqueosHorario,
  useCancelarBloqueoHorario,
  useCrearBloqueoHorario,
  useMiHorario,
  useReactivarBloqueoHorario,
} from '../api/horarios.facade';
import type { BloqueoHorarioDTO, DiaSemanaApi, RazonBloqueoHorarioDTO } from '../api/horarios.dto';
import {
  noDisponibilidadSchema,
  type NoDisponibilidadFormValues,
} from '../schemas/noDisponibilidad.schema';

const ESTADOS_BLOQUEO = {
  ACTIVE: 'Bloqueando',
  REACTIVATED: 'Liberado',
  CANCELLED: 'Cancelado',
} as const;

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

const ordenarBloqueos = (bloqueos: BloqueoHorarioDTO[]) =>
  [...bloqueos].sort((a, b) =>
    (a.date + a.startTime).localeCompare(b.date + b.startTime),
  );

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
  ) return [];

  const inicio = minutosDeHora(horaInicio);
  const fin = minutosDeHora(horaFin);
  if (inicio >= fin || (fin - inicio) % 60 !== 0) return [];

  const diaSemana = DIAS_POR_INDICE[fechaCalendario.getUTCDay()];
  const permitidas = new Set(
    franjasSemanales
      .filter((franja) => franja.dayOfWeek === diaSemana)
      .map((franja) => franja.startTime),
  );
  const fuera: string[] = [];

  for (let minutos = inicio; minutos < fin; minutos += 60) {
    const hora = String(Math.floor(minutos / 60)).padStart(2, '0') + ':00';
    if (!permitidas.has(hora)) fuera.push(hora);
  }

  return fuera;
};

const mensajeErrorBloqueo = (error: unknown) => {
  if (isAxiosError(error)) {
    if (error.response?.status === 503) {
      return 'No pudimos comprobar si ya hay una cita en ese horario. Inténtalo de nuevo más tarde.';
    }
    const data = error.response?.data as {
      code?: string;
      message?: string | string[];
      mensaje?: string;
    } | undefined;
    if (data?.code === 'SCHEDULE_BLOCK_HAS_RESERVATIONS') {
      return 'No puedes bloquear este rango porque ya tiene una cita reservada.';
    }
    const mensaje = [data?.mensaje, ...(Array.isArray(data?.message) ? data.message : [data?.message])]
      .filter((item): item is string => typeof item === 'string')
      .join(' ');
    if (mensaje.includes('BLOCK_OUTSIDE_SCHEDULE')) {
      return 'El rango elegido incluye horas que no están en tu horario semanal.';
    }
    if (mensaje.includes('SCHEDULE_BLOCK_HAS_RESERVATIONS')) {
      return 'No puedes bloquear este rango porque ya tiene una cita reservada.';
    }
  }
  return mapApiError(error);
};

export const BloqueosHorarioSection = () => {
  const consulta = useBloqueosHorario();
  const horarioSemanal = useMiHorario();
  const crearBloqueo = useCrearBloqueoHorario();
  const actualizarBloqueo = useActualizarBloqueoHorario();
  const cancelarBloqueo = useCancelarBloqueoHorario();
  const reactivarBloqueo = useReactivarBloqueoHorario();
  const { showToast } = useToastContext();
  const [bloqueoEnEdicion, setBloqueoEnEdicion] = useState<BloqueoHorarioDTO | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<NoDisponibilidadFormValues>({
    resolver: zodResolver(noDisponibilidadSchema),
    defaultValues: valoresVacios,
  });

  const fecha = useWatch({ control, name: 'fecha' }) ?? '';
  const horaInicio = useWatch({ control, name: 'horaInicio' }) ?? '';
  const horaFin = useWatch({ control, name: 'horaFin' }) ?? '';
  const notas = useWatch({ control, name: 'notas' }) ?? '';
  const rangoValido = Boolean(
    fecha && horaInicio && horaFin && horaInicio < horaFin &&
    (minutosDeHora(horaFin) - minutosDeHora(horaInicio)) % 60 === 0,
  );
  const horasFuera = rangoValido && horarioSemanal.data
    ? franjasFueraDeHorario(fecha, horaInicio, horaFin, horarioSemanal.data.franjas ?? [])
    : [];
  const guardando = crearBloqueo.isPending || actualizarBloqueo.isPending;

  const onGuardar = async (valores: NoDisponibilidadFormValues) => {
    if (horarioSemanal.isLoading || horarioSemanal.isError || !horarioSemanal.data) {
      showToast('danger', 'No pudimos consultar tu horario semanal. Recarga la información antes de guardar el bloqueo.');
      return;
    }

    const horasQueNoOfreces = franjasFueraDeHorario(
      valores.fecha,
      valores.horaInicio,
      valores.horaFin,
      horarioSemanal.data.franjas ?? [],
    );
    if (horasQueNoOfreces.length > 0) {
      showToast(
        'danger',
        'El rango incluye ' + horasQueNoOfreces.join(', ') + ', que no hacen parte de tu horario semanal para ese día.',
      );
      return;
    }

    const notaLimpia = valores.notas.trim();
    try {
      if (bloqueoEnEdicion) {
        await actualizarBloqueo.mutateAsync({
          id: bloqueoEnEdicion.id,
          datos: {
            date: valores.fecha,
            startTime: valores.horaInicio,
            endTime: valores.horaFin,
            reason: valores.razon || null,
            notes: notaLimpia || null,
          },
        });
        showToast('success', 'Los cambios del bloqueo se guardaron correctamente.');
      } else {
        await crearBloqueo.mutateAsync({
          date: valores.fecha,
          startTime: valores.horaInicio,
          endTime: valores.horaFin,
          ...(valores.razon ? { reason: valores.razon } : {}),
          ...(notaLimpia ? { notes: notaLimpia } : {}),
        });
        showToast('success', 'Bloqueo guardado correctamente.');
      }
      setBloqueoEnEdicion(null);
      reset(valoresVacios);
    } catch (error: unknown) {
      showToast('danger', mensajeErrorBloqueo(error));
    }
  };

  const iniciarEdicion = (bloqueo: BloqueoHorarioDTO) => {
    setBloqueoEnEdicion(bloqueo);
    reset({
      fecha: bloqueo.date,
      horaInicio: bloqueo.startTime,
      horaFin: bloqueo.endTime,
      razon: bloqueo.reason ?? '',
      notas: bloqueo.notes ?? '',
    });
    document.getElementById('bloqueo-fecha')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const cancelarEdicion = () => {
    setBloqueoEnEdicion(null);
    reset(valoresVacios);
  };

  const onCancelar = async (bloqueo: BloqueoHorarioDTO) => {
    if (!window.confirm('Este bloqueo se marcará como cancelado y dejará de ocultar el horario. ¿Deseas continuar?')) return;
    try {
      const resultado = await cancelarBloqueo.mutateAsync(bloqueo.id);
      showToast('success', resultado.mensaje || 'Bloqueo cancelado correctamente.');
    } catch (error: unknown) {
      showToast('danger', mensajeErrorBloqueo(error));
    }
  };

  const onReactivar = async (id: number) => {
    try {
      const resultado = await reactivarBloqueo.mutateAsync(id);
      showToast('success', resultado.mensaje || 'Franja liberada correctamente.');
    } catch (error: unknown) {
      showToast('danger', mensajeErrorBloqueo(error));
    }
  };

  const bloqueos = ordenarBloqueos(consulta.data ?? []);
  const horaFinRegistrada = register('horaFin');

  return (
    <section className="card card-surface border-0 shadow-sm mt-4">
      <div className="card-body p-3 p-md-4">
        <div className="mb-3">
          <h2 className="h5 fw-bold mb-1">Ausencias y bloqueos temporales</h2>
          <p className="small text-surface-muted mb-0">
            Bloquea una o más horas de tu jornada. Los horarios se seleccionan en punto y deben estar ofrecidos en el día elegido.
          </p>
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

        <form onSubmit={handleSubmit(onGuardar)} noValidate>
          <fieldset className="border-0 p-0 m-0" disabled={guardando}>
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-3">
                <label htmlFor="bloqueo-fecha" className="form-label small fw-semibold">Fecha</label>
                <input
                  id="bloqueo-fecha"
                  type="date"
                  className={'form-control' + (errors.fecha ? ' is-invalid' : '')}
                  aria-invalid={Boolean(errors.fecha)}
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
                <label htmlFor="bloqueo-razon" className="form-label small fw-semibold">Motivo <span className="text-surface-muted fw-normal">(opcional)</span></label>
                <select id="bloqueo-razon" className="form-select" {...register('razon')}>
                  <option value="">Selecciona un motivo</option>
                  {RAZONES_BLOQUEO.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}
                </select>
              </div>

              <div className="col-12 col-md-2 d-grid">
                <Button type="submit" isLoading={guardando} loadingText="Guardando...">
                  {bloqueoEnEdicion ? 'Guardar cambios' : 'Guardar bloqueo'}
                </Button>
              </div>
            </div>

            <div className="row g-3 mt-0 align-items-end">
              <div className="col-12 col-lg-9">
                <label htmlFor="bloqueo-notas" className="form-label small fw-semibold">Nota privada <span className="text-surface-muted fw-normal">(opcional)</span></label>
                <textarea
                  id="bloqueo-notas"
                  className={'form-control' + (errors.notas ? ' is-invalid' : '')}
                  rows={2}
                  maxLength={500}
                  aria-describedby="bloqueo-notas-ayuda"
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
          <p className="small text-surface-muted mt-3 mb-0" role="status">Consultando tu horario semanal para validar el bloqueo...</p>
        )}
        {rangoValido && horarioSemanal.data && horasFuera.length > 0 && (
          <div className="alert alert-danger py-2 mt-3 mb-0" role="alert">
            El rango incluye {horasFuera.join(', ')}, horas que no están ofrecidas en tu horario semanal para ese día. Cambia el intervalo o actualiza primero tu horario semanal.
          </div>
        )}
        {rangoValido && horarioSemanal.data && horasFuera.length === 0 && (
          <p className="small text-success mt-3 mb-0" role="status">
            El rango coincide con tu horario semanal.
          </p>
        )}

        <hr className="my-4" />

        <h3 className="h6 fw-bold mb-3">Historial de bloqueos</h3>
        {consulta.isLoading ? (
          <p className="small text-surface-muted" role="status">Cargando bloqueos...</p>
        ) : bloqueos.length === 0 ? (
          <p className="small text-surface-muted mb-0">No tienes bloqueos registrados.</p>
        ) : (
          <ul className="list-group list-group-flush">
            {bloqueos.map((bloqueo) => (
              <li
                key={bloqueo.id}
                className="list-group-item card-surface px-0 d-flex flex-wrap align-items-center justify-content-between gap-2"
              >
                <span>
                  <span className="fw-semibold d-block">{formatearFecha(bloqueo.date)}</span>
                  <span className="small text-surface-muted d-block">
                    {bloqueo.startTime}–{bloqueo.endTime}
                    {bloqueo.reason ? ' · ' + (RAZONES_BLOQUEO.find((item) => item.value === bloqueo.reason)?.label ?? bloqueo.reason) : ''}
                    {bloqueo.notes ? ' · ' + bloqueo.notes : ''}
                  </span>
                </span>
                <span className="d-flex flex-wrap align-items-center gap-2">
                  <span
                    className={
                      'badge rounded-pill ' +
                      (bloqueo.status === 'ACTIVE' ? 'text-bg-warning' : 'text-bg-light border')
                    }
                  >
                    {ESTADOS_BLOQUEO[bloqueo.status]}
                  </span>
                  {bloqueo.status === 'ACTIVE' && (
                    <>
                      <Button
                        type="button"
                        variant="outline-primary"
                        size="sm"
                        icon={<Pencil size={15} aria-hidden="true" />}
                        disabled={guardando || cancelarBloqueo.isPending || reactivarBloqueo.isPending}
                        onClick={() => iniciarEdicion(bloqueo)}
                        aria-label={'Editar bloqueo del ' + formatearFecha(bloqueo.date)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline-success"
                        size="sm"
                        icon={<RotateCcw size={15} aria-hidden="true" />}
                        disabled={cancelarBloqueo.isPending || reactivarBloqueo.isPending || guardando}
                        isLoading={reactivarBloqueo.isPending && reactivarBloqueo.variables === bloqueo.id}
                        loadingText="Liberando..."
                        onClick={() => void onReactivar(bloqueo.id)}
                        aria-label={'Liberar horario del ' + formatearFecha(bloqueo.date) + ' de ' + bloqueo.startTime + ' a ' + bloqueo.endTime}
                      >
                        Liberar horario
                      </Button>
                      <Button
                        type="button"
                        variant="outline-danger"
                        size="sm"
                        icon={<Ban size={15} aria-hidden="true" />}
                        disabled={cancelarBloqueo.isPending || reactivarBloqueo.isPending || guardando}
                        isLoading={cancelarBloqueo.isPending && cancelarBloqueo.variables === bloqueo.id}
                        loadingText="Cancelando..."
                        onClick={() => void onCancelar(bloqueo)}
                        aria-label={'Cancelar bloqueo del ' + formatearFecha(bloqueo.date)}
                      >
                        Cancelar bloqueo
                      </Button>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
