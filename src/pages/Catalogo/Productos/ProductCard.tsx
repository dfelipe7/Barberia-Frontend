import React, { useState } from 'react';
import { Maximize2, MessageCircle, Package, Share2, Check, X } from 'lucide-react';
import type { ProductoCatalogoDTO } from '../../../features/productos/api/productos.dto';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { useTenantBrand } from '../../../features/negocio/context/TenantBrandContext';
import Modal from '../../../shared/ui/Modal';
import '../../Home/components/ServiceDetailModal.css';

interface ProductCardProps {
  producto: ProductoCatalogoDTO;
}

const ProductImg: React.FC<{ src: string; nombre: string }> = ({ src, nombre }) => {
  const [errorImagen, setErrorImagen] = useState(false);

  if (!errorImagen) {
    return (
      <img
        src={src}
        alt={`Producto ${nombre}`}
        className="kyrios-card-thumb-img"
        loading="lazy"
        onError={() => setErrorImagen(true)}
      />
    );
  }

  return (
    <div className="kyrios-card-thumb-placeholder" aria-hidden="true">
      <span>{nombre.charAt(0)}</span>
    </div>
  );
};

export const ProductCard: React.FC<ProductCardProps> = ({ producto }) => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const { nombreNegocio, redesSociales, direccion, ciudad } = useTenantBrand();
  const fotoCompleta = obtenerUrlFoto(producto.imagenUrl);

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(precio);
  };

  const redWhatsApp = redesSociales?.find((r) => r.tipo === 'WHATSAPP' && r.activo);

  const handleConsultarWhatsApp = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const texto = encodeURIComponent(
      `¡Hola ${nombreNegocio}! Me interesa comprar el producto "${producto.nombre}" (${formatPrecio(producto.precio)}) que vi en su catálogo.`
    );

    if (redWhatsApp?.url) {
      let baseUrl = redWhatsApp.url.trim();
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        const digitos = baseUrl.replace(/\D/g, '');
        if (digitos.length >= 7) {
          baseUrl = `https://wa.me/${digitos.length === 10 && digitos.startsWith('3') ? `57${digitos}` : digitos}`;
        } else {
          baseUrl = `https://${baseUrl}`;
        }
      }
      const separator = baseUrl.includes('?') ? '&' : '?';
      window.open(`${baseUrl}${separator}text=${texto}`, '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://wa.me/?text=${texto}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
      <article className="kyrios-service-card" aria-label={producto.nombre}>
        {/* Miniatura cuadrada a la izquierda */}
        <button
          type="button"
          className="kyrios-card-thumb-btn border-0 p-0 text-start bg-transparent"
          onClick={() => setModalAbierto(true)}
          aria-label={`Ver detalles de ${producto.nombre}`}
        >
          <div className="kyrios-card-thumb">
            {fotoCompleta ? (
              <>
                <ProductImg key={fotoCompleta} src={fotoCompleta} nombre={producto.nombre} />
                <span className="kyrios-img-expand-btn" aria-hidden="true">
                  <Maximize2 size={13} />
                </span>
              </>
            ) : (
              <div className="kyrios-card-thumb-placeholder" aria-hidden="true">
                <span>{producto.nombre.charAt(0)}</span>
              </div>
            )}
          </div>
        </button>

        {/* Contenido a la derecha */}
        <div className="kyrios-service-body">
          {/* Fila superior: Título y Precio */}
          <div className="kyrios-service-header">
            <h3 className="kyrios-service-title" title={producto.nombre}>
              {producto.nombre}
            </h3>
            <span className="kyrios-service-price">
              {formatPrecio(producto.precio)}
            </span>
          </div>

          {/* Fila central: Etiqueta y descripción con 'Ver más' */}
          <div className="kyrios-service-content">
            <span className="kyrios-service-category-tag">Producto</span>
            {producto.descripcion ? (
              <p className="kyrios-service-desc">{producto.descripcion}</p>
            ) : (
              <p className="kyrios-service-desc">Disponible en barbería</p>
            )}
            <button
              type="button"
              className="kyrios-service-more-btn"
              onClick={() => setModalAbierto(true)}
              aria-label={`Ver más información de ${producto.nombre}`}
            >
              Ver más
            </button>
          </div>

          {/* Fila inferior: Estado y Botón Pedir */}
          <div className="kyrios-service-footer">
            <div className="kyrios-service-duration">
              <Package size={13} aria-hidden="true" />
              <span>Disponible</span>
            </div>

            <button
              type="button"
              className="btn-kyrios-primary kyrios-service-book-btn d-inline-flex align-items-center gap-1"
              style={{
                backgroundColor: '#25D366',
                borderColor: '#25D366',
                color: '#ffffff',
              }}
              onClick={handleConsultarWhatsApp}
              aria-label={`Pedir ${producto.nombre} por WhatsApp`}
            >
              <MessageCircle size={13} />
              <span>Pedir</span>
            </button>
          </div>
        </div>
      </article>

      {/* Modal Detalle Completo del Producto (Estilo oficial ServiceDetailModal) */}
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
                  onClick={handleShare}
                  aria-label="Compartir producto"
                  title={copiado ? '¡Enlace copiado!' : 'Compartir producto'}
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

            {/* Banner visual del producto con backdrop ambiental desenfocado */}
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
                    alt={producto.nombre}
                    className="service-modal-hero-img"
                  />
                </>
              ) : (
                <div
                  className="kyrios-service-img-placeholder w-100 h-100 d-flex align-items-center justify-content-center"
                  aria-hidden="true"
                >
                  <span style={{ fontSize: '2.8rem', fontWeight: 800 }}>
                    {producto.nombre.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Título del Producto */}
            <h3 className="service-modal-name">{producto.nombre}</h3>

            {/* Barra de Precio y Disponibilidad */}
            <div className="service-modal-pricing-bar">
              <span className="service-modal-price">
                {formatPrecio(producto.precio)}
              </span>
              <div className="service-modal-duration-badge">
                <Package size={15} />
                <span>Disponible en sede</span>
              </div>
            </div>

            {/* Detalles / Descripción */}
            <div className="mb-4">
              <h4 className="service-modal-section-title">Detalles del Producto</h4>
              <p className="service-modal-about mb-0">
                {producto.descripcion ||
                  'Producto de cuidado capilar y estilismo profesional disponible para venta directa en nuestra barbería.'}
              </p>
            </div>

            {/* Información de sede */}
            {direccion && (
              <div
                className="p-3 rounded border small mb-4 text-surface-muted"
                style={{ background: 'var(--home-surface-alt)' }}
              >
                <strong>Disponible en:</strong> {nombreNegocio} - {direccion}
                {ciudad ? `, ${ciudad}` : ''}
              </div>
            )}

            {/* Botón CTA Principal: Pedir por WhatsApp */}
            <button
              type="button"
              className="service-modal-btn-cta d-inline-flex align-items-center justify-content-center gap-2"
              style={{
                backgroundColor: '#25D366',
                borderColor: '#25D366',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
              }}
              onClick={handleConsultarWhatsApp}
            >
              <MessageCircle size={20} />
              <span>Pedir por WhatsApp</span>
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ProductCard;
