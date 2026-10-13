import React, { useState } from 'react';
import type { Servicio } from '../../../features/servicios/types/servicios.types';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { ClockIcon } from './HomeIcons';

interface ServiceCardProps {
  servicio: Servicio;
  onReservar: (servicio: Servicio) => void;
}

/**
 * Subcomponente de imagen con fallback a la letra del nombre del servicio.
 * Se monta con key={src} para resetear el estado de error sin useEffect.
 */
const ServicioImg: React.FC<{ src: string; nombre: string }> = ({ src, nombre }) => {
  const [errorImagen, setErrorImagen] = useState(false);

  if (!errorImagen) {
    return (
      <img
        src={src}
        alt={`Servicio de ${nombre}`}
        className="kyrios-service-img"
        loading="lazy"
        onError={() => setErrorImagen(true)}
      />
    );
  }

  return (
    <div className="kyrios-service-img-placeholder" aria-hidden="true">
      <span>{nombre.charAt(0)}</span>
    </div>
  );
};

export const ServiceCard: React.FC<ServiceCardProps> = ({
  servicio,
  onReservar,
}) => {
  const fotoCompleta = obtenerUrlFoto(servicio.fotoUrl);

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(precio);
  };

  return (
    <article className="kyrios-service-card" aria-label={servicio.nombre}>
      <div className="kyrios-service-img-wrap">
        {fotoCompleta ? (
          /* key={fotoCompleta}: remonta ServicioImg cuando cambia la URL */
          <ServicioImg key={fotoCompleta} src={fotoCompleta} nombre={servicio.nombre} />
        ) : (
          <div className="kyrios-service-img-placeholder" aria-hidden="true">
            <span>{servicio.nombre.charAt(0)}</span>
          </div>
        )}
      </div>

      <div className="kyrios-service-body">
        <h3 className="kyrios-service-title">{servicio.nombre}</h3>

        <p className="kyrios-service-desc">{servicio.descripcion}</p>

        <div className="kyrios-service-meta">
          <div>
            <span className="kyrios-service-price">
              {formatPrecio(servicio.precio)}
            </span>
            <div className="kyrios-service-duration mt-1">
              <ClockIcon size={14} aria-hidden="true" />
              <span>{servicio.duracionMinutos} minutos</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-kyrios-dark"
            onClick={() => onReservar(servicio)}
            aria-label={`Reservar ${servicio.nombre}`}
          >
            Reservar
          </button>
        </div>
      </div>
    </article>
  );
};

export default ServiceCard;
