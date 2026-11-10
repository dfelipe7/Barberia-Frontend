import React from 'react';
import { Calendar, Check, Moon, Sun, Sunset } from 'lucide-react';
import type { Servicio } from '../../servicios/types/servicios.types';
import type { BarberoDisponibleReservaDTO } from '../api/reservas.dto';
import type { PasoReserva } from './BookingStepper';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';

export type JornadaHorario = 'manana' | 'tarde' | 'noche';

const CONFIG_JORNADAS: Record<JornadaHorario, {
  readonly titulo: string;
  readonly rango: string;
  readonly icono: React.ReactNode;
  readonly iconoClase: string;
  readonly mensajeVacio: string;
}> = {
  manana: {
    titulo: 'Mañana',
    rango: '09:00 – 12:00',
    icono: <Sun size={17} />,
    iconoClase: 'booking-daypart-icon--morning',
    mensajeVacio: 'No hay horarios disponibles en la mañana para este día.',
  },
  tarde: {
    titulo: 'Tarde',
    rango: '12:00 – 17:00',
    icono: <Sunset size={17} />,
    iconoClase: 'booking-daypart-icon--afternoon',
    mensajeVacio: 'No hay horarios disponibles en la tarde para este día.',
  },
  noche: {
    titulo: 'Noche',
    rango: '17:00 – 20:00',
    icono: <Moon size={17} />,
    iconoClase: 'booking-daypart-icon--night',
    mensajeVacio: 'No hay horarios disponibles en la noche para este día.',
  },
};

export interface StepAgendaProps {
  readonly isLoading: boolean;
  readonly consultaBarberosServicio?: { readonly isLoading?: boolean };
  readonly servicioSeleccionado?: Servicio | null;
  readonly barberoSeleccionado?: BarberoDisponibleReservaDTO | null;
  readonly barberoFijoId: number | null;
  readonly setBarberoFijoId: (id: number | null) => void;
  readonly irAPaso: (pasoDestino: PasoReserva, forzar?: boolean, estadoAdicional?: Record<string, string | null>) => void;
  readonly paginaFechas: number;
  readonly setPaginaFechas: React.Dispatch<React.SetStateAction<number>>;
  readonly totalPaginasFechas: number;
  readonly fechasDeLaPagina: readonly string[];
  readonly consultasDisponibilidadFechas: readonly {
    readonly data?: { readonly slots: readonly { readonly available: boolean }[] };
    readonly isLoading?: boolean;
    readonly isError?: boolean;
  }[];
  readonly formatearDiaCalendario: (fecha: string) => { semana: string; numero: string; mes: string };
  readonly fechaSeleccionada: string | null;
  readonly setFechaSeleccionada: (fecha: string | null) => void;
  readonly horaSeleccionada: string | null;
  readonly setHoraSeleccionada: (hora: string | null) => void;
  readonly erroresDisponibilidadFechas: readonly { readonly error?: unknown; readonly refetch: () => Promise<unknown> | void }[];
  readonly paginaSinDisponibilidad: boolean;
  readonly disponibilidad: {
    readonly isLoading?: boolean;
    readonly error?: unknown;
    readonly isFetching?: boolean;
    readonly refetch: () => Promise<unknown> | void;
  };
  readonly horariosDisponibles: readonly { readonly startTime: string; readonly endTime: string; readonly available: boolean }[];
  readonly formatearFecha: (fechaIso: string) => string;
  readonly jornadaSeleccionada: JornadaHorario;
  readonly setJornadaSeleccionada: (jornada: JornadaHorario) => void;
  readonly horariosManana: readonly { readonly startTime: string; readonly endTime: string }[];
  readonly horariosTarde: readonly { readonly startTime: string; readonly endTime: string }[];
  readonly horariosNoche: readonly { readonly startTime: string; readonly endTime: string }[];
}

function renderEstadoCapsula(
  consulta?: { isLoading?: boolean; isError?: boolean },
  cantidadHorarios = 0
) {
  if (consulta?.isLoading) {
    return '···';
  }
  if (consulta?.isError) {
    return '—';
  }
  if (cantidadHorarios > 0) {
    return <span className="booking-date-capsule__badge">{cantidadHorarios} disp.</span>;
  }
  return <span className="booking-date-capsule__empty">Sin turnos</span>;
}

export default function StepAgenda({
  isLoading,
  consultaBarberosServicio,
  servicioSeleccionado,
  barberoSeleccionado,
  barberoFijoId,
  setBarberoFijoId,
  irAPaso,
  paginaFechas,
  setPaginaFechas,
  totalPaginasFechas,
  fechasDeLaPagina,
  consultasDisponibilidadFechas,
  formatearDiaCalendario,
  fechaSeleccionada,
  setFechaSeleccionada,
  horaSeleccionada,
  setHoraSeleccionada,
  erroresDisponibilidadFechas,
  paginaSinDisponibilidad,
  disponibilidad,
  horariosDisponibles,
  formatearFecha,
  jornadaSeleccionada,
  setJornadaSeleccionada,
  horariosManana,
  horariosTarde,
  horariosNoche,
}: Readonly<StepAgendaProps>) {
  if (isLoading || consultaBarberosServicio?.isLoading || !servicioSeleccionado || !barberoSeleccionado) {
    return (
      <output className="d-flex flex-column align-items-center justify-content-center py-5 w-100">
        <KyriosSpinner size="md" />
        <span className="small text-surface-muted mt-2">Cargando disponibilidad y horarios...</span>
      </output>
    );
  }

  return (
    <section aria-labelledby="seleccionar-fecha-titulo" className="booking-section">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="booking-step-badge">Paso 3</span>
            <h2 id="seleccionar-fecha-titulo" className="h4 fw-bold mb-0">
              Elige fecha y hora
            </h2>
          </div>
          <p className="small text-surface-muted mb-0">
            Disponibilidad de agenda para <strong>{barberoSeleccionado.nombre}</strong>.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline-secondary"
            onClick={() => {
              if (barberoFijoId) {
                setBarberoFijoId(null);
                irAPaso(2, false, { barberoFijo: null, barberoId: null, fecha: null, hora: null });
              } else {
                irAPaso(2, false, { barberoId: null, barberoFijo: null, fecha: null, hora: null });
              }
            }}
          >
            Cambiar barbero
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline-secondary"
            onClick={() => irAPaso(1, false, { fecha: null, hora: null })}
          >
            Cambiar servicio
          </Button>
        </div>
      </div>

      {/* Carrusel de fechas de la semana */}
      <div className="booking-calendar-card card-surface p-3 p-md-4 rounded-3 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <span className="fw-semibold small">Fechas de atención (próximos 30 días)</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline-secondary"
              disabled={paginaFechas === 0}
              onClick={() => setPaginaFechas((pagina) => Math.max(0, pagina - 1))}
            >
              Semana anterior
            </Button>
            <span className="small text-surface-muted px-1" aria-live="polite">
              {paginaFechas + 1} de {totalPaginasFechas}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline-secondary"
              disabled={paginaFechas >= totalPaginasFechas - 1}
              onClick={() => setPaginaFechas((pagina) => Math.min(totalPaginasFechas - 1, pagina + 1))}
            >
              Semana siguiente
            </Button>
          </div>
        </div>

        <fieldset className="booking-date-carousel border-0 p-0 m-0" aria-label="Fechas con disponibilidad">
          {fechasDeLaPagina.map((fecha, indice) => {
            const consulta = consultasDisponibilidadFechas[indice];
            const cantidadHorarios = consulta?.data?.slots.filter((slot) => slot.available).length ?? 0;
            const etiquetasFecha = formatearDiaCalendario(fecha);
            const seleccionada = fechaSeleccionada === fecha;
            const deshabilitada = !consulta || consulta.isLoading || consulta.isError || cantidadHorarios === 0;

            return (
              <button
                key={fecha}
                type="button"
                className={'booking-date-capsule ' + (
                  seleccionada ? 'booking-date-capsule--selected' : ''
                )}
                aria-pressed={seleccionada}
                aria-label={`${etiquetasFecha.semana} ${etiquetasFecha.numero} de ${etiquetasFecha.mes}: ${cantidadHorarios} horarios disponibles`}
                disabled={deshabilitada}
                onClick={() => {
                  setFechaSeleccionada(fecha);
                  setHoraSeleccionada(null);
                }}
              >
                <span className="booking-date-capsule__day">{etiquetasFecha.semana}</span>
                <span className="booking-date-capsule__num">{etiquetasFecha.numero}</span>
                <span className="booking-date-capsule__month">{etiquetasFecha.mes}</span>
                <span className="booking-date-capsule__status">
                  {renderEstadoCapsula(consulta, cantidadHorarios)}
                </span>
              </button>
            );
          })}
        </fieldset>
      </div>

      {erroresDisponibilidadFechas.length > 0 && (
        <div className="alert alert-warning d-flex flex-wrap align-items-center justify-content-between gap-2" role="alert">
          <ErrorMessage message={mapApiError(erroresDisponibilidadFechas[0].error)} />
          <Button
            type="button"
            size="sm"
            variant="outline-warning"
            onClick={() => erroresDisponibilidadFechas.forEach((consulta) => void consulta.refetch())}
          >
            Reintentar consulta
          </Button>
        </div>
      )}

      {paginaSinDisponibilidad && !fechaSeleccionada && (
        <p className="alert alert-light border mb-3">
          No hay fechas con horarios disponibles en esta semana.
        </p>
      )}

      {!fechaSeleccionada && erroresDisponibilidadFechas.length === 0 && !paginaSinDisponibilidad && (
        <output className="small text-surface-muted mb-3 d-block">
          Consultando disponibilidad para las fechas de esta semana…
        </output>
      )}

      {fechaSeleccionada && disponibilidad.isLoading && (
        <output className="d-flex justify-content-center py-4 w-100">
          <KyriosSpinner size="md" mensaje="Consultando disponibilidad..." />
        </output>
      )}

      {Boolean(fechaSeleccionada && disponibilidad.error) && (
        <div className="alert alert-warning">
          <ErrorMessage message={mapApiError(disponibilidad.error)} />
          <button
            type="button"
            className="btn btn-sm btn-outline-warning mt-2"
            onClick={() => void disponibilidad.refetch()}
            disabled={disponibilidad.isFetching}
          >
            Reintentar
          </button>
        </div>
      )}

      {fechaSeleccionada && !disponibilidad.isLoading && !disponibilidad.error && horariosDisponibles.length === 0 && (
        <div className="alert alert-light border rounded-3 p-3 mb-0 text-center">
          <p className="mb-0 text-surface-muted">
            No hay turnos disponibles para <strong>{formatearFecha(fechaSeleccionada)}</strong> con {barberoSeleccionado.nombre}. Te invitamos a seleccionar otro día con disponibilidad.
          </p>
        </div>
      )}

      {fechaSeleccionada && !disponibilidad.isLoading && !disponibilidad.error && horariosDisponibles.length > 0 && (
        <div className="booking-slots-container mt-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h3 className="h6 fw-bold mb-0 text-capitalize">
                Horas disponibles · {formatearFecha(fechaSeleccionada)}
              </h3>
              <span className="small text-surface-muted">
                {horariosDisponibles.length} {horariosDisponibles.length === 1 ? 'horario disponible' : 'horarios disponibles'} para este día
              </span>
            </div>
          </div>

          {/* Pestañas de turnos: Mañana, Tarde, Noche */}
          <div className="booking-daypart-tabs" role="tablist" aria-label="Turnos disponibles">
            <button
              type="button"
              role="tab"
              aria-selected={jornadaSeleccionada === 'manana'}
              className={`booking-daypart-tab ${jornadaSeleccionada === 'manana' ? 'is-active' : ''}`}
              onClick={() => setJornadaSeleccionada('manana')}
            >
              <Sun size={16} aria-hidden="true" />
              <span>Mañana</span>
              <span className="booking-daypart-tab-badge">{horariosManana.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={jornadaSeleccionada === 'tarde'}
              className={`booking-daypart-tab ${jornadaSeleccionada === 'tarde' ? 'is-active' : ''}`}
              onClick={() => setJornadaSeleccionada('tarde')}
            >
              <Sunset size={16} aria-hidden="true" />
              <span>Tarde</span>
              <span className="booking-daypart-tab-badge">{horariosTarde.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={jornadaSeleccionada === 'noche'}
              className={`booking-daypart-tab ${jornadaSeleccionada === 'noche' ? 'is-active' : ''}`}
              onClick={() => setJornadaSeleccionada('noche')}
            >
              <Moon size={16} aria-hidden="true" />
              <span>Noche</span>
              <span className="booking-daypart-tab-badge">{horariosNoche.length}</span>
            </button>
          </div>

          {/* Contenido del turno activo */}
          {(() => {
            const configActiva = CONFIG_JORNADAS[jornadaSeleccionada];
            const mapaHorarios: Record<JornadaHorario, typeof horariosManana> = {
              manana: horariosManana,
              tarde: horariosTarde,
              noche: horariosNoche,
            };
            const horariosActivos = mapaHorarios[jornadaSeleccionada];

            return (
              <div className="booking-daypart-card card-surface p-3 rounded-3" role="tabpanel">
                <div className="booking-daypart-header d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className={`booking-daypart-icon ${configActiva.iconoClase}`}>
                      {configActiva.icono}
                    </span>
                    <div>
                      <strong className="booking-daypart-title">{configActiva.titulo}</strong>
                      <span className="booking-daypart-range small text-surface-muted ms-2">{configActiva.rango}</span>
                    </div>
                  </div>
                  <span className="badge rounded-pill bg-body-tertiary text-surface-muted border">
                    {horariosActivos.length} {horariosActivos.length === 1 ? 'hora disponible' : 'horas disponibles'}
                  </span>
                </div>
                {horariosActivos.length > 0 ? (
                  <div className="booking-slots-grid">
                    {horariosActivos.map((slot) => {
                      const activo = slot.startTime === horaSeleccionada;
                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          className={`booking-slot-pill ${activo ? 'booking-slot-pill--active' : ''}`}
                          aria-pressed={activo}
                          onClick={() => setHoraSeleccionada(slot.startTime)}
                        >
                          <span className="booking-slot-range">
                            <span className="booking-slot-time">{slot.startTime}</span>
                            <span className="booking-slot-end">a {slot.endTime}</span>
                          </span>
                          {activo && <Check size={13} className="booking-slot-check" aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-surface-muted">
                    <p className="mb-0 small">{configActiva.mensajeVacio}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}

