import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BrandLogo from '../../../shared/ui/BrandLogo';
import { BRAND } from '../../../config/brand';
import { InstagramIcon, FacebookIcon, MapPinIcon } from './HomeIcons';
import { ProductosEnDesarrolloModal } from './ProductosEnDesarrolloModal';
import { useTenantBrand } from '../../../features/negocio/context/TenantBrandContext';
import { obtenerNegocioSlugActivo } from '../../../shared/lib/http/axios';

export const HomeFooter: React.FC = () => {
  const anioActual = new Date().getFullYear();
  const [productosModalOpen, setProductosModalOpen] = useState(false);
  const { slug: paramSlug } = useParams<{ slug?: string }>();
  const slug = paramSlug || obtenerNegocioSlugActivo() || undefined;
  const basePrefix = slug ? `/${slug}` : '';

  const { nombreNegocio, frasePrincipal, direccion, ciudad, departamento } = useTenantBrand();

  const effectiveName = nombreNegocio || BRAND.name;
  const effectiveAddress = direccion || BRAND.contact.address;
  const locationSubtitle = [ciudad, departamento].filter(Boolean).join(', ') || 'Popayán, Cauca';
  const effectiveTagline = frasePrincipal || BRAND.tagline;

  return (
    <footer className="kyrios-footer" role="contentinfo">
      <div className="container">
        <div className="row g-4 g-lg-5 mb-5">
          {/* Columna Marca & Identidad */}
          <div className="col-12 col-md-5">
            <div className="mb-3">
              <BrandLogo variant="auto" height={36} alt={effectiveName} />
            </div>
            <p className="kyrios-footer-muted small mb-4" style={{ maxWidth: '340px', lineHeight: 1.7 }}>
              {effectiveName} es un concepto de barbería contemporánea{ciudad ? ` en ${ciudad}` : ''}, 
              enfocado en la precisión, la técnica y una experiencia de alto nivel para el cliente actual.
            </p>
            <div className="d-flex align-items-center gap-2">
              <a
                href={BRAND.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="kyrios-social-btn"
                aria-label={`Seguir a ${effectiveName} en Instagram (abre en pestaña nueva)`}
              >
                <InstagramIcon size={18} />
              </a>
              <a
                href={BRAND.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="kyrios-social-btn"
                aria-label={`Seguir a ${effectiveName} en Facebook (abre en pestaña nueva)`}
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
                <Link to={basePrefix || '/'} className="kyrios-footer-link">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to={`${basePrefix}/catalogo/servicios`} className="kyrios-footer-link">
                  Servicios
                </Link>
              </li>
              <li>
                <Link to={`${basePrefix}/catalogo/barberos`} className="kyrios-footer-link">
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
                <a href={`${basePrefix || ''}/#ubicacion`} className="kyrios-footer-link">
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
              <span>{effectiveAddress}</span>
            </div>
            <p className="kyrios-footer-muted small mb-0">
              {locationSubtitle} · Colombia
            </p>
          </div>
        </div>

        {/* Separador y Copyright */}
        <div className="pt-4 kyrios-footer-bottom d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
          <p className="kyrios-footer-muted small mb-0">
            &copy; {anioActual} {effectiveName}. Todos los derechos reservados.
          </p>
          <span className="kyrios-footer-muted small">
            {effectiveTagline}
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
