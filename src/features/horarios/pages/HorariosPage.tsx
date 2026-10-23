import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import {
  Clock3,
  Info,
  ChevronDown,
  Copy,
  Maximize2,
  Minimize2,
  Ban,
  CalendarDays,
} from 'lucide-react';
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
import './HorariosPage.css';

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

type HoraInicioFranja = (typeof HORAS_INICIO_FRANJA)[number];

const rutaFranjas = (indice: number) => ('dias.' + indice + '.franjas') as unknown as 'dias.0.franjas';

// Presets comunes de jornada laboral ajustados al cierre oficial de las 20:00
const PRESET_ALMUERZO: HoraInicioFranja[] = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
]; // 09:00 a 13:00 y 14:00 a 20:00 (con 1 hora de almuerzo de 13:00 a 14:00)

/**
 * Agrupa franjas consecutivas en intervalos legibles de texto (ej: 09:00 a 13:00 · 14:00 a 19:00)
 */
const agruparFranjasEnIntervalos = (franjasOrdenadas: string[]) => {
  if (!franjasOrdenadas || franjasOrdenadas.length === 0) {
    return { texto: 'Día de descanso', horas: 0, esDescanso: true };
  }
  if (franjasOrdenadas.length === HORAS_INICIO_FRANJA.length) {
    return {
      texto: '09:00 a 20:00 (Jornada completa)',
      horas: 11,
      esDescanso: false,
    };
  }

  const intervalos: string[] = [];
  let inicioActual: string | null = null;
  let finActual: string | null = null;

  for (let i = 0; i < franjasOrdenadas.length; i++) {
    const hora = franjasOrdenadas[i];
    const siguienteFin = sumarUnaHora(hora);

    if (inicioActual === null) {
      inicioActual = hora;
      finActual = siguienteFin;
    } else if (hora === finActual) {
      finActual = siguienteFin;
    } else {
      intervalos.push(inicioActual + ' a ' + finActual);
      inicioActual = hora;
      finActual = siguienteFin;
    }
  }

  if (inicioActual && finActual) {
    intervalos.push(inicioActual + ' a ' + finActual);
  }

  return {
    texto: intervalos.join(' · '),
    horas: franjasOrdenadas.length,
    esDescanso: false,
  };
};

type TabHorario = 'semanal' | 'bloqueos' | 'disponibilidad';

export const HorariosPage = () => {
  const [tabActiva, setTabActiva] = useState<TabHorario>('semanal');
  const {
    data: horario,
    isLoading: cargando,
    error: errorConsulta,
    refetch: consultarHorario,
  } = useMiHorario();
  const guardarHorario = useGuardarMiHorario();
  const { showToast } = useToastContext();
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  // Control de qué días están expandidos en el acordeón
  const [diasAbiertos, setDiasAbiertos] = useState<Set<DiaSemana>>(() => new Set(['LUNES']));

  // Panel desplegable de copiar horario
  const [mostrandoCopiaPara, setMostrandoCopiaPara] = useState<DiaSemana | null>(null);
  const [diasDestinoSeleccionados, setDiasDestinoSeleccionados] = useState<DiaSemana[]>([]);
  // Memoria temporal por día para recordar la configuración al apagar y reencender el switch
  const [memoriaFranjas, setMemoriaFranjas] = useState<Partial<Record<DiaSemana, HoraInicioFranja[]>>>({});

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
    if (horario) {
      const valores = convertirADatosFormulario(horario);
      reset(valores);

      // Cargar en memoria las franjas de cada día que ya vienen configuradas (sin pisar con vacío los que ya teníamos)
      setMemoriaFranjas((prev) => {
        const combinada = { ...prev };
        valores.dias.forEach((dia) => {
          if (dia.franjas && dia.franjas.length > 0) {
            combinada[dia.diaSemana] = dia.franjas as HoraInicioFranja[];
          }
        });
        return combinada;
      });

      // Abrir por defecto el primer día que tenga franjas activas, o LUNES
      const primerDiaConHoras = DIAS_SEMANA.find((dia) => {
        return horario.franjas.some((f) => f.dayOfWeek === DIA_A_API[dia.codigo]);
      });
      if (primerDiaConHoras) {
        setDiasAbiertos(new Set([primerDiaConHoras.codigo]));
      }
    }
  }, [horario, reset]);

  const diasFormulario = useWatch({ control, name: 'dias' }) ?? [];
  const diasActivos = diasFormulario.filter((dia) => dia.franjas.length > 0).length;
  const totalHorasSemanales = diasFormulario.reduce(
    (acc, dia) => acc + (dia.franjas?.length ?? 0),
    0,
  );

  const toggleDiaAbierto = (codigo: DiaSemana) => {
    setDiasAbiertos((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(codigo)) {
        siguiente.delete(codigo);
      } else {
        siguiente.add(codigo);
      }
      return siguiente;
    });
  };

  const expandirTodos = () => {
    setDiasAbiertos(new Set(DIAS_SEMANA.map((d) => d.codigo)));
  };

  const colapsarTodos = () => {
    setDiasAbiertos(new Set());
  };

  // Switch de activar/apagar día completo
  const toggleDiaActivo = (indice: number, codigo: DiaSemana, franjasActuales: HoraInicioFranja[]) => {
    const ruta = rutaFranjas(indice);
    if (franjasActuales.length > 0) {
      // Guardar en memoria las horas que tenía antes de apagarlo
      setMemoriaFranjas((prev) => ({ ...prev, [codigo]: franjasActuales }));
      // Apagar -> Pasa a descanso (vacío)
      setValue(ruta, [], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    } else {
      // Encender -> Restaura las horas que tenía en memoria o aplica preset estándar
      const guardadas = memoriaFranjas[codigo];
      const siguientes: HoraInicioFranja[] = guardadas && guardadas.length > 0
        ? guardadas
        : [...PRESET_ALMUERZO];

      setValue(ruta, siguientes, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setDiasAbiertos((prev) => new Set(prev).add(codigo));
    }
  };

  // Conmutar un bloque individual (clic fino)
  const toggleFranja = (
    indice: number,
    hora: HoraInicioFranja,
    seleccionadas: HoraInicioFranja[],
    codigo: DiaSemana,
  ) => {
    const ruta = rutaFranjas(indice);
    const marcada = seleccionadas.includes(hora);
    const siguiente: HoraInicioFranja[] = marcada
      ? seleccionadas.filter((h) => h !== hora)
      : [...seleccionadas, hora].sort();

    setValue(ruta, siguiente, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    // Actualizar la memoria si quedan horas
    if (siguiente.length > 0) {
      setMemoriaFranjas((prev) => ({ ...prev, [codigo]: siguiente }));
    }
  };

  // Aplicar un preset rápido
  const aplicarPreset = (
    indice: number,
    tipo: 'almuerzo' | 'completa' | 'limpiar',
    codigo: DiaSemana,
  ) => {
    const ruta = rutaFranjas(indice);
    let siguientes: HoraInicioFranja[] = [];

    if (tipo === 'almuerzo') siguientes = [...PRESET_ALMUERZO];
    else if (tipo === 'completa') siguientes = [...HORAS_INICIO_FRANJA];
    else if (tipo === 'limpiar') siguientes = [];

    setValue(ruta, siguientes, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    if (siguientes.length > 0) {
      setMemoriaFranjas((prev) => ({ ...prev, [codigo]: siguientes }));
    }
  };

  // Iniciar flujo de copia de horario
  const abrirPanelCopia = (codigo: DiaSemana) => {
    if (mostrandoCopiaPara === codigo) {
      setMostrandoCopiaPara(null);
    } else {
      setMostrandoCopiaPara(codigo);
      // Sugerir de Lunes a Viernes excluyendo el día actual
      const sugeridos = DIAS_SEMANA
        .filter((d) => d.codigo !== codigo && d.codigo !== 'SABADO' && d.codigo !== 'DOMINGO')
        .map((d) => d.codigo);
      setDiasDestinoSeleccionados(sugeridos);
    }
  };

  const toggleDiaDestinoCopia = (codigo: DiaSemana) => {
    setDiasDestinoSeleccionados((prev) =>
      prev.includes(codigo) ? prev.filter((d) => d !== codigo) : [...prev, codigo],
    );
  };

  const seleccionarTodosDiasLaborales = (origenCodigo: DiaSemana) => {
    setDiasDestinoSeleccionados(
      DIAS_SEMANA.filter((d) => d.codigo !== origenCodigo && d.codigo !== 'SABADO' && d.codigo !== 'DOMINGO').map(
        (d) => d.codigo,
      ),
    );
  };

  const aplicarCopiaHorario = (_origenCodigo: DiaSemana, franjasOrigen: HoraInicioFranja[]) => {
    if (diasDestinoSeleccionados.length === 0) {
      showToast('warning', 'Selecciona al menos un día de destino.');
      return;
    }

    diasDestinoSeleccionados.forEach((destinoCodigo) => {
      const indiceDestino = DIAS_SEMANA.findIndex((d) => d.codigo === destinoCodigo);
      if (indiceDestino !== -1) {
        setValue(rutaFranjas(indiceDestino), [...franjasOrigen].sort(), {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
    });

    const nombres = diasDestinoSeleccionados
      .map((c) => DIAS_SEMANA.find((d) => d.codigo === c)?.nombre)
      .join(', ');

    showToast('success', `Horario copiado exitosamente a: ${nombres}`);
    setMostrandoCopiaPara(null);
  };

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
      showToast('success', 'Horario semanal guardado correctamente.');
    } catch (error: unknown) {
      const mensaje = mapApiError(error);
      setErrorGuardar(mensaje);
      showToast('danger', mensaje);
    }
  };

  const descartarCambios = () => {
    reset(convertirADatosFormulario(horario));
    setErrorGuardar(null);
    setMostrandoCopiaPara(null);
  };

  return (
    <div className="container px-1 px-sm-3 py-3 py-sm-4" style={{ maxWidth: '1040px' }}>
      <header className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <span className="text-eyebrow d-block mb-2">OPERATIVO / DISPONIBILIDAD</span>
          <h1 className="h2 fw-bold mb-1">Mi horario de atención</h1>
          <p className="text-surface-muted mb-0">
            Configura los días y las horas en los que puedes recibir citas de clientes.
          </p>
        </div>
        <BackLink to="/reservas">Volver a mis reservas</BackLink>
      </header>

      {/* Pestañas de navegación */}
      <div className="horario-nav-tabs" role="tablist" aria-label="Gestión de horarios">
        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === 'semanal'}
          className={`horario-nav-tab ${tabActiva === 'semanal' ? 'active' : ''}`}
          onClick={() => setTabActiva('semanal')}
        >
          <Clock3 size={17} aria-hidden="true" />
          <span>Horario semanal</span>
          {totalHorasSemanales > 0 && (
            <span className="horario-tab-badge">{totalHorasSemanales} hrs</span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === 'bloqueos'}
          className={`horario-nav-tab ${tabActiva === 'bloqueos' ? 'active' : ''}`}
          onClick={() => setTabActiva('bloqueos')}
        >
          <Ban size={17} aria-hidden="true" />
          <span>Ausencias y bloqueos</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === 'disponibilidad'}
          className={`horario-nav-tab ${tabActiva === 'disponibilidad' ? 'active' : ''}`}
          onClick={() => setTabActiva('disponibilidad')}
        >
          <CalendarDays size={17} aria-hidden="true" />
          <span>Consultar disponibilidad</span>
        </button>
      </div>

      <div className="horario-tab-panel">
        {tabActiva === 'semanal' && (
          <section className="horario-card mb-4" role="tabpanel" aria-label="Horario semanal">
            <div className="p-3 p-md-4 pb-0">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h2 className="h5 fw-bold mb-1">Horario semanal</h2>
              <div className="horario-header-stats mt-1">
                <span className="text-surface-muted small">
                  {diasActivos === 0
                    ? 'Sin días configurados'
                    : diasActivos + (diasActivos === 1 ? ' día habilitado' : ' días habilitados')}
                </span>
                <span className="text-surface-muted small">·</span>
                <span className="horario-stat-badge">
                  {totalHorasSemanales} horas semanales
                </span>
              </div>
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
            <div className="alert alert-warning py-2 mb-3">
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
        </div>

        {/* Toolbar para expandir/colapsar todos */}
        <div className="horario-toolbar">
          <span className="small text-surface-muted">
            Toca cualquier día para desplegar sus horas y opciones de copia.
          </span>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={expandirTodos}
              title="Expandir todos los días"
            >
              <Maximize2 size={13} />
              <span className="d-none d-sm-inline">Expandir todos</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={colapsarTodos}
              title="Colapsar todos los días"
            >
              <Minimize2 size={13} />
              <span className="d-none d-sm-inline">Colapsar todos</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onGuardar)} noValidate>
          <fieldset
            className="border-0 p-0 m-0"
            disabled={cargando || guardarHorario.isPending}
          >
            {/* Lista de días en Acordeón */}
            <div className="horario-accordion-list">
              {DIAS_SEMANA.map(({ codigo, nombre }, indice) => {
                const seleccionadas = diasFormulario[indice]?.franjas ?? [];
                const estaAbierto = diasAbiertos.has(codigo);
                const info = agruparFranjasEnIntervalos(seleccionadas);
                const estaActivo = seleccionadas.length > 0;
                const panelCopiaAbierto = mostrandoCopiaPara === codigo;

                return (
                  <div
                    key={codigo}
                    className={
                      'horario-day-item ' +
                      (estaAbierto ? 'horario-day-item--open ' : '') +
                      (!estaActivo ? 'horario-day-item--inactive' : '')
                    }
                  >
                    {/* Header del Acordeón del Día */}
                    <div
                      className="horario-day-header"
                      onClick={() => toggleDiaAbierto(codigo)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleDiaAbierto(codigo);
                        }
                      }}
                      aria-expanded={estaAbierto}
                    >
                      <div className="horario-day-header-left">
                        {/* Switch On/Off */}
                        <label
                          className="horario-switch"
                          onClick={(e) => e.stopPropagation()}
                          title={estaActivo ? 'Desactivar día (Descanso)' : 'Habilitar día'}
                        >
                          <input
                            type="checkbox"
                            checked={estaActivo}
                            onChange={() => toggleDiaActivo(indice, codigo, seleccionadas)}
                          />
                          <span className="horario-switch-slider"></span>
                        </label>

                        {/* Nombre del día */}
                        <span className="horario-day-name">{nombre}</span>

                        {/* Resumen textual cuando está cerrado o abierto */}
                        <span
                          className={
                            'horario-day-summary ' +
                            (info.esDescanso ? 'horario-day-summary--descanso' : '')
                          }
                        >
                          {info.texto}
                        </span>
                      </div>

                      <div className="horario-day-header-right">
                        <span
                          className={
                            'horario-badge-hours ' +
                            (estaActivo ? 'horario-badge-hours--active' : '')
                          }
                        >
                          {estaActivo ? `${info.horas} hrs` : 'Descanso'}
                        </span>
                        <ChevronDown
                          size={18}
                          className={
                            'horario-chevron-icon ' +
                            (estaAbierto ? 'horario-chevron-icon--rotated' : '')
                          }
                        />
                      </div>
                    </div>

                    {/* Cuerpo Desplegable del Día */}
                    {estaAbierto && (
                      <div className="horario-day-body">
                        {/* Barra de Presets Rápidos */}
                        <div className="horario-presets-bar">
                          <span className="horario-presets-label">Rápidos:</span>
                          <button
                            type="button"
                            className="horario-preset-btn"
                            onClick={() => aplicarPreset(indice, 'almuerzo', codigo)}
                            title="09:00 a 13:00 y 14:00 a 20:00 (almuerzo de 13:00 a 14:00)"
                          >
                            Con almuerzo (9–13h y 14–20h)
                          </button>
                          <button
                            type="button"
                            className="horario-preset-btn"
                            onClick={() => aplicarPreset(indice, 'completa', codigo)}
                            title="09:00 a 20:00 (todas las franjas sin pausa)"
                          >
                            Jornada completa (9–20h)
                          </button>
                          <button
                            type="button"
                            className="horario-preset-btn horario-preset-btn--clean"
                            onClick={() => aplicarPreset(indice, 'limpiar', codigo)}
                            title="Vaciar horas y marcar como día de descanso"
                          >
                            Limpiar día
                          </button>

                          <div className="ms-auto">
                            <button
                              type="button"
                              className={
                                'horario-preset-btn d-flex align-items-center gap-1 ' +
                                (panelCopiaAbierto ? 'btn-primary text-white' : '')
                              }
                              onClick={() => abrirPanelCopia(codigo)}
                              title="Replicar este horario en otros días de la semana"
                              disabled={!estaActivo}
                            >
                              <Copy size={13} />
                              <span>Replicar a otros días</span>
                            </button>
                          </div>
                        </div>

                        {/* Panel de copia a otros días */}
                        {panelCopiaAbierto && (
                          <div className="horario-copy-panel mb-3">
                            <div className="horario-copy-targets">
                              <span className="horario-copy-label">
                                Replicar horario de {nombre} hacia:
                              </span>
                              <button
                                type="button"
                                className="horario-copy-day-btn horario-copy-day-btn--shortcut"
                                onClick={() => seleccionarTodosDiasLaborales(codigo)}
                                title="Seleccionar de Lunes a Viernes"
                              >
                                Lunes a Viernes
                              </button>
                              {DIAS_SEMANA.filter((d) => d.codigo !== codigo).map((destino) => {
                                const marcado = diasDestinoSeleccionados.includes(destino.codigo);
                                return (
                                  <button
                                    key={destino.codigo}
                                    type="button"
                                    className={
                                      'horario-copy-day-btn ' +
                                      (marcado ? 'horario-copy-day-btn--selected' : '')
                                    }
                                    onClick={() => toggleDiaDestinoCopia(destino.codigo)}
                                    title={`Alternar ${destino.nombre}`}
                                  >
                                    {destino.nombre.slice(0, 3)}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="d-flex gap-2 align-items-center">
                              <Button
                                type="button"
                                size="sm"
                                variant="primary"
                                className="horario-copy-action-btn"
                                onClick={() => aplicarCopiaHorario(codigo, seleccionadas)}
                                disabled={diasDestinoSeleccionados.length === 0}
                              >
                                {`Aplicar a ${diasDestinoSeleccionados.length} ${
                                  diasDestinoSeleccionados.length === 1 ? 'día' : 'días'
                                }`}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline-secondary"
                                className="horario-copy-action-btn"
                                onClick={() => setMostrandoCopiaPara(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Grilla de Bloques Horarios (Control Fino) */}
                        <div className="horario-slots-grid">
                          {HORAS_INICIO_FRANJA.map((hora) => {
                            const marcada = seleccionadas.includes(hora);
                            const horaFin = sumarUnaHora(hora);

                            return (
                              <button
                                key={hora}
                                type="button"
                                className={
                                  'horario-slot-chip ' +
                                  (marcada ? 'horario-slot-chip--active' : '')
                                }
                                onClick={() => toggleFranja(indice, hora, seleccionadas, codigo)}
                                aria-pressed={marcada}
                                title={`${hora} a ${horaFin} (${marcada ? 'Habilitada - clic para quitar' : 'Libre - clic para habilitar'})`}
                              >
                                <span className="horario-slot-time">{hora}</span>
                                <span className="horario-slot-range">hasta {horaFin}</span>
                              </button>
                            );
                          })}
                        </div>

                        <p className="small text-surface-muted mb-0">
                          <span className="text-info">💡 Consejo:</span> Toca cualquier bloque para encenderlo o apagarlo individualmente según tu necesidad.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pie de tarjeta con nota informativa y botones de acción */}
            <div className="p-3 p-md-4 pt-3 border-top border-secondary border-opacity-10">
              <div className="d-flex align-items-start gap-2 small text-surface-muted mb-3">
                <Info size={16} className="flex-shrink-0 mt-1" aria-hidden="true" />
                <p className="mb-0">
                  El backend guarda cada bloque como una franja de 60 minutos entre 09:00 y 20:00.
                  Los bloques no seleccionados se consideran tiempos libres o de descanso. Si eliminas una franja que ya contiene reservas agendadas por clientes, el sistema te lo notificará antes de proceder.
                </p>
              </div>

              <div className="d-flex flex-column flex-sm-row justify-content-sm-end gap-2">
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={descartarCambios}
                  disabled={!isDirty || guardarHorario.isPending}
                  className="w-100 w-sm-auto"
                >
                  Descartar cambios
                </Button>
                <Button
                  type="submit"
                  isLoading={guardarHorario.isPending}
                  loadingText="Guardando horario..."
                  className="w-100 w-sm-auto"
                >
                  Guardar horario
                </Button>
              </div>
            </div>
          </fieldset>
        </form>
          </section>
        )}

        {tabActiva === 'bloqueos' && (
          <div role="tabpanel" aria-label="Ausencias y bloqueos">
            <BloqueosHorarioSection />
          </div>
        )}

        {tabActiva === 'disponibilidad' && (
          <div role="tabpanel" aria-label="Consultar disponibilidad">
            <DisponibilidadFechaSection />
          </div>
        )}
      </div>
    </div>
  );
};

export default HorariosPage;
