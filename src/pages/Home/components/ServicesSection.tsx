import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useServiciosCatalogo, esServicioActivoConBarberos } from '../../../features/servicios/api/servicios.facade';
import type { Servicio } from '../../../features/servicios/types/servicios.types';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import ServiceCard from './ServiceCard';
import { ArrowUpRightIcon } from './HomeIcons';

interface ServicesSectionProps {
  onReservarServicio: (servicio: Servicio) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onReservarServicio,
}) => {
  const { slug } = useParams<{ slug?: string }>();
  const basePrefix = slug ? `/${slug}` : '';
  const { data: servicios = [], isLoading, error, refetch } = useServiciosCatalogo();

  // REGLA DE NEGOCIO PÚBLICA: Los servicios inactivos (estado !== 'ACTIVO') NUNCA
  // deben mostrarse a los clientes en la HomePage pública.
  // El backend restringe la respuesta a ACTIVOS, y esta cláusula client-side garantiza
  // que ningún servicio inactivo sea visible o seleccionable.
  const serviciosActivos = servicios.filter(esServicioActivoConBarberos);

  return (
    <section id="servicios" className="kyrios-section" aria-labelledby="servicios-heading">
      <div className="container">
        {/* Cabecera de la sección */}
        <div className="kyrios-section-header text-center mx-auto" style={{ maxWidth: '680px' }}>
          <span className="kyrios-eyebrow justify-content-center mb-2">
            Catálogo Profesional
          </span>
          <h2 id="servicios-heading" className="kyrios-section-title kyrios-title-display">
            Nuestros Servicios
          </h2>
          <p className="kyrios-section-desc mx-auto">
            Técnicas de barbería clásica y contemporánea ejecutadas con precisión milimétrica 
            y los mejores productos del mercado.
          </p>
        </div>

        {/* Estado: Cargando */}
        {isLoading && (
          <div className="row g-2 g-sm-3 g-md-4 catalog-grid-2col" aria-busy="true" aria-label="Cargando catálogo de servicios">
            {[1, 2, 3].map((n) => (
              <div key={n} className="col-6 col-md-6 col-lg-4">
                <div
                  className="kyrios-service-card"
                  style={{ opacity: 0.6 }}
                >
                  <div
                    className="kyrios-service-img-wrap d-flex align-items-center justify-content-center"
                    style={{ background: 'var(--home-surface-alt)' }}
                  >
                    <KyriosSpinner size="sm" aria-hidden="true" />
                  </div>
                  <div className="p-3">
                    <div
                      className="placeholder-glow mb-2"
                      style={{ height: '22px', width: '60%', background: 'var(--home-surface-border)' }}
                    />
                    <div
                      className="placeholder-glow mb-1"
                      style={{ height: '14px', width: '90%', background: 'var(--home-meta-border)' }}
                    />
                    <div
                      className="placeholder-glow"
                      style={{ height: '14px', width: '75%', background: 'var(--home-meta-border)' }}
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
              No se pudo sincronizar el catálogo de servicios en este momento.
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
        {!isLoading && !error && serviciosActivos.length === 0 && (
          <div className="text-center py-5 border border-dashed rounded p-4" style={{ borderColor: 'var(--home-surface-border)' }}>
            <p className="kyrios-section-desc mb-0 mx-auto">
              Pronto publicaremos nuestros nuevos servicios y tarifas actualizadas.
            </p>
          </div>
        )}

        {/* Estado: Lista de Servicios Activos — máx. 3 en Home */}
        {!isLoading && !error && serviciosActivos.length > 0 && (
          <>
            <div className="row g-3 g-lg-4">
              {serviciosActivos.slice(0, 3).map((servicio) => (
                <div key={servicio.id} className="col-12 col-md-6 col-lg-4">
                  <ServiceCard
                    servicio={servicio}
                    onReservar={onReservarServicio}
                  />
                </div>
              ))}
            </div>

            {/* CTA: solo visible si hay más de 3 servicios */}
            {serviciosActivos.length > 3 && (
              <div className="text-center mt-5">
                <Link
                  to={`${basePrefix}/catalogo/servicios`}
                  className="btn-kyrios-outline d-inline-flex align-items-center gap-2"
                >
                  Ver catálogo completo
                  <ArrowUpRightIcon size={16} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ServicesSection;
