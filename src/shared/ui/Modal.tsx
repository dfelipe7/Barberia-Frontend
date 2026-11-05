import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './modal.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  role?: 'dialog' | 'alertdialog';
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  /** Si es true, el modal ocupa pantalla completa en móvil (< 576px).
   *  Por defecto false: modal centrado con márgenes en todos los tamaños. */
  fullscreenOnMobile?: boolean;
  /** Si es true, oculta el encabezado estándar para permitir headers personalizados */
  hideHeader?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  role = 'dialog',
  ariaLabelledBy,
  ariaDescribedBy,
  fullscreenOnMobile = false,
  hideHeader = false,
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass =
    size === 'sm' ? 'modal-sm'
    : size === 'lg' ? 'modal-lg'
    : size === 'xl' ? 'modal-xl'
    : '';

  // fullscreen solo si el consumidor lo pide explícitamente
  const fullscreenClass = fullscreenOnMobile ? 'modal-fullscreen-sm-down' : '';

  const modalNode = (
    <div
      className="modal fade show d-flex align-items-center justify-content-center"
      tabIndex={-1}
      role={role}
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        padding: '1.25rem 1rem',
        overflowY: 'auto',
        zIndex: 1060,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        className={`modal-dialog modal-dialog-centered modal-dialog-scrollable kyrios-modal-dialog ${sizeClass} ${fullscreenClass} ${className}`.trim()}
        role="document"
        style={{
          maxWidth: size === 'sm' ? '420px' : undefined,
          margin: 'auto',
          width: '100%',
        }}
      >
        <div
          className="modal-content shadow-lg kyrios-modal-content"
          style={{
            maxHeight: 'calc(100vh - 3rem)',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '24px',
            overflow: 'hidden',
          }}
        >
          {!hideHeader && title && (
            <div className="modal-header flex-shrink-0 px-4 pt-4 pb-2 border-0">
              <h5
                id={ariaLabelledBy}
                className="modal-title fw-bold kyrios-modal-title fs-5"
              >
                {title}
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                onClick={onClose}
              />
            </div>
          )}

          <div className="modal-body kyrios-modal-body p-0">{children}</div>

          {footer && (
            <div className="modal-footer flex-shrink-0 kyrios-modal-footer border-0 p-4 pt-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};

export default Modal;
