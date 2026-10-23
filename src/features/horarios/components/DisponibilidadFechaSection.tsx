import { useState, type FormEvent } from 'react';
import { Calendar, CalendarDays, Clock } from 'lucide-react';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { useDisponibilidadFecha } from '../api/horarios.facade';
import type { EstadoFranjaDTO } from '../api/horarios.dto';

interface EstadoConfig {
  label: string;
  badgeClase: string;
  slotClase: string;
  dot: string;
}

const CONFIG_ESTADOS: Record<EstadoFranjaDTO, EstadoConfig> = {
  AVAILABLE: {
    label: 'Disponible',
    badgeClase: 'disp-status-badge--available',
    slotClase: 'disp-slot-card--available',
    dot: '●',
  },
  RESERVED: {
    label: 'Reservado',
    badgeClase: 'disp-status-badge--reserved',
    slotClase: 'disp-slot-card--reserved',
    dot: '●',
  },
  BLOCKED: {
    label: 'Bloqueado',
    badgeClase: 'disp-status-badge--blocked',
    slotClase: 'disp-slot-card--blocked',
    dot: '●',
  },
  GENERAL_CLOSURE: {
    label: 'Cierre general',
    badgeClase: 'disp-status-badge--closure',
    slotClase: 'disp-slot-card--closure',
    dot: '✕',
  },
  OUTSIDE_SCHEDULE: {
    label: 'Fuera de horario',
    badgeClase: 'disp-status-badge--outside',
    slotClase: 'disp-slot-card--outside',
    dot: '○',
  },
};

const formatearFecha = (valor: string) => {
  const [anio, mes, dia] = valor.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(
    new Date(anio, mes - 1, dia, 12),
  );
};

const formatearDiaRelativo = (diasDesdeHoy: number) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeHoy);
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DisponibilidadFechaSection = () => {
  const hoy = formatearDiaRelativo(0);
  const manana = formatearDiaRelativo(1);
  const pasadoManana = formatearDiaRelativo(2);

  const anioActual = new Date().getFullYear();
  const fechaMin = `${anioActual - 1}-01-01`;
  const fechaMax = `${anioActual + 1}-12-31`;

  const [fecha, setFecha] = useState(hoy);
  const [fechaConsultada, setFechaConsultada] = useState(hoy);
  const consulta = useDisponibilidadFecha(fechaConsultada);

  const consultar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (fecha) setFechaConsultada(fecha);
  };

  const seleccionarFechaRapida = (nuevaFecha: string) => {
    setFecha(nuevaFecha);
    setFechaConsultada(nuevaFecha);
  };

  const slots = consulta.data?.slots ?? [];
  const disponibles = slots.filter((s) => s.status === 'AVAILABLE').length;
  const reservadas = slots.filter((s) => s.status === 'RESERVED').length;
  const bloqueadas = slots.filter((s) => s.status === 'BLOCKED').length;
  const fueraHorario = slots.filter((s) => s.status === 'OUTSIDE_SCHEDULE').length;
  const cierres = slots.filter((s) => s.status === 'GENERAL_CLOSURE').length;

  return (
    <section className="card card-surface border-0 shadow-sm mt-4">
      <div className="card-body p-3 p-md-4">
        <div className="mb-3">
          <h2 className="h5 fw-bold mb-1">Consultar disponibilidad</h2>
          <p className="small text-surface-muted mb-0">
            Revisa el estado de cada franja en tiempo real para cualquier fecha de tu calendario.
          </p>
        </div>

        <div className="disp-form-box p-3 p-md-4 rounded-3 mb-4">
          <form onSubmit={consultar} className="row g-3 align-items-end">
            <div className="col-12 col-sm-6 col-md-5">
              <label htmlFor="disponibilidad-fecha" className="form-label small fw-semibold">
                Fecha (toca para elegir día)
              </label>
              <input
                id="disponibilidad-fecha"
                type="date"
                className="form-control"
                value={fecha}
                min={fechaMin}
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
                onChange={(event) => {
                  const nuevaFecha = event.target.value;
                  setFecha(nuevaFecha);
                  if (nuevaFecha) setFechaConsultada(nuevaFecha);
                }}
                required
              />
            </div>
            <div className="col-12 col-sm-auto">
              <Button type="submit" icon={<CalendarDays size={16} aria-hidden="true" />}>
                Consultar fecha
              </Button>
            </div>
          </form>

          {/* Atajos de fecha rápida */}
          <div className="d-flex flex-wrap align-items-center gap-2 mt-3 pt-3 border-top border-secondary border-opacity-10">
            <span className="small text-surface-muted me-1">Atajos rápidos:</span>
            <button
              type="button"
              className={`disp-quick-pill ${fechaConsultada === hoy ? 'disp-quick-pill--active' : ''}`}
              onClick={() => seleccionarFechaRapida(hoy)}
            >
              Hoy
            </button>
            <button
              type="button"
              className={`disp-quick-pill ${fechaConsultada === manana ? 'disp-quick-pill--active' : ''}`}
              onClick={() => seleccionarFechaRapida(manana)}
            >
              Mañana
            </button>
            <button
              type="button"
              className={`disp-quick-pill ${fechaConsultada === pasadoManana ? 'disp-quick-pill--active' : ''}`}
              onClick={() => seleccionarFechaRapida(pasadoManana)}
            >
              Pasado mañana
            </button>
          </div>
        </div>

        {fechaConsultada && (
          <div aria-live="polite">
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
            ) : slots.length > 0 ? (
              <div>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <Calendar size={18} className="text-brand-blue" aria-hidden="true" />
                    <h3 className="h6 fw-bold mb-0">
                      Franjas del {formatearFecha(consulta.data?.fecha || fechaConsultada)}
                    </h3>
                  </div>

                  {/* Resumen de estados para la fecha */}
                  <div className="disp-summary-strip d-flex flex-wrap align-items-center gap-2">
                    {disponibles > 0 && (
                      <span className="disp-status-badge disp-status-badge--available small">
                        <span className="disp-status-dot" aria-hidden="true">●</span>
                        {disponibles} {disponibles === 1 ? 'disponible' : 'disponibles'}
                      </span>
                    )}
                    {reservadas > 0 && (
                      <span className="disp-status-badge disp-status-badge--reserved small">
                        <span className="disp-status-dot" aria-hidden="true">●</span>
                        {reservadas} {reservadas === 1 ? 'reservada' : 'reservadas'}
                      </span>
                    )}
                    {bloqueadas > 0 && (
                      <span className="disp-status-badge disp-status-badge--blocked small">
                        <span className="disp-status-dot" aria-hidden="true">●</span>
                        {bloqueadas} {bloqueadas === 1 ? 'bloqueada' : 'bloqueadas'}
                      </span>
                    )}
                    {fueraHorario > 0 && (
                      <span className="disp-status-badge disp-status-badge--outside small">
                        <span className="disp-status-dot" aria-hidden="true">○</span>
                        {fueraHorario} fuera de horario
                      </span>
                    )}
                    {cierres > 0 && (
                      <span className="disp-status-badge disp-status-badge--closure small">
                        <span className="disp-status-dot" aria-hidden="true">✕</span>
                        {cierres} {cierres === 1 ? 'cierre general' : 'cierres'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="disp-slots-grid">
                  {slots.map((slot) => {
                    const config = CONFIG_ESTADOS[slot.status] ?? {
                      label: slot.status,
                      badgeClase: 'disp-status-badge--outside',
                      slotClase: 'disp-slot-card--outside',
                      dot: '●',
                    };

                    return (
                      <div
                        key={slot.startTime}
                        className={`disp-slot-card ${config.slotClase}`}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <Clock size={15} className="disp-slot-clock" aria-hidden="true" />
                          <span className="disp-slot-time fw-semibold">
                            {slot.startTime}–{slot.endTime}
                          </span>
                        </div>
                        <span className={`disp-status-badge ${config.badgeClase}`}>
                          <span className="disp-status-dot" aria-hidden="true">{config.dot}</span>
                          {config.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
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
