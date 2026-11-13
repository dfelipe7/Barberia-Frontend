import React, { useState } from 'react';
import { Maximize2, MessageCircle, Package, Share2, Check, X } from 'lucide-react';
import type { ProductoCatalogoDTO } from '../../../features/productos/api/productos.dto';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { useTenantBrand } from '../../../features/negocio/context/TenantBrandContext';
import { normalizarEntradaRed } from '../../../features/negocio/components/RedesSocialesSection';
import Modal from '../../../shared/ui/Modal';
import '../../Home/components/ServiceDetailModal.css';

interface ProductCardProps {
  producto: ProductoCatalogoDTO;
}

const formateaMonedaCop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

function construirEnlaceWhatsAppProducto(urlConfigurada: string | undefined, textoCodificado: string): string {
  if (!urlConfigurada) {
    return `https://wa.me/?text=${textoCodificado}`;
  }
  const baseUrl = normalizarEntradaRed('WHATSAPP', urlConfigurada);
  const separador = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separador}text=${textoCodificado}`;
}

const ProductThumbImage: React.FC<{ url: string | null; titulo: string }> = ({ url, titulo }) => {
  const [falloCarga, setFalloCarga] = useState(false);

  if (url && !falloCarga) {
    return (
      <>
        <img
          src={url}
          alt={`Artículo ${titulo}`}
          className="kyrios-card-thumb-img"
          loading="lazy"
          onError={() => setFalloCarga(true)}
        />
        <span className="kyrios-img-expand-btn" aria-hidden="true">
          <Maximize2 size={13} />
        </span>
      </>
    );
  }

  return (
    <div className="kyrios-card-thumb-placeholder" aria-hidden="true">
      <span>{titulo.slice(0, 1).toUpperCase()}</span>
    </div>
  );
};

export const ProductCard: React.FC<ProductCardProps> = ({ producto }) => {
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);
  const { nombreNegocio, redesSociales, direccion, ciudad } = useTenantBrand();
  const urlImagenProducto = obtenerUrlFoto(producto.imagenUrl);
  const precioFormateado = formateaMonedaCop.format(producto.precio);

  const canalWhatsApp = redesSociales?.find((r) => r.tipo === 'WHATSAPP' && r.activo);

  const handleConsultarWhatsApp = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const mensaje = encodeURIComponent(
      `¡Hola ${nombreNegocio}! Me interesa comprar el producto "${producto.nombre}" (${precioFormateado}) que vi en su catálogo.`
    );
    const destino = construirEnlaceWhatsAppProducto(canalWhatsApp?.url, mensaje);
    window.open(destino, '_blank', 'noopener,noreferrer');
  };

  const handleCopiarEnlace = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setEnlaceCopiado(true);
      window.setTimeout(() => setEnlaceCopiado(false), 2000);
    } catch {
      // Ignorar si el navegador bloquea el portapapeles
    }
  };

  return (
    <>
      <article className="kyrios-service-card" aria-label={producto.nombre}>
        {/* Miniatura cuadrada a la izquierda */}
        <button
          type="button"
          className="kyrios-card-thumb-btn border-0 p-0 text-start bg-transparent"
          onClick={() => setDetalleVisible(true)}
          aria-label={`Ver detalles de ${producto.nombre}`}
        >
          <div className="kyrios-card-thumb">
            <ProductThumbImage
              key={urlImagenProducto ?? 'no-img'}
              url={urlImagenProducto}
              titulo={producto.nombre}
            />
          </div>
        </button>

        {/* Contenido a la derecha */}
        <div className="kyrios-service-body">
          {/* Fila superior: Título y Precio */}
          <div className="kyrios-service-header">
            <h3 className="kyrios-service-title" title={producto.nombre}>
              {producto.nombre}
            </h3>
            <span className="kyrios-service-price">{precioFormateado}</span>
          </div>

          {/* Fila central: Etiqueta y descripción con 'Ver más' */}
          <div className="kyrios-service-content">
            <span className="kyrios-service-category-tag">Producto</span>
            <p className="kyrios-service-desc">
              {producto.descripcion || 'Disponible en barbería'}
            </p>
            <button
              type="button"
              className="kyrios-service-more-btn"
              onClick={() => setDetalleVisible(true)}
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

      {/* Modal Detalle Completo del Producto */}
      {detalleVisible && (
        <Modal
          isOpen={detalleVisible}
          onClose={() => setDetalleVisible(false)}
          size="md"
          className="service-detail-dialog"
          hideHeader={true}
        >
          <div className="service-modal-card">
            <div className="service-modal-topbar">
              <div className="service-modal-topbar-left">
                <button
                  type="button"
                  className="service-modal-btn-icon"
                  onClick={handleCopiarEnlace}
                  aria-label="Compartir producto"
                  title={enlaceCopiado ? '¡Enlace copiado!' : 'Compartir producto'}
                >
                  {enlaceCopiado ? <Check size={18} color="#10B981" /> : <Share2 size={19} />}
                </button>
                {enlaceCopiado && (
                  <span className="badge bg-success-subtle text-success small py-1 px-2 animate-fade">
                    ¡Enlace copiado!
                  </span>
                )}
              </div>

              <button
                type="button"
                className="service-modal-btn-icon"
                onClick={() => setDetalleVisible(false)}
                aria-label="Cerrar ventana"
              >
                <X size={20} />
              </button>
            </div>

            <div className="service-modal-hero-wrap">
              {urlImagenProducto ? (
                <>
                  <img
                    src={urlImagenProducto}
                    alt=""
                    aria-hidden="true"
                    className="service-modal-hero-bg"
                  />
                  <img
                    src={urlImagenProducto}
                    alt={producto.nombre}
                    className="service-modal-hero-img"
                  />
                </>
              ) : (
                <div
                  className="kyrios-service-img-placeholder w-100 h-100 d-flex align-items-center justify-content-center"
                  aria-hidden="true"
                >
                  <span className="fw-bolder fs-1">{producto.nombre.slice(0, 1)}</span>
                </div>
              )}
            </div>

            <h3 className="service-modal-name">{producto.nombre}</h3>

            <div className="service-modal-pricing-bar">
              <span className="service-modal-price">{precioFormateado}</span>
              <div className="service-modal-duration-badge">
                <Package size={15} />
                <span>Disponible en sede</span>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="service-modal-section-title">Detalles del Producto</h4>
              <p className="service-modal-about mb-0">
                {producto.descripcion ||
                  'Producto de cuidado capilar y estilismo profesional disponible para venta directa en nuestra barbería.'}
              </p>
            </div>

            {direccion && (
              <div
                className="p-3 rounded border small mb-4 text-surface-muted"
                style={{ background: 'var(--home-surface-alt)' }}
              >
                <strong>Disponible en:</strong> {nombreNegocio} - {direccion}
                {ciudad ? `, ${ciudad}` : ''}
              </div>
            )}

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
