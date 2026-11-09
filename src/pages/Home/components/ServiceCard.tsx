import React, { useState } from 'react';
import { Maximize2, Heart, Share2, X, Clock, Check, Calendar, ArrowRight } from 'lucide-react';
import type { Servicio } from '../../../features/servicios/types/servicios.types';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import Modal from '../../../shared/ui/Modal';
import './ServiceDetailModal.css';

interface ServiceCardProps {
  servicio: Servicio;
  onReservar: (servicio: Servicio) => void;
}

/**
 * Subcomponente de imagen con backdrop desenfocado ambiental y fallback a inicial del servicio.
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
  const [modalAbierto, setModalAbierto] = useState(false);
  const [esFavorito, setEsFavorito] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const fotoCompleta = obtenerUrlFoto(servicio.fotoUrl);

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(precio);
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2200);
      }
    } catch {
      // noop
    }
  };

  return (
    <>
      <article className="kyrios-service-card" aria-label={servicio.nombre}>
        <button
          type="button"
          className="kyrios-service-img-wrap border-0 p-0 text-start w-100 bg-transparent"
          onClick={() => setModalAbierto(true)}
          aria-label={`Ver información de ${servicio.nombre}`}
        >
          {fotoCompleta ? (
            <>
              {/* key={fotoCompleta}: remonta ServicioImg cuando cambia la URL */}
              <ServicioImg key={fotoCompleta} src={fotoCompleta} nombre={servicio.nombre} />
              <span
                className="kyrios-img-expand-btn"
                aria-hidden="true"
              >
                <Maximize2 size={15} />
              </span>
            </>
          ) : (
            <div className="kyrios-service-img-placeholder" aria-hidden="true">
              <span>{servicio.nombre.charAt(0)}</span>
            </div>
          )}
        </button>

        <div className="kyrios-service-body">
          <h3 className="kyrios-service-title">{servicio.nombre}</h3>

          <p className="kyrios-service-desc">{servicio.descripcion}</p>

          <div className="kyrios-service-meta">
            <div>
              <span className="kyrios-service-price">
                {formatPrecio(servicio.precio)}
              </span>
              <div className="kyrios-service-duration mt-1">
                <Clock size={14} aria-hidden="true" />
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

      {modalAbierto && (
        <Modal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          size="md"
          className="service-detail-dialog"
          hideHeader={true}
        >
          <div className="service-modal-card">
            {/* Barra superior de acciones */}
            <div className="service-modal-topbar">
              <div className="service-modal-topbar-left">
                <button
                  type="button"
                  className="service-modal-btn-icon"
                  onClick={() => setEsFavorito((prev) => !prev)}
                  aria-label={esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                  title={esFavorito ? 'En tus favoritos' : 'Guardar en favoritos'}
                >
                  <Heart
                    size={20}
                    color={esFavorito ? '#ef4444' : 'currentColor'}
                    fill={esFavorito ? '#ef4444' : 'none'}
                  />
                </button>

                <button
                  type="button"
                  className="service-modal-btn-icon"
                  onClick={handleShare}
                  aria-label="Compartir servicio"
                  title={copiado ? '¡Enlace copiado!' : 'Compartir servicio'}
                >
                  {copiado ? <Check size={18} color="#10B981" /> : <Share2 size={19} />}
                </button>

                {copiado && (
                  <span className="badge bg-success-subtle text-success small py-1 px-2 animate-fade">
                    ¡Enlace copiado!
                  </span>
                )}
              </div>

              <button
                type="button"
                className="service-modal-btn-icon"
                onClick={() => setModalAbierto(false)}
                aria-label="Cerrar ventana"
              >
                <X size={20} />
              </button>
            </div>

            {/* Banner visual del servicio */}
            <div className="service-modal-hero-wrap">
              {fotoCompleta ? (
                <>
                  <img
                    src={fotoCompleta}
                    alt=""
                    aria-hidden="true"
                    className="service-modal-hero-bg"
                  />
                  <img
                    src={fotoCompleta}
                    alt={servicio.nombre}
                    className="service-modal-hero-img"
                  />
                </>
              ) : (
                <div className="kyrios-service-img-placeholder w-100 h-100 d-flex align-items-center justify-content-center" aria-hidden="true">
                  <span style={{ fontSize: '2.8rem', fontWeight: 800 }}>{servicio.nombre.charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Título del Servicio */}
            <h3 className="service-modal-name">{servicio.nombre}</h3>

            {/* Barra de Precio y Duración */}
            <div className="service-modal-pricing-bar">
              <span className="service-modal-price">
                {formatPrecio(servicio.precio)}
              </span>
              <div className="service-modal-duration-badge">
                <Clock size={15} />
                <span>{servicio.duracionMinutos} minutos</span>
              </div>
            </div>

            {/* Descripción del servicio directamente desde el backend */}
            {servicio.descripcion && (
              <div className="mb-4">
                <h4 className="service-modal-section-title">Detalles del Servicio</h4>
                <p className="service-modal-about mb-0">
                  {servicio.descripcion}
                </p>
              </div>
            )}

            {/* Botón CTA Principal: Reservar este servicio */}
            <button
              type="button"
              className="service-modal-btn-cta"
              onClick={() => {
                setModalAbierto(false);
                onReservar(servicio);
              }}
            >
              <Calendar size={18} />
              <span>Reservar ahora</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ServiceCard;
