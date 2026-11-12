import React, { useState } from 'react';
import { Share2, Check, MessageCircle, Package } from 'lucide-react';
import type { ProductoCatalogoDTO } from '../../../features/productos/api/productos.dto';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { useTenantBrand } from '../../../features/negocio/context/TenantBrandContext';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';

interface ProductCardProps {
  producto: ProductoCatalogoDTO;
}

const ProductImg: React.FC<{ src?: string | null; nombre: string }> = ({ src, nombre }) => {
  const [errorImagen, setErrorImagen] = useState(false);
  const fotoCompleta = obtenerUrlFoto(src);

  if (fotoCompleta && !errorImagen) {
    return (
      <img
        src={fotoCompleta}
        alt={`Producto ${nombre}`}
        className="kyrios-card-thumb-img"
        loading="lazy"
        onError={() => setErrorImagen(true)}
      />
    );
  }

  return (
    <div className="kyrios-card-thumb-placeholder d-flex align-items-center justify-content-center" aria-hidden="true">
      <Package size={48} className="text-surface-muted opacity-50" />
    </div>
  );
};

export const ProductCard: React.FC<ProductCardProps> = ({ producto }) => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const { nombreNegocio, redesSociales, direccion, ciudad } = useTenantBrand();

  const precioFormateado = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(producto.precio);

  const redWhatsApp = redesSociales?.find((r) => r.tipo === 'WHATSAPP' && r.activo);

  const handleConsultarWhatsApp = () => {
    const texto = encodeURIComponent(
      `¡Hola ${nombreNegocio}! Me interesa comprar el producto "${producto.nombre}" (${precioFormateado}) que vi en su catálogo online.`
    );

    if (redWhatsApp?.url) {
      const baseUrl = redWhatsApp.url.trim();
      const separator = baseUrl.includes('?') ? '&' : '?';
      window.open(`${baseUrl}${separator}text=${texto}`, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback a enlace genérico de WhatsApp si no hay número directo configurado
      window.open(`https://wa.me/?text=${texto}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCompartir = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }
    } catch {
      // noop
    }
  };

  return (
    <>
      <article className="kyrios-service-card d-flex flex-column h-100" aria-label={producto.nombre}>
        {/* Contenedor de Imagen */}
        <div
          className="kyrios-card-thumb-wrap position-relative cursor-pointer"
          onClick={() => setModalAbierto(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setModalAbierto(true)}
          aria-label={`Ver detalles de ${producto.nombre}`}
        >
          <ProductImg src={producto.imagenUrl} nombre={producto.nombre} />
          <span className="kyrios-service-price-badge">{precioFormateado}</span>
        </div>

        {/* Cuerpo de la Card */}
        <div className="p-4 d-flex flex-column flex-grow-1 justify-content-between">
          <div>
            <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
              <h3
                className="kyrios-service-name mb-0 text-truncate cursor-pointer"
                onClick={() => setModalAbierto(true)}
                title={producto.nombre}
              >
                {producto.nombre}
              </h3>
              <button
                type="button"
                className="btn btn-sm btn-link p-0 text-surface-muted"
                onClick={handleCompartir}
                title="Copiar enlace"
                aria-label="Compartir enlace del producto"
              >
                {copiado ? <Check size={16} className="text-success" /> : <Share2 size={16} />}
              </button>
            </div>

            {producto.descripcion ? (
              <p
                className="kyrios-service-desc mb-3"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: '2.6em',
                }}
              >
                {producto.descripcion}
              </p>
            ) : (
              <p className="kyrios-service-desc mb-3 text-surface-muted fst-italic" style={{ minHeight: '2.6em' }}>
                Producto exclusivo disponible en nuestra barbería.
              </p>
            )}
          </div>

          {/* Botón de acción */}
          <div className="pt-2">
            <button
              type="button"
              className="btn btn-success w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2 fw-semibold shadow-sm"
              style={{ borderRadius: '8px' }}
              onClick={handleConsultarWhatsApp}
            >
              <MessageCircle size={18} />
              <span>Pedir por WhatsApp</span>
            </button>
          </div>
        </div>
      </article>

      {/* Modal Detalle Completo del Producto */}
      {modalAbierto && (
        <Modal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          title={producto.nombre}
          size="md"
          footer={
            <div className="d-flex w-100 justify-content-between align-items-center">
              <span className="fs-5 fw-bold text-primary">{precioFormateado}</span>
              <div className="d-flex gap-2">
                <Button variant="secondary" onClick={() => setModalAbierto(false)}>
                  Cerrar
                </Button>
                <Button variant="primary" onClick={handleConsultarWhatsApp}>
                  <MessageCircle size={16} className="me-1" />
                  Pedir por WhatsApp
                </Button>
              </div>
            </div>
          }
        >
          <div className="d-flex flex-column gap-3">
            {producto.imagenUrl && (
              <div className="text-center rounded overflow-hidden" style={{ maxHeight: '280px', background: 'var(--home-surface-alt)' }}>
                <img
                  src={obtenerUrlFoto(producto.imagenUrl) || ''}
                  alt={producto.nombre}
                  className="img-fluid"
                  style={{ maxHeight: '280px', objectFit: 'contain' }}
                />
              </div>
            )}
            <div>
              <h5 className="fw-bold mb-1">Descripción</h5>
              <p className="text-surface-muted" style={{ whiteSpace: 'pre-line' }}>
                {producto.descripcion || 'Producto exclusivo disponible en sede física.'}
              </p>
            </div>
            {direccion && (
              <div className="p-3 rounded border small text-surface-muted" style={{ background: 'var(--home-surface-alt)' }}>
                <strong>Disponible en:</strong> {nombreNegocio} - {direccion}{ciudad ? `, ${ciudad}` : ''}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default ProductCard;

