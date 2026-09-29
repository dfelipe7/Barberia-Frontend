import React from 'react';
import type { BarberoCatalogo } from '../types/barberos.types';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';

interface BarberoCardProps {
  barbero: BarberoCatalogo;
}

export const BarberoCard: React.FC<BarberoCardProps> = ({ barbero }) => {
  return (
    <div className="col-12 col-md-6 col-lg-4">
      <div
        className="card shadow-sm h-100 border-0 bg-white"
        style={{ transition: 'transform 0.2s', cursor: 'pointer' }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        <div className="card-body p-4 text-center d-flex flex-column align-items-center">
          {obtenerUrlFoto(barbero.fotoUrl) ? (
            <img
              src={obtenerUrlFoto(barbero.fotoUrl)!}
              alt={`${barbero.nombre} ${barbero.apellido}`}
              className="rounded-circle shadow-sm mb-3"
              style={{ width: '64px', height: '64px', objectFit: 'cover' }}
            />
          ) : (
            <div
              className="rounded-circle bg-dark text-white d-inline-flex justify-content-center align-items-center mb-3 shadow-sm"
              style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}
            >
              {barbero.nombre.charAt(0)}{barbero.apellido.charAt(0)}
            </div>
          )}
          <h5 className="card-title fw-bold mb-1">
            {barbero.nombre} {barbero.apellido}
          </h5>
          <p className="card-text text-muted small mb-3">Barbero Profesional</p>
          <div className="mt-auto w-100 pt-3 border-top d-flex justify-content-between align-items-center">
            <span className="text-muted small">Contacto:</span>
            <span className="fw-semibold text-dark">{barbero.telefono}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberoCard;
