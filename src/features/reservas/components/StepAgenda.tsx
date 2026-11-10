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

export interface StepAgendaProps {
  isLoading: boolean;
  consultaBarberosServicio?: { isLoading?: boolean };
  servicioSeleccionado?: Servicio | null;
  barberoSeleccionado?: BarberoDisponibleReservaDTO | null;
  barberoFijoId: number | null;
  setBarberoFijoId: (id: number | null) => void;
  irAPaso: (pasoDestino: PasoReserva, forzar?: boolean, estadoAdicional?: Record<string, string | null>) => void;
  paginaFechas: number;
  setPaginaFechas: React.Dispatch<React.SetStateAction<number>>;
  totalPaginasFechas: number;
  fechasDeLaPagina: string[];
  consultasDisponibilidadFechas: {
    data?: { slots: { available: boolean }[] };
    isLoading?: boolean;
    isError?: boolean;
  }[];
  formatearDiaCalendario: (fecha: string) => { semana: string; numero: string; mes: string };
  fechaSeleccionada: string | null;
  setFechaSeleccionada: (fecha: string | null) => void;
  horaSeleccionada: string | null;
  setHoraSeleccionada: (hora: string | null) => void;
  erroresDisponibilidadFechas: { error?: unknown; refetch: () => Promise<unknown> | void }[];
  paginaSinDisponibilidad: boolean;
  disponibilidad: {
    isLoading?: boolean;
    error?: unknown;
    isFetching?: boolean;
    refetch: () => Promise<unknown> | void;
  };
  horariosDisponibles: { startTime: string; endTime: string; available: boolean }[];
  formatearFecha: (fechaIso: string) => string;
  jornadaSeleccionada: JornadaHorario;
  setJornadaSeleccionada: (jornada: JornadaHorario) => void;
  horariosManana: { startTime: string; endTime: string }[];
  horariosTarde: { startTime: string; endTime: string }[];
  horariosNoche: { startTime: string; endTime: string }[];
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
}: StepAgendaProps) {
  if (isLoading || consultaBarberosServicio?.isLoading || !servicioSeleccionado || !barberoSeleccionado) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5" role="status">
        <KyriosSpinner size="md" />
        <span className="small text-surface-muted mt-2">Cargando disponibilidad y horarios...</span>
      </div>
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

        <div className="booking-date-carousel" role="group" aria-label="Fechas con disponibilidad">
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
                  {consulta?.isLoading ? (
                    '···'
                  ) : consulta?.isError ? (
                    '—'
                  ) : cantidadHorarios > 0 ? (
                    <span className="booking-date-capsule__badge">{cantidadHorarios} disp.</span>
                  ) : (
                    <span className="booking-date-capsule__empty">Sin turnos</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
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
        <p className="small text-surface-muted mb-3" role="status">
          Consultando disponibilidad para las fechas de esta semana…
        </p>
      )}

      {fechaSeleccionada && disponibilidad.isLoading && (
        <div className="d-flex justify-content-center py-4" role="status">
          <KyriosSpinner size="md" mensaje="Consultando disponibilidad..." />
        </div>
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
          <div className="booking-daypart-card card-surface p-3 rounded-3" role="tabpanel">
            {jornadaSeleccionada === 'manana' && (
              <>
                <div className="booking-daypart-header d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="booking-daypart-icon booking-daypart-icon--morning">
                      <Sun size={17} />
                    </span>
                    <div>
                      <strong className="booking-daypart-title">Mañana</strong>
                      <span className="booking-daypart-range small text-surface-muted ms-2">09:00 – 12:00</span>
                    </div>
                  </div>
                  <span className="badge rounded-pill bg-body-tertiary text-surface-muted border">
                    {horariosManana.length} {horariosManana.length === 1 ? 'hora disponible' : 'horas disponibles'}
                  </span>
                </div>
                {horariosManana.length > 0 ? (
                  <div className="booking-slots-grid">
                    {horariosManana.map((slot) => {
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
                    <p className="mb-0 small">No hay horarios disponibles en la mañana para este día.</p>
                  </div>
                )}
              </>
            )}

            {jornadaSeleccionada === 'tarde' && (
              <>
                <div className="booking-daypart-header d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="booking-daypart-icon booking-daypart-icon--afternoon">
                      <Sunset size={17} />
                    </span>
                    <div>
                      <strong className="booking-daypart-title">Tarde</strong>
                      <span className="booking-daypart-range small text-surface-muted ms-2">12:00 – 17:00</span>
                    </div>
                  </div>
                  <span className="badge rounded-pill bg-body-tertiary text-surface-muted border">
                    {horariosTarde.length} {horariosTarde.length === 1 ? 'hora disponible' : 'horas disponibles'}
                  </span>
                </div>
                {horariosTarde.length > 0 ? (
                  <div className="booking-slots-grid">
                    {horariosTarde.map((slot) => {
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
                    <p className="mb-0 small">No hay horarios disponibles en la tarde para este día.</p>
                  </div>
                )}
              </>
            )}

            {jornadaSeleccionada === 'noche' && (
              <>
                <div className="booking-daypart-header d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="booking-daypart-icon booking-daypart-icon--night">
                      <Moon size={17} />
                    </span>
                    <div>
                      <strong className="booking-daypart-title">Noche</strong>
                      <span className="booking-daypart-range small text-surface-muted ms-2">17:00 – 20:00</span>
                    </div>
                  </div>
                  <span className="badge rounded-pill bg-body-tertiary text-surface-muted border">
                    {horariosNoche.length} {horariosNoche.length === 1 ? 'hora disponible' : 'horas disponibles'}
                  </span>
                </div>
                {horariosNoche.length > 0 ? (
                  <div className="booking-slots-grid">
                    {horariosNoche.map((slot) => {
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
                    <p className="mb-0 small">No hay horarios disponibles en la noche para este día.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

