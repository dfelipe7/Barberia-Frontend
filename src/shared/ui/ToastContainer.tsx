import React, { useContext } from 'react';
import { Toast } from './Toast';
import { ToastContext } from './ToastContext';
import './toast.css';

export interface ToastContainerProps {
  toast?: {
    id?: string;
    variant: 'success' | 'danger' | 'warning' | 'info';
    message: string;
    duration?: number;
  } | null;
  onClose?: () => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toast: propToast,
  onClose: propOnClose,
}) => {
  const context = useContext(ToastContext);

  const activeToast = propToast !== undefined ? propToast : context?.toast;
  const handleClose = propOnClose || context?.hideToast || (() => {});

  if (!activeToast) return null;

  return (
    <div
      className="kyrios-toast-container"
      aria-label="Notificaciones del sistema"
    >
      <div className="kyrios-toast-wrapper">
        <Toast
          key={activeToast.id || `${activeToast.variant}-${activeToast.message}`}
          variant={activeToast.variant}
          message={activeToast.message}
          duration={activeToast.duration}
          onClose={handleClose}
        />
      </div>
    </div>
  );
};

export default ToastContainer;
