/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import ConfirmDialog from '../ui/molecules/ConfirmDialog';

export interface ConfirmOptions {
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;   // default 'Confirmar'
  cancelLabel?: string;    // default 'Cancelar'
  variant?: 'danger' | 'warning' | 'primary';  // color botón confirmar
  icon?: React.ReactNode;
}

interface ConfirmRequest {
  id: string;
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

export type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>;

export interface ConfirmContextValue {
  confirm: ConfirmFunction;
}

export const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<ConfirmRequest[]>([]);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const request: ConfirmRequest = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        options,
        resolve,
      };
      setQueue((prev) => [...prev, request]);
    });
  }, []);

  const current = queue[0] ?? null;

  const handleConfirm = useCallback(() => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const [head, ...rest] = prev;
      head.resolve(true);
      return rest;
    });
  }, []);

  const handleCancel = useCallback(() => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const [head, ...rest] = prev;
      head.resolve(false);
      return rest;
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {current && (
        <ConfirmDialog
          key={current.id}
          isOpen={true}
          title={current.options.title}
          message={current.options.message}
          confirmLabel={current.options.confirmLabel}
          cancelLabel={current.options.cancelLabel}
          variant={current.options.variant}
          icon={current.options.icon}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmFunction => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm debe usarse dentro de un ConfirmProvider');
  }

  return context.confirm;
};

export default ConfirmContext;
