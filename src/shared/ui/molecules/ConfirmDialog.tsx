import React, { useEffect, useRef, useId } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;   // default 'Confirmar'
  cancelLabel?: string;    // default 'Cancelar'
  variant?: 'danger' | 'warning' | 'primary';  // color botón confirmar
  isLoading?: boolean;
  icon?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  isLoading = false,
  icon,
  onConfirm,
  onCancel,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const reactId = useId();
  const titleId = `confirm-dialog-title-${reactId.replace(/:/g, '')}`;
  const descId = `confirm-dialog-desc-${reactId.replace(/:/g, '')}`;

  // Focus inicial en Cancelar al abrir (Emil Kowalski: evitar confirmaciones accidentales)
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Manejo de teclado: Escape cancela, Enter confirma
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!isLoading) {
          onCancel();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!isLoading) {
          void onConfirm();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel, onConfirm, isLoading]);

  const renderIcon = () => {
    if (icon !== undefined) return icon;
    if (variant === 'danger') {
      return (
        <div className="p-2 rounded-circle bg-danger bg-opacity-10 text-danger flex-shrink-0 d-flex align-items-center justify-content-center">
          <AlertTriangle size={22} aria-hidden="true" />
        </div>
      );
    }
    if (variant === 'warning') {
      return (
        <div className="p-2 rounded-circle bg-warning bg-opacity-10 text-warning flex-shrink-0 d-flex align-items-center justify-content-center">
          <AlertCircle size={22} aria-hidden="true" />
        </div>
      );
    }
    return (
      <div className="p-2 rounded-circle bg-primary bg-opacity-10 text-primary flex-shrink-0 d-flex align-items-center justify-content-center">
        <Info size={22} aria-hidden="true" />
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      role="alertdialog"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descId}
      footer={
        <div className="d-flex justify-content-end gap-2 w-100">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            autoFocus
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="d-flex align-items-start gap-3 py-1">
        {renderIcon()}
        <div id={descId} className="flex-grow-1 text-secondary" style={{ fontSize: '0.925rem', lineHeight: '1.45' }}>
          {typeof message === 'string' ? <p className="mb-0">{message}</p> : message}
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
