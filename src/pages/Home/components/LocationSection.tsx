import React from 'react';
import { BRAND } from '../../../config/brand';
import { MapPinIcon, ArrowUpRightIcon, ClockIcon } from './HomeIcons';
import { useTenantBrand } from '../../../features/negocio/context/TenantBrandContext';

export const LocationSection: React.FC = () => {
  const { nombreNegocio, direccion, ciudad, departamento, referencia, mapsUrl, latitud, longitud } = useTenantBrand();

  const effectiveName = nombreNegocio || BRAND.name;
  const effectiveCity = ciudad || 'Popayán';
  const effectiveAddress = direccion || BRAND.contact.address;
  const effectiveMapsUrl = mapsUrl || BRAND.contact.mapsUrl;
  const locationSubtitle = [ciudad, departamento].filter(Boolean).join(', ') || 'Popayán, Cauca';

  // Si hay coordenadas GPS configuradas, centrar exactamente en ellas.
  // De lo contrario, centrar en la dirección y ciudad en Colombia.
  const queryEmbed =
    latitud && longitud
      ? `${latitud},${longitud}`
      : encodeURIComponent(`${effectiveAddress}, ${effectiveCity}, Colombia`);
  const mapEmbedUrl = `https://maps.google.com/maps?q=${queryEmbed}&hl=es&z=16&output=embed`;

  return (
    <section id="ubicacion" className="kyrios-section" aria-labelledby="ubicacion-heading">
      <div className="container">
        <div className="kyrios-location-card">
          <div className="row g-0">
            {/* Información de ubicación y cómo llegar */}
            <div className="col-12 col-lg-6 p-4 p-md-5 d-flex flex-column justify-content-center">
              <span className="kyrios-eyebrow mb-2">Visítanos en {effectiveCity}</span>

              <h2
                id="ubicacion-heading"
                className="kyrios-section-title kyrios-title-display mb-3"
              >
                Encuéntranos
              </h2>

              <p className="kyrios-location-desc mb-4">
                Ubicados en un sector estratégico de {effectiveCity}, {effectiveName} ofrece instalaciones
                modernas, cómodas y diseñadas para que tu momento de barbería sea una experiencia
                de relajación y estilo.
              </p>

              <div className="d-flex flex-column gap-3 mb-4">
                <div className="d-flex align-items-start gap-3">
                  <div className="kyrios-location-icon-box">
                    <MapPinIcon size={20} />
                  </div>
                  <div>
                    <h3 className="kyrios-location-item-title fs-6 fw-bold mb-1">Dirección oficial</h3>
                    <p className="kyrios-location-item-desc small mb-0">{effectiveAddress}</p>
                    {referencia && (
                      <span className="text-muted small d-block mt-0.5" style={{ fontSize: '0.78rem' }}>
                        Ref: {referencia}
                      </span>
                    )}
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="kyrios-location-icon-box">
                    <ClockIcon size={20} />
                  </div>
                  <div>
                    <h3 className="kyrios-location-item-title fs-6 fw-bold mb-1">Horario de atención</h3>
                    <p className="kyrios-location-item-desc small mb-0">
                      Lunes a Sábado: 8:00 AM – 8:00 PM <br />
                      Domingos y Festivos: 9:00 AM – 3:00 PM
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <a
                  href={effectiveMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-kyrios-primary d-inline-flex align-items-center gap-1.5"
                  aria-label={`Abrir ruta hacia ${effectiveName} en Google Maps`}
                >
                  <MapPinIcon size={16} />
                  <span>Cómo llegar</span>
                  <ArrowUpRightIcon size={14} />
                </a>
              </div>
            </div>

            {/* Representación visual moderna: Mapa real de calles + Baliza de radar luminosa */}
            <div className="col-12 col-lg-6 position-relative">
              <div className="kyrios-map-visual">
                {/* 1. Mapa real de Google Maps de fondo con filtro dark sofisticado */}
                <iframe
                  title={`Ubicación de ${effectiveName} en Google Maps`}
                  src={mapEmbedUrl}
                  className="kyrios-map-iframe"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  aria-hidden="true"
                />

                {/* Sutil viñeta para integrar el mapa con la tarjeta */}
                <div className="kyrios-map-overlay" aria-hidden="true" />

                {/* 2. Baliza de radar luminosa pulsando sobre la ubicación */}
                <div className="kyrios-map-radar" aria-hidden="true">
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(var(--tenant-primary-rgb, 0, 113, 188), 0.28)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 30px var(--tenant-glow, rgba(0, 113, 188, 0.75))',
                    }}
                  >
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: 'var(--tenant-color-primario, #0071BC)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                      }}
                    >
                      <MapPinIcon size={16} />
                    </div>
                  </div>
                </div>

                {/* 3. Tarjeta Glassmorphism flotante con estado y detalles */}
                <div className="kyrios-map-glass-card">
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                    <span className="kyrios-status-badge">
                      <span className="kyrios-status-dot" />
                      Sede oficial
                    </span>
                    <a
                      href={effectiveMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="kyrios-map-open-btn"
                      title="Abrir mapa en Google Maps"
                    >
                      <span>Abrir mapa</span>
                      <ArrowUpRightIcon size={11} />
                    </a>
                  </div>
                  <div className="fw-semibold text-white small text-truncate" title={effectiveAddress}>
                    {effectiveAddress}
                  </div>
                  <div className="text-white-50" style={{ fontSize: '0.74rem' }}>
                    {referencia ? `${referencia} · ` : ''}{locationSubtitle}
                  </div>
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
