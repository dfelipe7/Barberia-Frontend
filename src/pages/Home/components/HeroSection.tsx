import React from 'react';
import { BRAND } from '../../../config/brand';
import { ArrowUpRightIcon } from './HomeIcons';

interface HeroSectionProps {
  onReservar: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onReservar }) => {
  return (
    <section id="inicio" className="kyrios-hero position-relative">
      {/* Imagen de fondo / Banner oficial de Kyrios */}
      <img
        src={BRAND.assets.banner}
        alt="Kyrios Studio Barbería en Popayán"
        className="kyrios-hero-bg"
        loading="eager"
        width={1920}
        height={1080}
      />

      {/* Overlay con degradado controlado para garantizar máxima legibilidad */}
      <div className="kyrios-hero-overlay" aria-hidden="true" />

      {/* Contenido principal del Hero */}
      <div className="container position-relative">
        <div className="kyrios-hero-content kyrios-fade-in">
          <div className="mb-3">
            <span className="kyrios-eyebrow">
              {BRAND.tagline}
            </span>
          </div>

          <h1 className="kyrios-hero-title kyrios-title-display">
            Tu estilo. <br />
            <span>Nuestra precisión.</span>
          </h1>

          <p className="kyrios-hero-subtitle">
            Cortes de autor, perfilado meticuloso de barba y una atmósfera diseñada 
            para quienes valoran el cuidado personal con estándares de alta barbería.
          </p>

          <div className="d-flex flex-wrap align-items-center gap-3">
            <button
              type="button"
              className="btn-kyrios-primary"
              onClick={onReservar}
              aria-label="Reservar cita en Kyrios Studio"
            >
              Reservar cita
            </button>

            <a
              href="#servicios"
              className="btn-kyrios-outline"
              aria-label="Ver el catálogo de servicios de Kyrios"
            >
              Ver servicios
              <ArrowUpRightIcon size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
