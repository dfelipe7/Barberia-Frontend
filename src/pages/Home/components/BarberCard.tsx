import React, { useState } from 'react';
import { Maximize2, MapPin } from 'lucide-react';
import type { BarberoCatalogo } from '../../../features/barberos/types/barberos.types';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import BarberProfileModal from './BarberProfileModal';

interface BarberCardProps {
  barbero: BarberoCatalogo;
  onReservar: (barbero: BarberoCatalogo, servicioId?: number) => void;
}

/**
 * Subcomponente de imagen del barbero con fallback a iniciales.
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
      <img
        src={src}
        alt={nombreCompleto}
        className="kyrios-card-thumb-img"
        loading="lazy"
        onError={() => setErrorImagen(true)}
      />
    );
  }

  return (
    <div className="kyrios-card-thumb-placeholder">
      <span className="kyrios-barber-initials">{iniciales}</span>
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
        {/* Avatar cuadrado a la izquierda */}
        <button
          type="button"
          className="kyrios-card-thumb-btn border-0 p-0 text-start bg-transparent"
          onClick={() => setModalAbierto(true)}
          aria-label={`Ver perfil de ${nombreCompleto}`}
        >
          <div className="kyrios-card-thumb">
            {fotoCompleta ? (
              <>
                {/* key={fotoCompleta}: remonta BarberoImg cuando cambia la URL */}
                <BarberoImg
                  key={fotoCompleta}
                  src={fotoCompleta}
                  nombreCompleto={nombreCompleto}
                  iniciales={iniciales}
                />
                <span
                  className="kyrios-img-expand-btn"
                  aria-hidden="true"
                >
                  <Maximize2 size={13} />
                </span>
              </>
            ) : (
              <div className="kyrios-card-thumb-placeholder">
                <span className="kyrios-barber-initials">{iniciales}</span>
              </div>
            )}
          </div>
        </button>

        {/* Contenido a la derecha */}
        <div className="kyrios-barber-body">
          {/* Fila superior: Nombre y Rol */}
          <div className="kyrios-barber-header">
            <h3 className="kyrios-barber-name" title={nombreCompleto}>
              {nombreCompleto}
            </h3>
            <span className="kyrios-barber-role">Barbero Profesional</span>
          </div>

          {/* Fila central: Atención en sede y 'Ver perfil' */}
          <div className="kyrios-barber-content">
            <span className="kyrios-barber-sede">
              <MapPin size={12} className="me-1 opacity-75" aria-hidden="true" />
              Atención en sede
            </span>
            <button
              type="button"
              className="kyrios-barber-more-btn"
              onClick={() => setModalAbierto(true)}
              aria-label={`Ver perfil completo de ${nombreCompleto}`}
            >
              Ver perfil
            </button>
          </div>

          {/* Fila inferior: Estado disponible y Botón Reservar */}
          <div className="kyrios-barber-footer">
            <div className="kyrios-barber-status">
              <span className="kyrios-status-dot" aria-hidden="true" />
              <span>Disponible</span>
            </div>

            <button
              type="button"
              className="btn-kyrios-primary kyrios-barber-book-btn"
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
