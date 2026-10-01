import React from 'react';
import { BRAND } from '../../../config/brand';
import { MapPinIcon, ArrowUpRightIcon, ClockIcon } from './HomeIcons';

export const LocationSection: React.FC = () => {
  return (
    <section id="ubicacion" className="kyrios-section" aria-labelledby="ubicacion-heading">
      <div className="container">
        <div className="kyrios-location-card">
          <div className="row g-0">
            {/* Información de ubicación y cómo llegar */}
            <div className="col-12 col-lg-6 p-4 p-md-5 d-flex flex-column justify-content-center">
              <span className="kyrios-eyebrow mb-2">Visítanos en Popayán</span>

              <h2
                id="ubicacion-heading"
                className="kyrios-section-title kyrios-title-display mb-3"
              >
                Encuéntranos
              </h2>

              <p className="text-muted mb-4" style={{ lineHeight: 1.7 }}>
                Ubicados en un sector estratégico de Popayán, ofrecemos instalaciones
                modernas, cómodas y diseñadas para que tu momento de barbería sea una experiencia
                de relajación y estilo.
              </p>

              <div className="d-flex flex-column gap-3 mb-4">
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="p-2 rounded"
                    style={{
                      background: 'rgba(0, 113, 188, 0.1)',
                      color: 'var(--brand-blue, #0071BC)',
                    }}
                  >
                    <MapPinIcon size={20} />
                  </div>
                  <div>
                    <h3 className="fs-6 fw-bold mb-1">Dirección oficial</h3>
                    <p className="text-muted small mb-0">{BRAND.contact.address}</p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div
                    className="p-2 rounded"
                    style={{
                      background: 'rgba(0, 113, 188, 0.1)',
                      color: 'var(--brand-blue, #0071BC)',
                    }}
                  >
                    <ClockIcon size={20} />
                  </div>
                  <div>
                    <h3 className="fs-6 fw-bold mb-1">Horario de atención</h3>
                    <p className="text-muted small mb-0">
                      Lunes a Sábado: 8:00 AM – 8:00 PM <br />
                      Domingos y Festivos: 9:00 AM – 3:00 PM
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <a
                  href={BRAND.contact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-kyrios-primary d-inline-flex"
                  aria-label="Abrir ruta hacia Kyrios Studio en Google Maps (se abre en nueva pestaña)"
                >
                  <MapPinIcon size={16} />
                  <span>Cómo llegar</span>
                  <ArrowUpRightIcon size={14} />
                </a>
              </div>
            </div>

            {/* Representación visual moderna del mapa */}
            <div className="col-12 col-lg-6">
              <div className="kyrios-map-visual">
                <div className="kyrios-map-grid" aria-hidden="true" />
                <div className="kyrios-map-radar" aria-hidden="true">
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'rgba(0, 113, 188, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 25px rgba(0, 113, 188, 0.6)',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'var(--brand-blue, #0071BC)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MapPinIcon size={16} />
                    </div>
                  </div>
                </div>

                <div
                  className="position-absolute bottom-0 start-0 end-0 p-3 text-center"
                  style={{ background: 'linear-gradient(to top, rgba(12,12,12,0.9), transparent)' }}
                >
                  <span className="text-white-50 small fw-semibold">
                    Sector Norte · Popayán, Cauca
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
