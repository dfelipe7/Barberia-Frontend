import { Check, Clock3, Scissors, UserRound } from 'lucide-react';
import type { Servicio } from '../../servicios/types/servicios.types';
import type { BarberoDisponibleReservaDTO } from '../api/reservas.dto';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { mapApiError } from '../../../shared/lib/mapApiError';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';

export interface StepServiciosProps {
  readonly barberoFijo: BarberoDisponibleReservaDTO | null;
  readonly onClearBarberoFijo: () => void;
  readonly isLoading: boolean;
  readonly cargandoServiciosDelBarbero: boolean;
  readonly erroresServiciosDelBarbero: boolean;
  readonly isFetchingConsultasBarberos: boolean;
  readonly onRetryConsultasBarberos: () => void;
  readonly error: unknown;
  readonly onRetryServicios: () => void;
  readonly serviciosActivos: readonly Servicio[];
  readonly servicioId: number | null;
  readonly onSelectServicio: (servicio: Servicio) => void;
  readonly formatearPrecio: (valor: number) => string;
}

export default function StepServicios({
  barberoFijo,
  onClearBarberoFijo,
  isLoading,
  cargandoServiciosDelBarbero,
  erroresServiciosDelBarbero,
  isFetchingConsultasBarberos,
  onRetryConsultasBarberos,
  error,
  onRetryServicios,
  serviciosActivos,
  servicioId,
  onSelectServicio,
  formatearPrecio,
}: Readonly<StepServiciosProps>) {
  return (
    <section aria-labelledby="seleccionar-servicio-titulo" className="booking-section">
      <div className="booking-section-header mb-3">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="booking-step-badge">Paso 1</span>
          <h2 id="seleccionar-servicio-titulo" className="h4 fw-bold mb-0">
            Elige un servicio
          </h2>
        </div>
        <p className="small text-surface-muted mb-0">
          Selecciona el servicio que deseas agendar. Cada opción detalla duración y tarifa.
        </p>
      </div>

      {barberoFijo && (
        <div className="booking-fixed-banner alert d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
          <div className="d-flex align-items-center gap-2">
            <UserRound size={18} className="text-primary flex-shrink-0" />
            <span>
              Reservando con <strong>{barberoFijo.nombre} {barberoFijo.apellido}</strong>. Mostrando los servicios que este barbero realiza.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={onClearBarberoFijo}
          >
            Ver todos los servicios
          </button>
        </div>
      )}

      {(isLoading || cargandoServiciosDelBarbero) && (
        <output className="d-flex justify-content-center py-5 w-100">
          <KyriosSpinner
            size="md"
            mensaje={cargandoServiciosDelBarbero ? 'Buscando servicios del barbero...' : 'Cargando servicios...'}
          />
        </output>
      )}

      {erroresServiciosDelBarbero && (
        <div className="alert alert-warning">
          <ErrorMessage message="No fue posible consultar qué servicios ofrece este barbero." />
          <button
            type="button"
            className="btn btn-sm btn-outline-warning mt-2"
            onClick={onRetryConsultasBarberos}
            disabled={isFetchingConsultasBarberos}
          >
            Reintentar
          </button>
        </div>
      )}

      {Boolean(error) && (
        <div className="alert alert-warning">
          <ErrorMessage message={mapApiError(error)} />
          <button
            type="button"
            className="btn btn-sm btn-outline-warning mt-2"
            onClick={onRetryServicios}
            disabled={isLoading}
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !cargandoServiciosDelBarbero && !error && !erroresServiciosDelBarbero && serviciosActivos.length === 0 && (
        <p className="alert alert-light border mb-0">
          No hay servicios disponibles para reservar.
        </p>
      )}

      {!isLoading && !cargandoServiciosDelBarbero && !error && serviciosActivos.length > 0 && (
        <div className="row g-3">
          {serviciosActivos.map((servicio) => {
            const foto = obtenerUrlFoto(servicio.fotoUrl);
            const seleccionado = servicio.id === servicioId;
            return (
              <div className="col-12 col-sm-6 col-lg-4" key={servicio.id}>
                <button
                  type="button"
                  className={'booking-card booking-service-card card card-surface w-100 h-100 text-start p-0 overflow-hidden ' + (
                    seleccionado ? 'booking-card--selected' : ''
                  )}
                  aria-pressed={seleccionado}
                  onClick={() => onSelectServicio(servicio)}
                >
                  {seleccionado && (
                    <span className="booking-card__check-indicator" aria-hidden="true">
                      <Check size={14} />
                    </span>
                  )}
                  {foto ? (
                    <div
                      className="booking-card__media position-relative overflow-hidden w-100 d-flex align-items-center justify-content-center"
                      style={{ height: '136px', background: '#0d0d0d' }}
                    >
                      <img
                        src={foto}
                        alt=""
                        aria-hidden="true"
                        className="position-absolute"
                        style={{
                          inset: '-10px',
                          width: 'calc(100% + 20px)',
                          height: 'calc(100% + 20px)',
                          objectFit: 'cover',
                          filter: 'blur(10px) brightness(0.35)',
                          transform: 'scale(1.15)',
                          pointerEvents: 'none',
                        }}
                      />
                      <img
                        src={foto}
                        alt=""
                        className="position-relative booking-card__img"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          zIndex: 1,
                          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
                        }}
                        loading="lazy"
                      />
                      <span className="booking-card__duration-badge">
                        <Clock3 size={12} />
                        {servicio.duracionMinutos} min
                      </span>
                    </div>
                  ) : (
                    <div
                      className="booking-card__media position-relative d-flex align-items-center justify-content-center bg-body-secondary"
                      style={{ height: '136px' }}
                      aria-hidden="true"
                    >
                      <Scissors size={32} className="text-surface-muted" />
                      <span className="booking-card__duration-badge">
                        <Clock3 size={12} />
                        {servicio.duracionMinutos} min
                      </span>
                    </div>
                  )}
                  <div className="card-body d-flex flex-column p-3">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                      <span className="h6 fw-bold mb-0 text-truncate">{servicio.nombre}</span>
                    </div>
                    <p className="booking-flow__service-description small text-surface-muted flex-grow-1 mb-3">
                      {servicio.descripcion || 'Servicio profesional de barbería con atención de primer nivel.'}
                    </p>
                    <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-auto">
                      <span className="small text-surface-muted">Precio</span>
                      <span className="booking-card__price fw-bold text-primary">
                        {formatearPrecio(servicio.precio)}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
