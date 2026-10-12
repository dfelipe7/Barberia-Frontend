import React from 'react';
import type { BarberoCatalogo } from '../types/barberos.types';
import UserAvatar from '../../../shared/ui/atoms/UserAvatar';

interface BarberoCardProps {
  barbero: BarberoCatalogo;
}

export const BarberoCard: React.FC<BarberoCardProps> = ({ barbero }) => {
  return (
    <div className="col-12 col-md-6 col-lg-4">
      <div
        className="card shadow-sm h-100 border-0 card-surface"
        style={{ transition: 'transform 0.2s', cursor: 'pointer' }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        <div className="card-body p-4 text-center d-flex flex-column align-items-center">
          <UserAvatar
            nombre={barbero.nombre}
            apellido={barbero.apellido}
            fotoUrl={barbero.fotoUrl}
            size={64}
            className="shadow-sm mb-3"
          />
          <h5 className="card-title fw-bold mb-1">
            {barbero.nombre} {barbero.apellido}
          </h5>
          <p className="card-text text-muted small mb-3">Barbero Profesional</p>
          <div className="mt-auto w-100 pt-3 border-top d-flex justify-content-between align-items-center">
            <span className="text-muted small">Contacto:</span>
            <span className="fw-semibold">{barbero.telefono}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberoCard;
