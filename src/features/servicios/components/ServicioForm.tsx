import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, EyeOff } from 'lucide-react';
import Button from '../../../shared/ui/Button';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import FileUploadField from '../../../shared/ui/molecules/FileUploadField';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { useBarberosGestion } from '../../barberos';
import { servicioSchema, type ServicioFormValues, type ServicioFormInput } from '../schemas/servicio.schema';
import type { Servicio } from '../types/servicios.types';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';

interface ServicioFormProps {
  servicioInicial?: Servicio | null;
  onSubmit: (datos: ServicioFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  errorMensaje?: string | null;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const ServicioForm: React.FC<ServicioFormProps> = ({
  servicioInicial,
  onSubmit,
  onCancel,
  isSubmitting = false,
  errorMensaje,
  onDirtyChange,
}) => {
  const confirm = useConfirm();
  const { data: barberosGestion = [], isLoading: cargandoBarberos } = useBarberosGestion();
  const barberos = barberosGestion.filter((b) => b.estado === 'ACTIVO');

  const [previewLocal, setPreviewLocal] = useState<string | null>(null);
  const [eliminarFotoExistente, setEliminarFotoExistente] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ServicioFormInput, unknown, ServicioFormValues>({
    resolver: zodResolver(servicioSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      precio: 0,
      duracionMinutos: 30,
      barberoIds: [],
      foto: undefined,
      eliminarFoto: false,
    },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Limpieza de memoria si existe previewLocal al desmontar o cambiar
  useEffect(() => {
    return () => {
      if (previewLocal) URL.revokeObjectURL(previewLocal);
    };
  }, [previewLocal]);

  const [prevServicioId, setPrevServicioId] = useState<string | number | undefined>(servicioInicial?.id);
  if (prevServicioId !== servicioInicial?.id) {
    setPrevServicioId(servicioInicial?.id);
    setPreviewLocal(null);
    setEliminarFotoExistente(false);
  }

  // Resetear formulario de react-hook-form al cambiar de servicio inicial
  useEffect(() => {
    if (servicioInicial) {
      reset({
        nombre: servicioInicial.nombre,
        descripcion: servicioInicial.descripcion ?? '',
        precio: servicioInicial.precio,
        duracionMinutos: servicioInicial.duracionMinutos,
        barberoIds: servicioInicial.barberos.map((b) => Number(b.id)),
        foto: undefined,
        eliminarFoto: false,
      });
    } else {
      reset({
        nombre: '',
        descripcion: '',
        precio: 0,
        duracionMinutos: 30,
        barberoIds: [],
        foto: undefined,
        eliminarFoto: false,
      });
    }
  }, [servicioInicial, reset]);

  const handleCancel = async () => {
    if (isDirty) {
      const ok = await confirm({
        title: '¿Descartar cambios?',
        message: 'Los cambios sin guardar se perderán.',
        variant: 'warning',
        confirmLabel: 'Descartar',
        cancelLabel: 'Continuar editando',
      });
      if (!ok) return;
    }
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Banner de visibilidad de servicio */}
      {servicioInicial && (
        <div
          className={`alert ${
            servicioInicial.estado === 'ACTIVO' ? 'alert-success' : 'alert-warning'
          } py-2 px-3 small d-flex align-items-center gap-2 mb-3`}
          role="status"
        >
          {servicioInicial.estado === 'ACTIVO' ? (
            <>
              <CheckCircle2 size={16} className="flex-shrink-0 text-success" />
              <span>Este servicio está visible para los clientes.</span>
            </>
          ) : (
            <>
              <EyeOff size={16} className="flex-shrink-0 text-warning-emphasis" />
              <span>Este servicio <strong>NO</strong> está visible para los clientes.</span>
            </>
          )}
        </div>
      )}

      {errorMensaje && <div className="alert alert-danger py-2 small">{errorMensaje}</div>}

      <div className="row g-3">
        {/* BLOQUE 1: Datos básicos */}
        <div className="col-12 col-sm-8">
          <label htmlFor="nombreServicio" className="form-label fw-semibold">
            Nombre <span className="text-danger">*</span>
          </label>
          <input
            id="nombreServicio"
            type="text"
            className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
            {...register('nombre')}
          />
          {errors.nombre && <div className="invalid-feedback">{errors.nombre.message}</div>}
        </div>

        <div className="col-12 col-sm-4">
          <label htmlFor="duracionServicio" className="form-label fw-semibold">
            Duración (min) <span className="text-danger">*</span>
          </label>
          <input
            id="duracionServicio"
            type="number"
            min={1}
            className={`form-control ${errors.duracionMinutos ? 'is-invalid' : ''}`}
            {...register('duracionMinutos', { valueAsNumber: true })}
          />
          {errors.duracionMinutos && (
            <div className="invalid-feedback">{errors.duracionMinutos.message}</div>
          )}
        </div>

        <div className="col-12">
          <label htmlFor="descripcionServicio" className="form-label fw-semibold">
            Descripción
          </label>
          <textarea
            id="descripcionServicio"
            className={`form-control ${errors.descripcion ? 'is-invalid' : ''}`}
            rows={2}
            {...register('descripcion')}
          />
          {errors.descripcion && (
            <div className="invalid-feedback">{errors.descripcion.message}</div>
          )}
        </div>

        <div className="col-12 col-sm-6">
          <label htmlFor="precioServicio" className="form-label fw-semibold">
            Precio ($) <span className="text-danger">*</span>
          </label>
          <input
            id="precioServicio"
            type="number"
            min={0}
            step={500}
            className={`form-control ${errors.precio ? 'is-invalid' : ''}`}
            {...register('precio', { valueAsNumber: true })}
          />
          {errors.precio && <div className="invalid-feedback">{errors.precio.message}</div>}
        </div>

        {/* Separador hacia BLOQUE 2: Imagen */}
        <div className="col-12">
          <hr className="my-2" />
        </div>

        {/* BLOQUE 2: Imagen del servicio */}
        <div className="col-12 mb-2">
          <label className="form-label fw-semibold mb-2">Imagen del servicio</label>

          <FileUploadField
            previewUrl={
              previewLocal ||
              (!eliminarFotoExistente && servicioInicial ? obtenerUrlFoto(servicioInicial.fotoUrl) : null)
            }
            placeholderTexto="Imagen"
            onFileSelected={(file) => {
              setPreviewLocal(URL.createObjectURL(file));
              setValue('foto', file, { shouldDirty: true });
              setEliminarFotoExistente(false);
              setValue('eliminarFoto', false, { shouldDirty: true });
            }}
            onRemove={
              previewLocal || (!eliminarFotoExistente && servicioInicial?.fotoUrl)
                ? async () => {
                    // Caso 1: hay preview local → solo limpiar el estado local
                    if (previewLocal) {
                      URL.revokeObjectURL(previewLocal);
                      setPreviewLocal(null);
                      setValue('foto', undefined, { shouldDirty: true });
                      // Si además había foto en el server y estamos editando,
                      // preguntar si también la borramos del backend
                      if (servicioInicial?.fotoUrl) {
                        const ok = await confirm({
                          title: '¿Eliminar imagen del servicio?',
                          message: 'Se quitará la imagen actual del servicio.',
                          variant: 'danger',
                          confirmLabel: 'Eliminar',
                        });
                        if (ok) {
                          setEliminarFotoExistente(true);
                          setValue('eliminarFoto', true, { shouldDirty: true });
                        }
                      }
                      return;
                    }

                    // Caso 2: solo había foto en el server → confirmar
                    const ok = await confirm({
                      title: '¿Eliminar imagen del servicio?',
                      message: 'Se quitará la imagen actual del servicio.',
                      variant: 'danger',
                      confirmLabel: 'Eliminar',
                    });
                    if (ok) {
                      setEliminarFotoExistente(true);
                      setValue('eliminarFoto', true, { shouldDirty: true });
                    }
                  }
                : undefined
            }
            shape="square"
            size={160}
            error={errors.foto?.message as string | undefined}
          />

          <div className="text-muted small mt-2">
            Formatos permitidos: JPG, PNG o WEBP. Máximo 5 MB.
          </div>
        </div>

        {/* Separador hacia BLOQUE 3: Barberos */}
        <div className="col-12">
          <hr className="my-2" />
        </div>

        {/* BLOQUE 3: Barberos asignados (conservado para 9B) */}
        <div className="col-12">
          <label className="form-label fw-semibold">Barberos que realizan este servicio</label>
          {cargandoBarberos ? (
            <KyriosSpinner size="xs" variant="inline" mensaje="Cargando barberos..." className="my-2" />
          ) : (
            <Controller
              control={control}
              name="barberoIds"
              render={({ field }) => (
                <div className="border rounded p-2" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                  {barberos.length === 0 && (
                    <div className="text-muted small">No hay barberos activos disponibles.</div>
                  )}
                  {barberos.map((b) => (
                    <div className="form-check" key={b.id}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`barbero-${b.id}`}
                        checked={field.value?.includes(Number(b.id)) ?? false}
                        onChange={(e) => {
                          const actuales = field.value ?? [];
                          const idNumerico = Number(b.id);
                          field.onChange(
                            e.target.checked
                              ? [...actuales, idNumerico]
                              : actuales.filter((id) => id !== idNumerico)
                          );
                        }}
                      />
                      <label className="form-check-label" htmlFor={`barbero-${b.id}`}>
                        {b.nombre} {b.apellido}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            />
          )}
        </div>

        <div className="col-12 d-flex justify-content-end gap-2 mt-3">
          <Button type="button" variant="light" onClick={handleCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} loadingText="Guardando...">
            {servicioInicial ? 'Guardar Cambios' : 'Registrar Servicio'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ServicioForm;
