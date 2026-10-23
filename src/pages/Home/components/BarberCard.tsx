import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import type { BarberoCatalogo } from '../../../features/barberos/types/barberos.types';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import BarberProfileModal from './BarberProfileModal';

interface BarberCardProps {
  barbero: BarberoCatalogo;
  onReservar: (barbero: BarberoCatalogo, servicioId?: number) => void;
}

/**
 * Subcomponente de imagen del barbero con backdrop desenfocado ambiental y fallback a iniciales.
 * Se monta con key={src} para resetear el estado de error sin useEffect.
 */
const BarberoImg: React.FC<{ src: string; nombreCompleto: string; iniciales: string }> = ({
  src,
  nombreCompleto,
  iniciales,
}) => {
  const [errorImagen, setErrorImagen] = useState(false);

  if (!errorImagen) {
    return (
      <>
        {/* Fondo ambient blur: expande colores del barbero sin recortes */}
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="kyrios-barber-img-bg"
        />
        {/* Foto principal completa contenida sin recorte */}
        <img
          src={src}
          alt={nombreCompleto}
          className="kyrios-barber-img"
          loading="lazy"
          onError={() => setErrorImagen(true)}
        />
      </>
    );
  }

  return (
    <div className="kyrios-barber-img-placeholder">
      <span className="kyrios-title-display fs-1 text-white-50">{iniciales}</span>
      <span className="small text-white-50 mt-1">Kyrios Barber</span>
    </div>
  );
};

export const BarberCard: React.FC<BarberCardProps> = ({
  barbero,
  onReservar,
}) => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const fotoCompleta = obtenerUrlFoto(barbero.fotoUrl);
  const nombreCompleto = `${barbero.nombre} ${barbero.apellido}`.trim();
  const iniciales = `${barbero.nombre.charAt(0)}${barbero.apellido.charAt(0)}`.toUpperCase();

  return (
    <>
      <article className="kyrios-barber-card" aria-label={`Perfil de ${nombreCompleto}`}>
        <div
          className="kyrios-barber-img-wrap"
          onClick={() => setModalAbierto(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setModalAbierto(true);
            }
          }}
          aria-label={`Ver perfil de ${nombreCompleto}`}
        >
          {fotoCompleta ? (
            <>
              {/* key={fotoCompleta}: remonta BarberoImg cuando cambia la URL */}
              <BarberoImg
                key={fotoCompleta}
                src={fotoCompleta}
                nombreCompleto={nombreCompleto}
                iniciales={iniciales}
              />
              <button
                type="button"
                className="kyrios-img-expand-btn"
                title={`Ver perfil completo de ${nombreCompleto}`}
                aria-label={`Ver perfil completo de ${nombreCompleto}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setModalAbierto(true);
                }}
              >
                <Maximize2 size={15} />
              </button>
            </>
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

          <div className="kyrios-barber-footer d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between mt-auto pt-2 gap-1 gap-sm-2">
            <span className="kyrios-barber-sede small">Atención en sede</span>

            <button
              type="button"
              className="btn-kyrios-primary py-1 px-3 w-100 w-sm-auto text-center"
              style={{ fontSize: '0.75rem' }}
              onClick={() => onReservar(barbero)}
              aria-label={`Reservar con ${nombreCompleto}`}
            >
              Reservar
            </button>
          </div>
        </div>
      </article>

      <BarberProfileModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        barbero={barbero}
        onReservar={onReservar}
      />
    </>
  );
};

export default BarberCard;
