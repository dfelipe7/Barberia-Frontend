import React, { useState } from 'react';
import Spinner from '../ui/Spinner';
import ErrorMessage from '../ui/ErrorMessage';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export interface CrudPageProps<T> {
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
  renderModalForm?: (props: { onClose: () => void; record?: T }) => React.ReactNode;
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
  children,
  actions,
  filters,
}: CrudPageProps<T>) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<T | undefined>(undefined);

  const handleOpenCreateModal = () => {
    setEditingRecord(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: T) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(undefined);
  };

  return (
    <div className="crud-page-container">
      {/* Header & Acciones */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="h2 fw-bold mb-1">{title}</h1>
          {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
        </div>

        <div className="d-flex align-items-center gap-2">
          {actions}
          {canCreate && renderModalForm && (
            <Button variant="primary" onClick={handleOpenCreateModal}>
              {createButtonText}
            </Button>
          )}
        </div>
      </div>

      {/* Filtros opcionales */}
      {filters && <div className="mb-4">{filters}</div>}

      {/* Estado de Error */}
      {error && <ErrorMessage message={error} onRetry={onRetry} />}

      {/* Estado de Carga */}
      {isLoading ? (
        <Spinner mensaje="Cargando información..." />
      ) : (
        <div className="crud-content">
          {typeof children === 'function'
            ? children({ onEdit: handleOpenEditModal })
            : children}
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
          {renderModalForm({ onClose: handleCloseModal, record: editingRecord })}
        </Modal>
      )}
    </div>
  );
}

export default CrudPage;