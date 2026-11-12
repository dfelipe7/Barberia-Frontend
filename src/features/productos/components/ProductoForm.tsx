import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '../../../shared/ui/Button';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import FileUploadField from '../../../shared/ui/molecules/FileUploadField';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import {
  productoSchema,
  type ProductoFormValues,
  type ProductoFormInput,
} from '../schemas/producto.schema';
import type { Producto } from '../types/productos.types';

interface ProductoFormProps {
  productoInicial?: Producto | null;
  onSubmit: (datos: ProductoFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  loadingText?: string;
  errorMensaje?: string | null;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const ProductoForm: React.FC<ProductoFormProps> = ({
  productoInicial,
  onSubmit,
  onCancel,
  isSubmitting = false,
  loadingText = 'Guardando...',
  errorMensaje,
  onDirtyChange,
}) => {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [previewLocal, setPreviewLocal] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProductoFormInput, unknown, ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: productoInicial?.nombre ?? '',
      descripcion: productoInicial?.descripcion ?? '',
      precio: productoInicial?.precio ?? ('' as unknown as number),
      imagen: undefined,
    },
  });

  const descripcionActual = useWatch({ control, name: 'descripcion' }) || '';

  // Notificar al contenedor sobre el estado dirty
  useEffect(() => {
    const hayCambioFoto = archivoSeleccionado !== null;
    onDirtyChange?.(isDirty || hayCambioFoto);
  }, [isDirty, archivoSeleccionado, onDirtyChange]);

  // Limpiar URL temporal del preview
  useEffect(() => {
    return () => {
      if (previewLocal) {
        URL.revokeObjectURL(previewLocal);
      }
    };
  }, [previewLocal]);

  const handleSeleccionarArchivo = (file: File) => {
    setArchivoSeleccionado(file);
    setValue('imagen', file, { shouldDirty: true, shouldValidate: true });
    if (previewLocal) {
      URL.revokeObjectURL(previewLocal);
    }
    setPreviewLocal(URL.createObjectURL(file));
  };

  const handleRemoverArchivo = () => {
    setArchivoSeleccionado(null);
    setValue('imagen', undefined, { shouldDirty: true, shouldValidate: true });
    if (previewLocal) {
      URL.revokeObjectURL(previewLocal);
      setPreviewLocal(null);
    }
  };

  const previewActual =
    previewLocal || obtenerUrlFoto(productoInicial?.imagenUrl) || undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-1">
      {errorMensaje && (
        <div className="mb-3">
          <ErrorMessage message={errorMensaje} />
        </div>
      )}

      {/* Sección Superior: Foto a la izquierda, Nombre y Precio a la derecha */}
      <div className="row g-3 mb-3 align-items-start">
        {/* Columna Foto */}
        <div className="col-12 col-sm-auto d-flex flex-column align-items-center align-items-sm-start">
          <label className="form-label fw-semibold mb-1 text-surface-muted small">
            Foto del Producto
          </label>
          <FileUploadField
            previewUrl={previewActual}
            placeholderTexto="Foto"
            shape="square"
            size={105}
            onFileSelected={handleSeleccionarArchivo}
            onRemove={previewActual ? handleRemoverArchivo : undefined}
            error={errors.imagen?.message}
          />
        </div>

        {/* Columna Nombre y Precio */}
        <div className="col-12 col-sm d-flex flex-column gap-2">
          {/* Nombre del Producto */}
          <div>
            <label htmlFor="producto-nombre" className="form-label fw-semibold small mb-1">
              Nombre del Producto <span className="text-danger">*</span>
            </label>
            <input
              id="producto-nombre"
              type="text"
              className={`form-control form-control-sm ${errors.nombre ? 'is-invalid' : ''}`}
              placeholder="Ej. Cera Fijadora Mate"
              maxLength={100}
              disabled={isSubmitting}
              {...register('nombre')}
            />
            {errors.nombre && (
              <div className="invalid-feedback small">{errors.nombre.message}</div>
            )}
          </div>

          {/* Precio */}
          <div>
            <label htmlFor="producto-precio" className="form-label fw-semibold small mb-1">
              Precio de Venta ($ COP) <span className="text-danger">*</span>
            </label>
            <div className="input-group input-group-sm">
              <span className="input-group-text">$</span>
              <input
                id="producto-precio"
                type="number"
                step="100"
                min="100"
                className={`form-control ${errors.precio ? 'is-invalid' : ''}`}
                placeholder="Ej. 35000"
                disabled={isSubmitting}
                {...register('precio', { valueAsNumber: true })}
              />
              {errors.precio && (
                <div className="invalid-feedback small">{errors.precio.message}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Descripción debajo a ancho completo */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <label htmlFor="producto-descripcion" className="form-label fw-semibold small mb-0">
            Descripción
          </label>
          <span className="text-surface-muted small" style={{ fontSize: '0.75rem' }}>
            {descripcionActual.length}/500
          </span>
        </div>
        <textarea
          id="producto-descripcion"
          rows={3}
          className={`form-control form-control-sm ${errors.descripcion ? 'is-invalid' : ''}`}
          placeholder="Características, beneficios o detalles de uso..."
          maxLength={500}
          disabled={isSubmitting}
          {...register('descripcion')}
        />
        {errors.descripcion && (
          <div className="invalid-feedback small">{errors.descripcion.message}</div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="d-flex justify-content-end gap-2 pt-2 border-top">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="d-inline-flex align-items-center gap-2">
              <KyriosSpinner size="xs" />
              <span>{loadingText}</span>
            </span>
          ) : productoInicial ? (
            'Guardar Cambios'
          ) : (
            'Crear Producto'
          )}
        </Button>
      </div>
    </form>
  );
};

export default ProductoForm;

