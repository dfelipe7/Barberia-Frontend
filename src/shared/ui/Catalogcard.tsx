import React from 'react';
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
}: CatalogCardProps) {
  return (
    <div
      className={`catalog-card position-relative ${isActive ? 'is-active' : 'is-inactive'}`}
      onClick={isActive ? onClick : undefined}
      role={onClick ? 'button' : undefined}
      aria-disabled={onClick && !isActive ? true : undefined}
      tabIndex={onClick ? (isActive ? 0 : -1) : undefined}
      style={{
        cursor: onClick ? (isActive ? 'pointer' : 'not-allowed') : undefined,
      }}
    >
      <div className="position-relative overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-100 catalog-card-image" />
        ) : (
          <div className="w-100 catalog-card-image d-flex align-items-center justify-content-center">
            <span className="font-display fs-1 text-white-50">{title.charAt(0)}</span>
          </div>
        )}

        {/* Marca de agua diagonal para servicios inactivos */}
        {!isActive && (
          <div className="catalog-card-watermark" aria-hidden="true">
            INACTIVO
          </div>
        )}

        {/* Badges de estado e información adicional */}
        <div className="position-absolute top-0 start-0 m-2 d-flex flex-column gap-1" style={{ zIndex: 3 }}>
          {/* Badge principal con icono y texto de estado */}
          {isActive ? (
            <span
              className={`badge bg-success d-inline-flex align-items-center gap-1 shadow-sm px-2 py-1 ${
                isStateChanging ? 'animate-state-pulse' : ''
              }`}
              style={{ fontSize: '0.72rem', borderRadius: '3px' }}
            >
              <CheckCircle2 size={12} strokeWidth={2.5} />
              <span>Activo</span>
            </span>
          ) : (
            <span
              className={`badge bg-secondary d-inline-flex align-items-center gap-1 shadow-sm px-2 py-1 ${
                isStateChanging ? 'animate-state-pulse' : ''
              }`}
              style={{ fontSize: '0.72rem', borderRadius: '3px' }}
            >
              <EyeOff size={12} strokeWidth={2.5} />
              <span>Inactivo</span>
            </span>
          )}

          {/* Badges complementarios */}
          {badges
            .filter((b) => b.label.toLowerCase() !== 'activo' && b.label.toLowerCase() !== 'inactivo')
            .map((b) => (
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

      <div className="p-3">
        <p className="fw-semibold mb-0 text-surface-card">{title}</p>
        {subtitle && <p className="text-surface-muted small mb-2">{subtitle}</p>}
        <p className="catalog-card-price mb-0 fs-5 text-surface-card">{priceLabel}</p>
      </div>
    </div>
  );
}

export default CatalogCard;