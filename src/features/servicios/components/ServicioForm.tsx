import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, CheckCircle2, EyeOff } from 'lucide-react';
import Button from '../../../shared/ui/Button';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import FileUploadField from '../../../shared/ui/molecules/FileUploadField';
import SearchInput from '../../../shared/ui/molecules/SearchInput';
import EmptyState from '../../../shared/ui/molecules/EmptyState';
import UserAvatar from '../../../shared/ui/atoms/UserAvatar';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { useBarberosGestion } from '../../barberos';
import { servicioSchema, type ServicioFormValues, type ServicioFormInput } from '../schemas/servicio.schema';
import type { Servicio } from '../types/servicios.types';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import './servicios.css';

interface ServicioFormProps {
  servicioInicial?: Servicio | null;
  onSubmit: (datos: ServicioFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  loadingText?: string;
  errorMensaje?: string | null;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const ServicioForm: React.FC<ServicioFormProps> = ({
  servicioInicial,
  onSubmit,
  onCancel,
  isSubmitting = false,
  loadingText = 'Guardando...',
  errorMensaje,
  onDirtyChange,
}) => {
  const confirm = useConfirm();
  const { data: barberosGestion = [], isLoading: cargandoBarberos } = useBarberosGestion();
  const barberos = useMemo(
    () => barberosGestion.filter((b) => b.estado === 'ACTIVO'),
    [barberosGestion],
  );

  const [previewLocal, setPreviewLocal] = useState<string | null>(null);
  const [eliminarFotoExistente, setEliminarFotoExistente] = useState(false);
  const [busquedaBarbero, setBusquedaBarbero] = useState('');

  const barberosFiltrados = useMemo(() => {
    const q = busquedaBarbero.trim().toLowerCase();
    if (!q) return barberos;
    return barberos.filter((b) =>
      `${b.nombre} ${b.apellido}`.toLowerCase().includes(q),
    );
  }, [barberos, busquedaBarbero]);

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
    setBusquedaBarbero('');
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

        {/* BLOQUE 3: Barberos asignados */}
        <div className="col-12">
          <label className="form-label fw-semibold">Barberos que realizan este servicio</label>
          {cargandoBarberos ? (
            <KyriosSpinner size="xs" variant="inline" mensaje="Cargando barberos..." className="my-2" />
          ) : barberos.length === 0 ? (
            <EmptyState
              title="Sin barberos activos"
              description="No hay barberos con estado ACTIVO disponibles en el sistema."
            />
          ) : (
            <Controller
              control={control}
              name="barberoIds"
              render={({ field }) => {
                const seleccionados = field.value ?? [];
                const total = barberos.length;
                const count = seleccionados.length;

                return (
                  <div className="border rounded-3 p-3 bg-surface-card">
                    {/* Header: contador + acciones masivas */}
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                      <span
                        className="text-surface-muted small fw-semibold"
                        aria-live="polite"
                      >
                        {count} de {total} seleccionados
                      </span>

                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() =>
                            field.onChange(barberos.map((b) => Number(b.id)))
                          }
                          disabled={total === 0 || count === total}
                        >
                          Seleccionar todos
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => field.onChange([])}
                          disabled={count === 0}
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>

                    {/* Búsqueda */}
                    <SearchInput
                      placeholder="Buscar barbero por nombre..."
                      value={busquedaBarbero}
                      onChange={setBusquedaBarbero}
                      ariaLabel="Buscar barbero"
                      className="mb-3"
                    />

                    {/* Grid de chips o EmptyState */}
                    {barberosFiltrados.length === 0 ? (
                      <EmptyState
                        title="Sin coincidencias"
                        description={`No se encontraron barberos que coincidan con "${busquedaBarbero}".`}
                        actionLabel="Limpiar búsqueda"
                        onAction={() => setBusquedaBarbero('')}
                      />
                    ) : (
                      <div
                        className="d-flex flex-wrap gap-2"
                        role="group"
                        aria-label="Selección de barberos"
                      >
                        {barberosFiltrados.map((b) => {
                          const id = Number(b.id);
                          const seleccionado = seleccionados.includes(id);

                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => {
                                field.onChange(
                                  seleccionado
                                    ? seleccionados.filter((x) => x !== id)
                                    : [...seleccionados, id],
                                );
                              }}
                              aria-pressed={seleccionado}
                              title={`${seleccionado ? 'Quitar' : 'Añadir'} ${b.nombre} ${b.apellido}`}
                              className={`barbero-chip d-inline-flex align-items-center gap-2 ${
                                seleccionado ? 'barbero-chip--active' : ''
                              }`}
                            >
                              <UserAvatar
                                nombre={b.nombre}
                                apellido={b.apellido}
                                fotoUrl={b.fotoUrl}
                                size={28}
                              />
                              <span className="small fw-semibold text-nowrap">
                                {b.nombre} {b.apellido}
                              </span>
                              {seleccionado && (
                                <Check size={14} aria-hidden="true" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }}
            />
          )}
        </div>

        <div className="col-12 d-flex justify-content-end gap-2 mt-3">
          <Button type="button" variant="light" onClick={handleCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} loadingText={loadingText}>
            {servicioInicial ? 'Guardar Cambios' : 'Registrar Servicio'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ServicioForm;
