import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type ToastVariant = 'success' | 'danger' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  duration?: number;
}

export interface ToastContextValue {
  toast: ToastItem | null;
  showToast: (variant: ToastVariant, message: string, duration?: number) => void;
  hideToast: () => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastItem | null>(null);

  const showToast = useCallback(
    (variant: ToastVariant, message: string, duration = 4000) => {
      setToast({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        variant,
        message,
        duration,
      });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const value = useMemo(
    () => ({ toast, showToast, hideToast }),
    [toast, showToast, hideToast]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToastContext = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};
