import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';
import ComisionSlider from '../../../shared/ui/molecules/ComisionSlider';
import {
  actualizarComisionSchema,
  type ActualizarComisionFormValues,
} from '../schemas/barbero.schema';
import type { BarberoGestion } from '../types/barberos.types';

interface CommissionModalProps {
  isOpen: boolean;
  barbero: BarberoGestion | null;
  onClose: () => void;
  onSubmit: (barberoId: number, porcentaje: number) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export const CommissionModal: React.FC<CommissionModalProps> = ({
  isOpen,
  barbero,
  onClose,
  onSubmit,
  isLoading = false,
  error,
}) => {
  const {
    register,
    watch,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ActualizarComisionFormValues>({
    resolver: zodResolver(actualizarComisionSchema),
    defaultValues: {
      porcentajeComision: 50,
    },
  });

  const valorComision = watch('porcentajeComision');

  useEffect(() => {
    if (barbero) {
      setValue('porcentajeComision', barbero.porcentajeComision);
    }
  }, [barbero, setValue]);

  const handleModalClose = () => {
    reset();
    onClose();
  };

  const onFormSubmit = async (data: ActualizarComisionFormValues) => {
    if (!barbero) return;
    await onSubmit(barbero.id, data.porcentajeComision);
    reset();
  };

  if (!isOpen || !barbero) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={`Modificar Comisión - ${barbero.nombre} ${barbero.apellido}`}
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
            Actualizar Comisión
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onFormSubmit)}>
        {error && <div className="alert alert-danger mb-3">{error}</div>}

        <p className="text-muted small mb-3">
          Ajusta el porcentaje de comisión que recibe este barbero por cada servicio
          prestado.
        </p>

        <div className="mb-3">
          <ComisionSlider
            id="comisionInput"
            valorActual={valorComision}
            registerProps={register('porcentajeComision', { valueAsNumber: true })}
            onChange={(n) => setValue('porcentajeComision', n, { shouldValidate: true })}
            error={errors.porcentajeComision?.message}
            disabled={isLoading}
          />
        </div>
      </form>
    </Modal>
  );
};

export default CommissionModal;
