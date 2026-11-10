import { Check, UserRound } from 'lucide-react';
import type { Servicio } from '../../servicios/types/servicios.types';
import type { BarberoDisponibleReservaDTO } from '../api/reservas.dto';
import type { PasoReserva } from './BookingStepper';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { mapApiError } from '../../../shared/lib/mapApiError';
import Button from '../../../shared/ui/Button';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';

export interface StepBarberosProps {
  isLoading: boolean;
  servicioSeleccionado?: Servicio | null;
  reservaId?: number | null;
  irAPaso: (pasoDestino: PasoReserva, forzar?: boolean, estadoAdicional?: Record<string, string | null>) => void;
  consultaBarberosServicio?: {
    isLoading?: boolean;
    error?: unknown;
    isSuccess?: boolean;
    isFetching?: boolean;
    refetch: () => Promise<unknown> | void;
  };
  barberosDelServicio: BarberoDisponibleReservaDTO[];
  barberoId: number | null;
  onSelectBarbero: (barbero: BarberoDisponibleReservaDTO) => void;
}

export default function StepBarberos({
  isLoading,
  servicioSeleccionado,
  reservaId,
  irAPaso,
  consultaBarberosServicio,
  barberosDelServicio,
  barberoId,
  onSelectBarbero,
}: StepBarberosProps) {
  if (isLoading || !servicioSeleccionado) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5" role="status">
        <KyriosSpinner size="md" />
        <span className="small text-surface-muted mt-2">Cargando datos del servicio...</span>
      </div>
    );
  }

  return (
    <section aria-labelledby="seleccionar-barbero-titulo" className="booking-section">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="booking-step-badge">Paso 2</span>
            <h2 id="seleccionar-barbero-titulo" className="h4 fw-bold mb-0">
              Elige a tu barbero
            </h2>
          </div>
          <p className="small text-surface-muted mb-0">
            Profesionales certificados para {servicioSeleccionado.nombre}.
          </p>
        </div>
        {!reservaId && (
          <Button
            type="button"
            size="sm"
            variant="outline-secondary"
            onClick={() => irAPaso(1, false, { barberoId: null })}
          >
            Cambiar servicio
          </Button>
        )}
      </div>

      {consultaBarberosServicio?.isLoading && (
        <div className="d-flex justify-content-center py-5" role="status">
          <KyriosSpinner size="md" mensaje="Cargando barberos habilitados para el servicio..." />
        </div>
      )}

      {Boolean(consultaBarberosServicio?.error) && (
        <div className="alert alert-warning">
          <ErrorMessage message={mapApiError(consultaBarberosServicio?.error)} />
          <button
            type="button"
            className="btn btn-sm btn-outline-warning mt-2"
            onClick={() => void consultaBarberosServicio?.refetch()}
            disabled={consultaBarberosServicio?.isFetching}
          >
            Reintentar
          </button>
        </div>
      )}

      {consultaBarberosServicio?.isSuccess && barberosDelServicio.length === 0 && (
        <p className="alert alert-light border mb-0">No hay barberos para este servicio.</p>
      )}

      {barberosDelServicio.length > 0 && (
        <div className="row g-3">
          {barberosDelServicio.map((barbero) => {
            const seleccionado = barbero.id === barberoId;
            const foto = obtenerUrlFoto(barbero.fotoUrl);
            return (
              <div className="col-12 col-sm-6 col-lg-4" key={barbero.id}>
                <button
                  type="button"
                  className={'booking-card booking-barber-card card card-surface w-100 h-100 text-center p-4 ' + (
                    seleccionado ? 'booking-card--selected' : ''
                  )}
                  aria-pressed={seleccionado}
                  onClick={() => onSelectBarbero(barbero)}
                >
                  {seleccionado && (
                    <span className="booking-card__check-indicator" aria-hidden="true">
                      <Check size={14} />
                    </span>
                  )}
                  <div className="booking-barber-avatar-wrap mx-auto mb-3">
                    {foto ? (
                      <img
                        src={foto}
                        alt=""
                        className="booking-barber-avatar rounded-circle object-fit-cover"
                        style={{ width: '92px', height: '92px' }}
                        loading="lazy"
                      />
                    ) : (
                      <span
                        className="booking-barber-avatar rounded-circle bg-body-secondary d-flex align-items-center justify-content-center"
                        style={{ width: '92px', height: '92px' }}
                        aria-hidden="true"
                      >
                        <UserRound size={36} className="text-surface-muted" />
                      </span>
                    )}
                  </div>
                  <span className="booking-barber-name fw-bold d-block text-truncate mb-1">
                    {barbero.nombre} {barbero.apellido}
                  </span>
                  <span className="booking-barber-role small text-surface-muted d-block mb-3">
                    Master Barber · Profesional
                  </span>
                  <div className="mt-auto">
                    <span
                      className={`badge rounded-pill booking-barber-status-badge ${
                        seleccionado
                          ? 'booking-barber-status-badge--selected'
                          : 'booking-barber-status-badge--available'
                      }`}
                    >
                      {seleccionado ? 'Seleccionado' : 'Disponible'}
                    </span>
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
