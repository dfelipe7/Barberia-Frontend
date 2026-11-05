import React from 'react';
import type { BarberoCatalogo, BarberoGestion } from '../types/barberos.types';
import UserAvatar from '../../../shared/ui/atoms/UserAvatar';

interface BarberoCardProps {
  barbero: BarberoCatalogo | BarberoGestion;
}

export const BarberoCard: React.FC<BarberoCardProps> = ({ barbero }) => {
  return (
    <div className="col-6 col-sm-6 col-md-4 col-xl-3">
      <div
        className="card shadow-sm h-100 border-0 card-surface barbero-admin-card"
        style={{ transition: 'transform 0.2s', cursor: 'pointer' }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        onFocus={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
        onBlur={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        <div className="card-body p-2.5 p-sm-3 p-md-4 text-center d-flex flex-column align-items-center">
          <UserAvatar
            nombre={barbero.nombre}
            apellido={barbero.apellido}
            fotoUrl={barbero.fotoUrl}
            size={52}
            className="shadow-sm mb-2 mb-sm-3"
          />
          <h5
            className="card-title fw-bold mb-1 fs-6 text-truncate w-100"
            title={`${barbero.nombre} ${barbero.apellido}`}
          >
            {barbero.nombre} {barbero.apellido}
          </h5>
          <p className="card-text text-muted small mb-2 mb-sm-3 text-truncate w-100" style={{ fontSize: '0.78rem' }}>
            Barbero Profesional
          </p>
          <div className="mt-auto w-100 pt-2 border-top d-flex flex-column flex-sm-row justify-content-between align-items-center gap-1">
            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
              Contacto:
            </span>
            <span className="fw-semibold small text-truncate" style={{ fontSize: '0.78rem' }}>
              {barbero.telefono}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberoCard;
