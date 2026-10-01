import React from 'react';
import type { BarberoCatalogo } from '../../../features/barberos/types/barberos.types';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { PhoneIcon } from './HomeIcons';

interface BarberCardProps {
  barbero: BarberoCatalogo;
  onReservar: (barbero: BarberoCatalogo) => void;
}

export const BarberCard: React.FC<BarberCardProps> = ({
  barbero,
  onReservar,
}) => {
  const fotoCompleta = obtenerUrlFoto(barbero.fotoUrl);
  const nombreCompleto = `${barbero.nombre} ${barbero.apellido}`.trim();
  const iniciales = `${barbero.nombre.charAt(0)}${barbero.apellido.charAt(0)}`.toUpperCase();

  return (
    <article className="kyrios-barber-card" aria-label={`Perfil de ${nombreCompleto}`}>
      <div className="kyrios-barber-img-wrap">
        {fotoCompleta ? (
          <img
            src={fotoCompleta}
            alt={nombreCompleto}
            className="kyrios-barber-img"
            loading="lazy"
          />
        ) : (
          <div className="kyrios-barber-img-placeholder">
            <span className="kyrios-title-display fs-1 text-white-50">{iniciales}</span>
            <span className="small text-white-50 mt-1">Kyrios Barber</span>
          </div>
        )}
      </div>

      <div className="kyrios-barber-body">
        <h3 className="kyrios-barber-name">{nombreCompleto}</h3>
        <p className="kyrios-barber-role">Barbero Profesional</p>

        <div className="d-flex align-items-center justify-content-between mt-auto pt-2">
          {barbero.telefono ? (
            <a
              href={`tel:${barbero.telefono}`}
              className="kyrios-barber-phone"
              title={`Llamar a ${barbero.nombre}`}
            >
              <PhoneIcon size={14} />
              <span>{barbero.telefono}</span>
            </a>
          ) : (
            <span className="small text-white-50">Atención en sede</span>
          )}

          <button
            type="button"
            className="btn-kyrios-primary py-1 px-3"
            style={{ fontSize: '0.75rem' }}
            onClick={() => onReservar(barbero)}
            aria-label={`Reservar con ${nombreCompleto}`}
          >
            Reservar
          </button>
        </div>
      </div>
    </article>
  );
};

export default BarberCard;
