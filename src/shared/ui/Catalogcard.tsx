import React from 'react';

export interface CatalogCardProps {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  badges?: { label: string; tone?: 'default' | 'dark' }[];
  priceLabel: string;
  isActive?: boolean;
  onClick?: () => void;
  actions?: React.ReactNode; // botones que aparecen al hover (admin)
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
}: CatalogCardProps) {
  return (
    <div
      className={`catalog-card position-relative ${!isActive ? 'is-inactive' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="position-relative">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-100 catalog-card-image" />
        ) : (
          <div className="w-100 catalog-card-image d-flex align-items-center justify-content-center">
            <span className="font-display fs-1 text-white-50">{title.charAt(0)}</span>
          </div>
        )}

        {badges.length > 0 && (
          <div className="position-absolute top-0 start-0 m-2 d-flex flex-column gap-1">
            {badges.map((b) => (
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
        )}

        {actions && (
          <div className="position-absolute bottom-0 start-0 end-0 p-2 d-flex gap-1 catalog-card-actions">
            {actions}
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="fw-semibold mb-0">{title}</p>
        {subtitle && <p className="text-muted small mb-2">{subtitle}</p>}
        <p className="catalog-card-price mb-0 fs-5">{priceLabel}</p>
      </div>
    </div>
  );
}

export default CatalogCard;