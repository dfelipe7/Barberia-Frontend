import React, { useState } from 'react';
import { Maximize2, MessageCircle, Package, Share2, Check } from 'lucide-react';
import type { ProductoCatalogoDTO } from '../../../features/productos/api/productos.dto';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { useTenantBrand } from '../../../features/negocio/context/TenantBrandContext';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';

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
      const baseUrl = redWhatsApp.url.trim();
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
        setTimeout(() => setCopiado(false), 2000);
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

      {/* Modal Detalle Completo del Producto al hacer clic en ver más o miniatura */}
      {modalAbierto && (
        <Modal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          title={producto.nombre}
          size="md"
          footer={
            <div className="d-flex w-100 justify-content-between align-items-center">
              <span className="fs-5 fw-bold text-primary">
                {formatPrecio(producto.precio)}
              </span>
              <div className="d-flex gap-2">
                <Button variant="secondary" onClick={() => setModalAbierto(false)}>
                  Cerrar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConsultarWhatsApp}
                  style={{
                    backgroundColor: '#25D366',
                    borderColor: '#25D366',
                    color: '#ffffff',
                  }}
                >
                  <MessageCircle size={16} className="me-1" />
                  Pedir por WhatsApp
                </Button>
              </div>
            </div>
          }
        >
          <div className="d-flex flex-column gap-3">
            {fotoCompleta && (
              <div
                className="text-center rounded overflow-hidden"
                style={{ maxHeight: '280px', background: 'var(--home-surface-alt)' }}
              >
                <img
                  src={fotoCompleta}
                  alt={producto.nombre}
                  className="img-fluid"
                  style={{ maxHeight: '280px', objectFit: 'contain' }}
                />
              </div>
            )}
            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="badge bg-secondary-subtle text-secondary fw-semibold">
                  PRODUCTO EXCLUSIVO
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none text-surface-muted p-0"
                  onClick={handleShare}
                >
                  {copiado ? (
                    <span className="text-success small d-inline-flex align-items-center gap-1">
                      <Check size={14} /> ¡Copiado!
                    </span>
                  ) : (
                    <span className="small d-inline-flex align-items-center gap-1">
                      <Share2 size={14} /> Compartir
                    </span>
                  )}
                </button>
              </div>
              <h5 className="fw-bold mb-2">{producto.nombre}</h5>
              <p className="text-surface-muted" style={{ whiteSpace: 'pre-line' }}>
                {producto.descripcion || 'Producto de alta calidad disponible en nuestra sede física.'}
              </p>
            </div>
            {direccion && (
              <div
                className="p-3 rounded border small text-surface-muted"
                style={{ background: 'var(--home-surface-alt)' }}
              >
                <strong>Disponible en:</strong> {nombreNegocio} - {direccion}
                {ciudad ? `, ${ciudad}` : ''}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default ProductCard;
