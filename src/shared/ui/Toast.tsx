import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useSystemTheme } from '../lib/useSystemTheme';
import './toast.css';

export interface ToastProps {
  variant: 'success' | 'danger' | 'warning' | 'info';
  message: string;
  duration?: number; // ms, default 4000
  onClose: () => void;
  dismissible?: boolean; // default true
}

export const Toast: React.FC<ToastProps> = ({
  variant,
  message,
  duration = 4000,
  onClose,
  dismissible = true,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<number | null>(null);
  const systemTheme = useSystemTheme();

  const handleClose = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    window.setTimeout(() => {
      onClose();
    }, 180);
  }, [isExiting, onClose]);

  useEffect(() => {
    if (duration <= 0) return;

    timerRef.current = window.setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [duration, handleClose]);

  const renderIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle2 size={20} className="text-success flex-shrink-0" />;
      case 'danger':
        return <XCircle size={20} className="text-danger flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-warning flex-shrink-0" />;
      case 'info':
      default:
        return <Info size={20} className="flex-shrink-0" style={{ color: '#0071BC' }} />;
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`kyrios-toast kyrios-toast-${variant} kyrios-toast-${systemTheme} ${
        isExiting ? 'kyrios-toast-exiting' : 'kyrios-toast-animating'
      }`}
    >
      <div className="d-flex align-items-center mt-1">
        {renderIcon()}
      </div>

      <div className="flex-grow-1 small fw-medium" style={{ lineHeight: 1.45 }}>
        {message}
      </div>

      {dismissible && (
        <button
          type="button"
          className="btn btn-sm btn-link text-muted p-0 ms-2 text-decoration-none border-0 bg-transparent flex-shrink-0"
          onClick={handleClose}
          aria-label="Cerrar notificación"
          style={{ opacity: 0.7, lineHeight: 1 }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Toast;
