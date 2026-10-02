import React from 'react';
import { useBarberosCatalogo } from '../../../features/barberos/api/barberos.facade';
import type { BarberoCatalogo } from '../../../features/barberos/types/barberos.types';
import BarberCard from './BarberCard';

interface BarbersSectionProps {
  onReservarBarbero: (barbero: BarberoCatalogo) => void;
}

export const BarbersSection: React.FC<BarbersSectionProps> = ({
  onReservarBarbero,
}) => {
  const { data: barberos = [], isLoading, error, refetch } = useBarberosCatalogo();

  return (
    <section
      id="barberos"
      className="kyrios-section kyrios-section--alt"
      aria-labelledby="barberos-heading"
    >
      <div className="container">
        {/* Encabezado de la sección */}
        <div className="kyrios-section-header text-center mx-auto" style={{ maxWidth: '680px' }}>
          <span className="kyrios-eyebrow justify-content-center mb-2">
            Equipo de Maestros
          </span>
          <h2
            id="barberos-heading"
            className="kyrios-section-title kyrios-title-display"
          >
            Nuestros Barberos
          </h2>
          <p className="kyrios-section-desc mx-auto">
            Profesionales comprometidos con el detalle, la higiene y la satisfacción 
            absoluta en cada sesión.
          </p>
        </div>

        {/* Estado: Cargando */}
        {isLoading && (
          <div className="row g-4" aria-busy="true" aria-label="Cargando barberos">
            {[1, 2, 3].map((n) => (
              <div key={n} className="col-12 col-sm-6 col-lg-4">
                <div
                  className="kyrios-barber-card"
                  style={{ minHeight: '380px', opacity: 0.6 }}
                >
                  <div
                    className="kyrios-barber-img-wrap d-flex align-items-center justify-content-center"
                    style={{ background: 'var(--home-surface-alt)' }}
                  >
                    <div className="spinner-border spinner-border-sm text-secondary" role="status" />
                  </div>
                  <div className="p-4">
                    <div
                      className="placeholder-glow mb-2"
                      style={{ height: '22px', width: '70%', background: 'var(--home-surface-border)' }}
                    />
                    <div
                      className="placeholder-glow"
                      style={{ height: '14px', width: '40%', background: 'var(--home-meta-border)' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado: Error */}
        {!isLoading && error && (
          <div className="text-center py-5">
            <p className="kyrios-section-desc mb-3 mx-auto">
              No fue posible cargar el equipo de barberos en este momento.
            </p>
            <button
              type="button"
              className="btn-kyrios-dark px-3 py-1"
              onClick={() => refetch()}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Estado: Vacío */}
        {!isLoading && !error && barberos.length === 0 && (
          <div
            className="text-center py-5 border border-dashed rounded p-4"
            style={{ borderColor: 'var(--home-surface-border)' }}
          >
            <p className="kyrios-section-desc mb-0 mx-auto">
              Nuestro equipo de profesionales estará disponible para reservas muy pronto.
            </p>
          </div>
        )}

        {/* Estado: Lista de Barberos */}
        {!isLoading && !error && barberos.length > 0 && (
          <div className="row g-4 justify-content-center">
            {barberos.map((barbero) => (
              <div key={barbero.id} className="col-12 col-sm-6 col-lg-4">
                <BarberCard
                  barbero={barbero}
                  onReservar={onReservarBarbero}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BarbersSection;
