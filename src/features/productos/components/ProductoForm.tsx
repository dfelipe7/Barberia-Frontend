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

      {/* Sección Foto del Producto */}
      <div className="mb-4 d-flex flex-column align-items-center">
        <label className="form-label fw-semibold mb-2 text-surface-muted small">
          Foto del Producto (Opcional)
        </label>
        <FileUploadField
          previewUrl={previewActual}
          placeholderTexto="Producto"
          shape="square"
          size={120}
          onFileSelected={handleSeleccionarArchivo}
          onRemove={previewActual ? handleRemoverArchivo : undefined}
          error={errors.imagen?.message}
        />
        <span className="text-surface-muted small mt-2">
          Formatos admitidos: JPG, PNG, WEBP (máx. 5 MB)
        </span>
      </div>

      {/* Nombre del Producto */}
      <div className="mb-3">
        <label htmlFor="producto-nombre" className="form-label fw-semibold">
          Nombre del Producto <span className="text-danger">*</span>
        </label>
        <input
          id="producto-nombre"
          type="text"
          className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
          placeholder="Ej. Cera Fijadora Mate 100g"
          maxLength={100}
          disabled={isSubmitting}
          {...register('nombre')}
        />
        {errors.nombre && (
          <div className="invalid-feedback">{errors.nombre.message}</div>
        )}
      </div>

      {/* Precio */}
      <div className="mb-3">
        <label htmlFor="producto-precio" className="form-label fw-semibold">
          Precio de Venta ($ COP) <span className="text-danger">*</span>
        </label>
        <div className="input-group">
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
            <div className="invalid-feedback">{errors.precio.message}</div>
          )}
        </div>
      </div>

      {/* Descripción */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <label htmlFor="producto-descripcion" className="form-label fw-semibold mb-0">
            Descripción
          </label>
          <span className="text-surface-muted small">
            {descripcionActual.length}/500
          </span>
        </div>
        <textarea
          id="producto-descripcion"
          rows={3}
          className={`form-control ${errors.descripcion ? 'is-invalid' : ''}`}
          placeholder="Características, beneficios, modo de uso o tamaño del producto..."
          maxLength={500}
          disabled={isSubmitting}
          {...register('descripcion')}
        />
        {errors.descripcion && (
          <div className="invalid-feedback">{errors.descripcion.message}</div>
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

