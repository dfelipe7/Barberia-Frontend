import React, { useEffect, useRef, useId } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { AlertTriangle, Info, Trash2, Check } from 'lucide-react';
import './ConfirmDialog.css';

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
        <div className="confirm-dialog__icon confirm-dialog__icon--danger">
          <Trash2 size={26} aria-hidden="true" />
        </div>
      );
    }
    if (variant === 'warning') {
      return (
        <div className="confirm-dialog__icon confirm-dialog__icon--warning">
          <AlertTriangle size={26} aria-hidden="true" />
        </div>
      );
    }
    return (
      <div className="confirm-dialog__icon confirm-dialog__icon--primary">
        <Info size={26} aria-hidden="true" />
      </div>
    );
  };

  const renderConfirmIcon = () => {
    if (variant === 'danger') {
      return <Trash2 size={16} aria-hidden="true" className="me-1" />;
    }
    if (variant === 'warning') {
      return <AlertTriangle size={16} aria-hidden="true" className="me-1" />;
    }
    return <Check size={16} aria-hidden="true" className="me-1" />;
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
      fullscreenOnMobile={false}
      footer={
        <div className="confirm-dialog__footer d-flex justify-content-end gap-2">
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
            {renderConfirmIcon()}
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className={`confirm-dialog__stripe confirm-dialog__stripe--${variant}`} />
      <div className="d-flex align-items-start gap-3 py-1">
        {renderIcon()}
        <div
          id={descId}
          className="flex-grow-1 confirm-dialog__message"
          style={{
            fontSize: '0.95rem',
            lineHeight: '1.55',
            minWidth: 0,
            overflowWrap: 'anywhere',
          }}
        >
          {typeof message === 'string' ? <p className="mb-0">{message}</p> : message}
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
