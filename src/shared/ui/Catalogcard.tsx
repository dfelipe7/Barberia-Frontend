import React, { useState } from 'react';
import { CheckCircle2, EyeOff } from 'lucide-react';

export interface CatalogCardProps {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  badges?: { label: string; tone?: 'default' | 'dark' }[];
  priceLabel: string;
  isActive?: boolean;
  onClick?: () => void;
  actions?: React.ReactNode; // botones de administración que aparecen al hover o foco
  isStateChanging?: boolean; // activa microanimación de pulso
}

/**
 * Subcomponente de imagen con fallback a letra inicial.
 * Se monta con key={imageUrl} para que cuando la URL cambie,
 * React lo desmonte y remonte, reseteando el estado de error sin useEffect.
 */
const CardImage: React.FC<{ src: string; alt: string; title: string }> = ({
  src,
  alt,
  title,
}) => {
  const [errorImagen, setErrorImagen] = useState(false);

  if (!errorImagen) {
    return (
      <div className="w-100 catalog-card-img-wrap">
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="catalog-card-image-bg"
        />
        <img
          src={src}
          alt={alt}
          className="catalog-card-image"
          onError={() => setErrorImagen(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    /* Fallback: letra inicial sobre el mismo contenedor cuadrado */
    <div className="w-100 catalog-card-img-wrap d-flex align-items-center justify-content-center">
      <span className="font-display fs-1 text-surface-muted" style={{ opacity: 0.4 }}>
        {title.charAt(0)}
      </span>
    </div>
  );
};

const CardStatusBadge: React.FC<{ isActive: boolean; isStateChanging: boolean }> = ({
  isActive,
  isStateChanging,
}) => {
  const pulseClass = isStateChanging ? 'animate-state-pulse' : '';
  if (isActive) {
    return (
      <span
        className={`badge bg-success d-inline-flex align-items-center gap-1 shadow-sm px-2 py-1 ${pulseClass}`}
        style={{ fontSize: '0.72rem', borderRadius: '3px' }}
      >
        <CheckCircle2 size={12} strokeWidth={2.5} />
        <span>Activo</span>
      </span>
    );
  }
  return (
    <span
      className={`badge bg-secondary d-inline-flex align-items-center gap-1 shadow-sm px-2 py-1 ${pulseClass}`}
      style={{ fontSize: '0.72rem', borderRadius: '3px' }}
    >
      <EyeOff size={12} strokeWidth={2.5} />
      <span>Inactivo</span>
    </span>
  );
};

const CardBadgesList: React.FC<{
  badges: { label: string; tone?: 'default' | 'dark' }[];
  isActive: boolean;
  isStateChanging: boolean;
}> = ({ badges, isActive, isStateChanging }) => {
  const complementarios = badges.filter(
    (b) => b.label.toLowerCase() !== 'activo' && b.label.toLowerCase() !== 'inactivo'
  );
  return (
    <div className="position-absolute top-0 start-0 m-2 d-flex flex-column gap-1" style={{ zIndex: 3 }}>
      <CardStatusBadge isActive={isActive} isStateChanging={isStateChanging} />
      {complementarios.map((b) => (
        <span
          key={b.label}
          className="badge-outline"
          style={
            b.tone === 'dark'
              ? { background: 'rgba(0,0,0,.7)', color: '#fff', borderColor: 'transparent' }
              : undefined
          }
        >
          {b.label}
        </span>
      ))}
    </div>
  );
};

function getCardKeyHandler(onClick?: () => void, isActive = true) {
  if (!onClick || !isActive) return undefined;
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };
}

function getInteractiveProps(onClick?: () => void, isActive = true) {
  if (!onClick) {
    return {
      tabIndex: undefined,
      ariaDisabled: undefined,
      cursor: undefined,
    };
  }
  return {
    tabIndex: isActive ? 0 : -1,
    ariaDisabled: !isActive ? true : undefined,
    cursor: isActive ? 'pointer' : 'not-allowed',
  };
}

export function CatalogCard({
  imageUrl,
  title,
  subtitle,
  badges = [],
  priceLabel,
  isActive = true,
  onClick,
  actions,
  isStateChanging = false,
}: Readonly<CatalogCardProps>) {
  const interactive = getInteractiveProps(onClick, isActive);
  const handleKeyDown = getCardKeyHandler(onClick, isActive);

  return (
    <div
      className={`catalog-card position-relative ${isActive ? 'is-active' : 'is-inactive'}`}
      onClick={isActive ? onClick : undefined}
      onKeyDown={handleKeyDown}
      aria-disabled={interactive.ariaDisabled}
      tabIndex={interactive.tabIndex}
      style={{ cursor: interactive.cursor }}
    >
      <div className="position-relative overflow-hidden">
        {imageUrl ? (
          /* key={imageUrl}: remonta CardImage cuando cambia la URL, reseteando el error */
          <CardImage key={imageUrl} src={imageUrl} alt={title} title={title} />
        ) : (
          /* Sin URL: fallback directo con la letra del nombre */
          <div className="w-100 catalog-card-img-wrap d-flex align-items-center justify-content-center">
            <span className="font-display fs-1 text-surface-muted" style={{ opacity: 0.4 }}>
              {title.charAt(0)}
            </span>
          </div>
        )}

        {/* Marca de agua diagonal para servicios inactivos */}
        {!isActive && (
          <div className="catalog-card-watermark" aria-hidden="true">
            INACTIVO
          </div>
        )}

        {/* Badges de estado e información adicional */}
        <CardBadgesList badges={badges} isActive={isActive} isStateChanging={isStateChanging} />

        {/* Acciones flotantes */}
        {actions && (
          <div
            className="position-absolute bottom-0 start-0 end-0 p-2 d-flex gap-1 catalog-card-actions"
            style={{ zIndex: 4 }}
          >
            {actions}
          </div>
        )}
      </div>

      <div className="p-2.5 p-sm-3 catalog-card-body">
        <p className="fw-semibold mb-0 text-surface-card catalog-card-title text-truncate" title={title}>{title}</p>
        {subtitle && <p className="text-surface-muted small mb-1 mb-sm-2 catalog-card-subtitle">{subtitle}</p>}
        <p className="catalog-card-price mb-0 fs-6 fs-sm-5 text-surface-card">{priceLabel}</p>
      </div>
    </div>
  );
}

export default CatalogCard;