import { useState, useCallback } from 'react';

export type ToastVariant = 'success' | 'danger' | 'warning' | 'info';

export interface ToastState {
  variant: ToastVariant;
  message: string;
  duration?: number;
  id: string;
}

/**
 * Hook reutilizable para mostrar notificaciones tipo toast.
 * Genera un id único por toast para forzar el re-render con animación
 * cuando se dispara un segundo toast antes de que el anterior desaparezca.
 *
 * @param defaultDuration - duración en ms antes de auto-cierre (default: 4000)
 */
export function useToast(defaultDuration = 4000) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (variant: ToastVariant, message: string, duration = defaultDuration) => {
      setToast({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        variant,
        message,
        duration,
      });
    },
    [defaultDuration]
  );

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}
