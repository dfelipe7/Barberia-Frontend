import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../../shared/ui/BrandLogo';
import { BRAND } from '../../../config/brand';
import { InstagramIcon, FacebookIcon, MapPinIcon } from './HomeIcons';
import { ProductosEnDesarrolloModal } from './ProductosEnDesarrolloModal';

export const HomeFooter: React.FC = () => {
  const anioActual = new Date().getFullYear();
  const [productosModalOpen, setProductosModalOpen] = useState(false);

  return (
    <footer className="kyrios-footer" role="contentinfo">
      <div className="container">
        <div className="row g-4 g-lg-5 mb-5">
          {/* Columna Marca & Identidad */}
          <div className="col-12 col-md-5">
            <div className="mb-3">
              <BrandLogo variant="auto" height={36} alt={BRAND.name} />
            </div>
            <p className="kyrios-footer-muted small mb-4" style={{ maxWidth: '340px', lineHeight: 1.7 }}>
              {BRAND.name} es un concepto de barbería contemporánea en Popayán, 
              enfocado en la precisión, la técnica y una experiencia de alto nivel para el caballero actual.
            </p>
            <div className="d-flex align-items-center gap-2">
              <a
                href={BRAND.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="kyrios-social-btn"
                aria-label="Seguir a Kyrios Studio en Instagram (abre en pestaña nueva)"
              >
                <InstagramIcon size={18} />
              </a>
              <a
                href={BRAND.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="kyrios-social-btn"
                aria-label="Seguir a Kyrios Studio en Facebook (abre en pestaña nueva)"
              >
                <FacebookIcon size={18} />
              </a>
            </div>
          </div>

          {/* Columna Enlaces Rápidos */}
          <div className="col-6 col-md-3">
            <h4
              className="kyrios-subtitle-display kyrios-footer-heading fs-6 mb-3"
              style={{ letterSpacing: '0.08em' }}
            >
              Navegación
            </h4>
            <ul className="list-unstyled mb-0">
              <li>
                <Link to="/" className="kyrios-footer-link">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/catalogo/servicios" className="kyrios-footer-link">
                  Servicios
                </Link>
              </li>
              <li>
                <Link to="/catalogo/barberos" className="kyrios-footer-link">
                  Barberos
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="kyrios-footer-link bg-transparent border-0 p-0 text-start"
                  onClick={() => setProductosModalOpen(true)}
                  aria-label="Productos (sección en desarrollo)"
                >
                  Productos
                </button>
              </li>
              <li>
                <a href="/#ubicacion" className="kyrios-footer-link">
                  Ubicación
                </a>
              </li>
            </ul>
          </div>

          {/* Columna Sede & Contacto */}
          <div className="col-6 col-md-4">
            <h4
              className="kyrios-subtitle-display kyrios-footer-heading fs-6 mb-3"
              style={{ letterSpacing: '0.08em' }}
            >
              Nuestra Sede
            </h4>
            <div className="d-flex align-items-start gap-2 kyrios-footer-muted small mb-2">
              <MapPinIcon size={16} className="mt-1 flex-shrink-0 kyrios-footer-icon" />
              <span>{BRAND.contact.address}</span>
            </div>
            <p className="kyrios-footer-muted small mb-0">
              Popayán, Cauca · Colombia
            </p>
          </div>
        </div>

        {/* Separador y Copyright */}
        <div className="pt-4 kyrios-footer-bottom d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
          <p className="kyrios-footer-muted small mb-0">
            &copy; {anioActual} {BRAND.name}. Todos los derechos reservados.
          </p>
          <span className="kyrios-footer-muted small">
            {BRAND.tagline}
          </span>
        </div>
      </div>

      {/* Modal de Productos en Desarrollo */}
      <ProductosEnDesarrolloModal
        isOpen={productosModalOpen}
        onClose={() => setProductosModalOpen(false)}
      />
    </footer>
  );
};

export default HomeFooter;
