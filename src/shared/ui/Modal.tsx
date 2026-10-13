import React, { useEffect } from 'react';
import './modal.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  role?: 'dialog' | 'alertdialog';
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  /** Si es true, el modal ocupa pantalla completa en móvil (< 576px).
   *  Por defecto false: modal centrado con márgenes en todos los tamaños. */
  fullscreenOnMobile?: boolean;
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

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role={role}
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className={`modal-dialog modal-dialog-centered modal-dialog-scrollable kyrios-modal-dialog ${sizeClass} ${fullscreenClass}`.trim()}
          role="document"
          style={{
            // size="sm" sin max-width Bootstrap explícito: forzamos 420px
            maxWidth: size === 'sm' ? '420px' : undefined,
            margin: '1rem auto',
          }}
        >
          <div
            className="modal-content shadow kyrios-modal-content"
            style={{
              maxHeight: 'calc(100vh - 2rem)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="modal-header flex-shrink-0">
              <h5
                id={ariaLabelledBy}
                className="modal-title fw-bold kyrios-modal-title"
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

            <div className="modal-body kyrios-modal-body">{children}</div>

            {footer && (
              <div className="modal-footer flex-shrink-0 kyrios-modal-footer">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
    </>
  );
};

export default Modal;
