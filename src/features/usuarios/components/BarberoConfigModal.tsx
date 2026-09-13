import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';
import {
  configurarBarberoSchema,
  type ConfigurarBarberoFormValues,
} from '../schemas/usuario.schema';
import type { AdministradorGestion } from '../types/usuarios.types';

interface BarberoConfigModalProps {
  isOpen: boolean;
  admin: AdministradorGestion | null;
  onClose: () => void;
  onSubmit: (datos: ConfigurarBarberoFormValues) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export const BarberoConfigModal: React.FC<BarberoConfigModalProps> = ({
  isOpen,
  admin,
  onClose,
  onSubmit,
  isLoading = false,
  error,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConfigurarBarberoFormValues>({
    resolver: zodResolver(configurarBarberoSchema),
    defaultValues: {
      telefono: '',
      porcentajeComision: 50,
    },
  });

  const handleModalClose = () => {
    reset();
    onClose();
  };

  const onFormSubmit = async (data: ConfigurarBarberoFormValues) => {
    await onSubmit(data);
    reset();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={
        admin
          ? `Asignar Perfil de Barbero a ${admin.nombre}`
          : 'Convertirme en Barbero'
      }
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={handleModalClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit(onFormSubmit)}
            isLoading={isLoading}
            loadingText="Guardando..."
          >
            Confirmar Perfil
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onFormSubmit)}>
        {error && <div className="alert alert-danger mb-3">{error}</div>}

        <p className="text-muted small mb-3">
          Al habilitar el perfil de barbero, este usuario podrá aparecer en la agenda de
          turnos y recibir comisiones por los servicios realizados.
        </p>

        <div className="mb-3">
          <label htmlFor="telefono" className="form-label fw-semibold">
            Número de Teléfono <span className="text-danger">*</span>
          </label>
          <input
            id="telefono"
            type="tel"
            className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
            placeholder="Ej: +57 300 123 4567"
            {...register('telefono')}
          />
          {errors.telefono && (
            <div className="invalid-feedback">{errors.telefono.message}</div>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="porcentajeComision" className="form-label fw-semibold">
            Porcentaje de Comisión (%) <span className="text-danger">*</span>
          </label>
          <div className="input-group">
            <input
              id="porcentajeComision"
              type="number"
              min="0"
              max="100"
              className={`form-control ${errors.porcentajeComision ? 'is-invalid' : ''}`}
              {...register('porcentajeComision', { valueAsNumber: true })}
            />
            <span className="input-group-text">%</span>
          </div>
          {errors.porcentajeComision && (
            <div className="invalid-feedback d-block">
              {errors.porcentajeComision.message}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default BarberoConfigModal;
