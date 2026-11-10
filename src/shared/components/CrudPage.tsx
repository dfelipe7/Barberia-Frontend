import React, { useState, useRef, useCallback } from 'react';
import Spinner from '../ui/Spinner';
import ErrorMessage from '../ui/ErrorMessage';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import PageHeader from '../ui/organisms/PageHeader';
import { useConfirm } from '../contexts/ConfirmContext';

export interface CrudPageProps<T> {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  createButtonText?: string;
  canCreate?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  // Modal de creación / edición
  modalTitle?: string;
  editModalTitle?: string;
  // T se usa aquí: el form recibe el registro cuando se está editando (undefined = modo creación)
  renderModalForm?: (props: {
    onClose: () => void;
    onDirectClose?: () => void;
    record?: T;
    setFormDirty?: (isDirty: boolean) => void;
  }) => React.ReactNode;
  onModalClose?: () => void;
  // Contenido de la vista
  children: React.ReactNode | ((ctx: { onEdit: (record: T) => void }) => React.ReactNode);
  actions?: React.ReactNode;
  filters?: React.ReactNode;
}

/**
 * PATRÓN TEMPLATE METHOD (Vía Composición):
 * Proporciona el esqueleto estructural y de ciclo de vida estándar para vistas CRUD:
 * cabecera, control de permisos de creación, slots de filtros, manejo declarativo de
 * loading/error, tabla/grid de resultados y modal de formulario (creación y edición).
 */
export function CrudPage<T>({
  eyebrow,
  title,
  subtitle,
  createButtonText = '+ Nuevo',
  canCreate = true,
  isLoading = false,
  error = null,
  onRetry,
  modalTitle = 'Nuevo Registro',
  editModalTitle = 'Editar Registro',
  renderModalForm,
  onModalClose,
  children,
  actions,
  filters,
}: CrudPageProps<T>) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<T | undefined>(undefined);
  const isDirtyRef = useRef(false);
  const confirm = useConfirm();

  const handleOpenCreateModal = () => {
    isDirtyRef.current = false;
    setEditingRecord(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: T) => {
    isDirtyRef.current = false;
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const setFormDirty = useCallback((dirty: boolean) => {
    isDirtyRef.current = dirty;
  }, []);

  const handleCloseModal = async () => {
    if (isDirtyRef.current) {
      const ok = await confirm({
        title: '¿Descartar cambios?',
        message: 'Los cambios sin guardar se perderán.',
        variant: 'warning',
        confirmLabel: 'Descartar',
        cancelLabel: 'Continuar editando',
      });
      if (!ok) return;
    }

    isDirtyRef.current = false;
    if (onModalClose) {
      onModalClose();
    }
    setIsModalOpen(false);
    setEditingRecord(undefined);
  };

  const handleDirectClose = () => {
    isDirtyRef.current = false;
    if (onModalClose) {
      onModalClose();
    }
    setIsModalOpen(false);
    setEditingRecord(undefined);
  };

  return (
    <div className="crud-page-container kyrios-page-container">
      {/* Header & Acciones */}
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        actions={
          actions || (canCreate && renderModalForm) ? (
            <>
              {actions}
              {canCreate && renderModalForm && (
                <Button variant="primary" onClick={handleOpenCreateModal} className="w-100 w-sm-auto justify-content-center text-center">
                  {createButtonText}
                </Button>
              )}
            </>
          ) : undefined
        }
      />

      {/* Filtros opcionales */}
      {filters && <div className="mb-4">{filters}</div>}

      {/* Estado de Error */}
      {error && <ErrorMessage message={error} onRetry={onRetry} />}

      {/* Estado de Carga */}
      {isLoading ? (
        <Spinner mensaje="Cargando información..." />
      ) : (
        <div className="crud-content">
          {typeof children === 'function' ? children({ onEdit: handleOpenEditModal }) : children}
        </div>
      )}

      {/* Modal de formulario CRUD (creación o edición según editingRecord) */}
      {renderModalForm && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingRecord ? editModalTitle : modalTitle}
          size="lg"
        >
          {renderModalForm({
            onClose: handleCloseModal,
            onDirectClose: handleDirectClose,
            record: editingRecord,
            setFormDirty,
          })}
        </Modal>
      )}
    </div>
  );
}

export default CrudPage;
