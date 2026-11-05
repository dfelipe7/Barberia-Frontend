import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { BRAND } from '../../../config/brand';
import { useTenantBrand } from '../../../features/negocio/context/TenantBrandContext';

export const VisionSection: React.FC = () => {
  const { nombreNegocio, bannerUrl, ciudad } = useTenantBrand();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const effectiveName = nombreNegocio || BRAND.name;
  const effectiveBanner = bannerUrl || BRAND.assets.banner;
  const effectiveCity = ciudad || 'Popayán';

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Activa la animación solo cuando la sección entra al viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      id="vision"
      ref={sectionRef}
      className={`kyrios-section kyrios-section--alt kyrios-vision ${
        isVisible ? 'kyrios-fade-in' : 'kyrios-vision--hidden'
      }`}
      aria-labelledby="vision-heading"
    >
      <div className="container">
        <div className="row g-4 g-lg-5 align-items-center">
          {/* Columna Izquierda: Imagen editorial */}
          <div className="col-12 col-lg-6">
            <div className="kyrios-vision-media">
              <img
                src={effectiveBanner}
                alt={`Ambiente y atención de alto estándar en ${effectiveName}`}
                className="kyrios-vision-img"
                loading="lazy"
              />
              <div className="kyrios-vision-badge" aria-hidden="true">
                <span className="kyrios-vision-badge__text">
                  EST. 2026 · {effectiveCity.toUpperCase()} COLOMBIA
                </span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Texto editorial con jerarquía */}
          <div className="col-12 col-lg-6">
            <div className="kyrios-vision-content">
              <span className="kyrios-eyebrow mb-2">
                Nuestra Filosofía
              </span>

              <h2 id="vision-heading" className="kyrios-section-title kyrios-title-display mb-3">
                No hacemos cortes. Diseñamos presencia.
              </h2>

              <p className="kyrios-vision-text mb-3">
                Consolidar a {effectiveName} como un referente en barbería de calidad,
                integrando servicio personalizado, educación, productos de primer nivel y una experiencia única para cada cliente.
              </p>

              <p className="kyrios-vision-text mb-4">
                Buscamos transformar la manera de vivir el arte de la barbería, creando momentos de relajación y estilo,
                formando nuevas generaciones de artistas e impulsando el profesionalismo del oficio.
              </p>

              <blockquote className="kyrios-vision-quote mb-4">
                <p className="mb-0">
                  &ldquo;Cada detalle cuenta porque cada cliente importa.&rdquo;
                </p>
              </blockquote>

              <div className="text-center text-lg-start">
                <a
                  href="#ubicacion"
                  className="btn-kyrios-outline d-inline-flex align-items-center justify-content-center gap-2"
                  aria-label="Conoce nuestra ubicación y visítanos"
                >
                  <span>Conócenos</span>
                  <ArrowUpRight size={15} strokeWidth={2} className="kyrios-nav-cta-arrow" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisionSection;
