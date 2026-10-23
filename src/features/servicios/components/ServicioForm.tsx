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
  const { data: barberosGestion = [], isLoading: cargandoBarberos } = useBarberosGestion({
    estado: 'ACTIVO',
  });
  const barberos = useMemo(
    () =>
      barberosGestion.filter(
        (b) => b.estado === 'ACTIVO' && b.estadoGlobal === 'ACTIVO',
      ),
    [barberosGestion],
  );

  const [previewLocal, setPreviewLocal] = useState<string | null>(null);
  const [eliminarFotoExistente, setEliminarFotoExistente] = useState(false);
  const [busquedaBarbero, setBusquedaBarbero] = useState('');

  // Normalización de texto para búsqueda insensible a acentos/diacríticos (ej. 'Jose' encuentra 'José')
  const normalizar = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const barberosFiltrados = useMemo(() => {
    const q = normalizar(busquedaBarbero.trim());
    if (!q) return barberos;
    return barberos.filter((b) =>
      normalizar(`${b.nombre} ${b.apellido}`).includes(q),
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

  // Se revoca el object URL del preview para evitar memory leak al cambiar de imagen varias veces
  useEffect(() => {
    return () => {
      if (previewLocal) URL.revokeObjectURL(previewLocal);
    };
  }, [previewLocal]);

  // Ajuste reactivo de estados durante render al cambiar la prop servicioInicial
  const [prevServicioId, setPrevServicioId] = useState<string | number | undefined>(servicioInicial?.id);
  if (prevServicioId !== servicioInicial?.id) {
    setPrevServicioId(servicioInicial?.id);
    setPreviewLocal(null);
    setEliminarFotoExistente(false);
    setBusquedaBarbero('');
  }

  // Sincronización del formulario de react-hook-form al cambiar el servicio en edición
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

  /**
   * Intercepta la selección de imagen: si ya existe una imagen previa
   * (local o en el servidor), muestra un confirm antes de reemplazarla.
   * Al ser async, FileUploadField espera el resultado antes de resetear
   * el input, permitiendo re-seleccionar el mismo archivo si se cancela.
   */
  const handleFileSelected = async (file: File) => {
    const tieneImagenPrevia =
      Boolean(previewLocal) ||
      Boolean(servicioInicial?.fotoUrl && !eliminarFotoExistente);

    if (tieneImagenPrevia) {
      const ok = await confirm({
        title: '¿Reemplazar imagen actual?',
        message: (
          <div className="d-flex flex-column gap-2 small">
            <p className="mb-0">
              El servicio ya tiene una imagen asignada. Se reemplazará por
              la nueva que has seleccionado.
            </p>
            <p className="mb-0 text-surface-muted">
              Esta acción se aplicará al guardar el formulario.
            </p>
          </div>
        ),
        variant: 'warning',
        confirmLabel: 'Reemplazar',
        cancelLabel: 'Mantener actual',
      });
      if (!ok) return; // input se resetea en FileUploadField después de que resuelva
    }

    // Aplicar la nueva imagen
    if (previewLocal) URL.revokeObjectURL(previewLocal);
    setPreviewLocal(URL.createObjectURL(file));
    setValue('foto', file, { shouldDirty: true });
    setEliminarFotoExistente(false);
    setValue('eliminarFoto', false, { shouldDirty: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="servicio-form-wrapper px-4 pb-4 pt-1">
      {/* Banner de visibilidad de servicio */}
      {servicioInicial && (
        <div
          className={`servicio-form-status-banner alert ${
            servicioInicial.estado === 'ACTIVO' ? 'alert-success' : 'alert-warning'
          } py-2 px-3 small d-flex align-items-center gap-2 mb-3 rounded-3 shadow-sm border`}
          role="status"
        >
          {servicioInicial.estado === 'ACTIVO' ? (
            <>
              <CheckCircle2 size={16} className="flex-shrink-0 text-success" />
              <span>Este servicio está visible para los clientes en el catálogo.</span>
            </>
          ) : (
            <>
              <EyeOff size={16} className="flex-shrink-0 text-warning-emphasis" />
              <span>Este servicio <strong>NO</strong> está visible para los clientes.</span>
            </>
          )}
        </div>
      )}

      {/* Banner de progreso al subir imagen */}
      {isSubmitting && loadingText === 'Subiendo imagen...' && (
        <div
          className="upload-banner alert py-2 px-3 small d-flex align-items-center gap-2 upload-banner-anim mb-3 rounded-3"
          role="status"
          style={{
            background: 'rgba(0, 113, 188, 0.12)',
            border: '1px solid rgba(0, 113, 188, 0.3)',
            color: 'var(--surface-card-text)',
          }}
        >
          <KyriosSpinner size="xs" aria-hidden="true" />
          <span>Subiendo imagen del servicio...</span>
        </div>
      )}

      {errorMensaje && <div className="alert alert-danger py-2 small rounded-3 mb-3">{errorMensaje}</div>}

      <div className="row g-3">
        {/* BLOQUE 1: Datos principales del servicio (Columna Izquierda) */}
        <div className="col-12 col-md-7">
          <div className="d-flex flex-column gap-3">
            <div>
              <label htmlFor="nombreServicio" className="form-label servicio-form-label">
                Nombre del servicio <span className="text-danger">*</span>
              </label>
              <input
                id="nombreServicio"
                type="text"
                placeholder="Ej. Corte Clásico y Barba"
                className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                {...register('nombre')}
              />
              {errors.nombre && <div className="invalid-feedback">{errors.nombre.message}</div>}
            </div>

            <div className="row g-2">
              <div className="col-6">
                <label htmlFor="precioServicio" className="form-label fw-semibold">
                  Precio ($) <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    id="precioServicio"
                    type="number"
                    min={0}
                    step={500}
                    placeholder="50000"
                    className={`form-control ${errors.precio ? 'is-invalid' : ''}`}
                    {...register('precio', { valueAsNumber: true })}
                  />
                </div>
                {errors.precio && (
                  <div className="invalid-feedback d-block">{errors.precio.message}</div>
                )}
              </div>

              <div className="col-6">
                <label htmlFor="duracionServicio" className="form-label fw-semibold">
                  Duración (min) <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    id="duracionServicio"
                    type="number"
                    min={1}
                    placeholder="30"
                    className={`form-control ${errors.duracionMinutos ? 'is-invalid' : ''}`}
                    {...register('duracionMinutos', { valueAsNumber: true })}
                  />
                  <span className="input-group-text">min</span>
                </div>
                {errors.duracionMinutos && (
                  <div className="invalid-feedback d-block">{errors.duracionMinutos.message}</div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="descripcionServicio" className="form-label fw-semibold">
                Descripción
              </label>
              <textarea
                id="descripcionServicio"
                placeholder="Describe qué incluye el servicio y técnicas utilizadas..."
                className={`form-control ${errors.descripcion ? 'is-invalid' : ''}`}
                rows={3}
                {...register('descripcion')}
              />
              {errors.descripcion && (
                <div className="invalid-feedback">{errors.descripcion.message}</div>
              )}
            </div>
          </div>
        </div>

        {/* BLOQUE 2: Imagen del servicio (Columna Derecha organizada) */}
        <div className="col-12 col-md-5">
          <div
            role="group"
            aria-labelledby="imagen-label"
            className="servicio-form-image-card p-3 border rounded-3 bg-surface-card h-100 d-flex flex-column align-items-center justify-content-between text-center"
          >
            <div className="w-100 text-start">
              <span id="imagen-label" className="form-label fw-semibold mb-1 d-block">
                Imagen del servicio
              </span>
              <p className="text-surface-muted small mb-0" style={{ fontSize: '0.76rem' }}>
                Foto representativa en el catálogo público
              </p>
            </div>

            <div className="servicio-form-file-upload my-2">
              <FileUploadField
                previewUrl={
                  previewLocal ||
                  (!eliminarFotoExistente && servicioInicial
                    ? obtenerUrlFoto(servicioInicial.fotoUrl)
                    : null)
                }
                placeholderTexto="Sin imagen"
                onFileSelected={handleFileSelected}
                onRemove={
                  previewLocal || (!eliminarFotoExistente && servicioInicial?.fotoUrl)
                    ? async () => {
                        // Caso 1: hay preview local (imagen recién seleccionada pero no guardada)
                        if (previewLocal) {
                          const ok = await confirm({
                            title: '¿Quitar imagen seleccionada?',
                            message:
                              'La imagen que seleccionaste se descartará. La imagen actual del servicio no se verá afectada.',
                            variant: 'warning',
                            confirmLabel: 'Quitar',
                            cancelLabel: 'Mantener',
                          });
                          if (!ok) return;

                          URL.revokeObjectURL(previewLocal);
                          setPreviewLocal(null);
                          setValue('foto', undefined, { shouldDirty: true });
                          return;
                        }

                        // Caso 2: solo hay imagen en el servidor → confirmar borrado
                        const ok = await confirm({
                          title: '¿Eliminar imagen del servicio?',
                          message:
                            'Se quitará la imagen actual del servicio. Esta acción se aplicará al guardar el formulario.',
                          variant: 'danger',
                          confirmLabel: 'Eliminar',
                          cancelLabel: 'Mantener',
                        });
                        if (ok) {
                          setEliminarFotoExistente(true);
                          setValue('eliminarFoto', true, { shouldDirty: true });
                        }
                      }
                    : undefined
                }
                shape="square"
                size={145}
                error={errors.foto?.message as string | undefined}
              />
            </div>

            {/* Botón para deshacer el marcado de eliminación */}
            {eliminarFotoExistente && (
              <button
                type="button"
                className="btn btn-sm btn-link p-0 my-1 text-decoration-none"
                onClick={() => {
                  setEliminarFotoExistente(false);
                  setValue('eliminarFoto', false, { shouldDirty: true });
                }}
              >
                ↩ Deshacer eliminación
              </button>
            )}
          </div>
        </div>

        {/* BLOQUE 3: Barberos asignados */}
        <div className="col-12 mt-3 pt-3 border-top">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <label className="servicio-form-label mb-0">
              Barberos que realizan este servicio
            </label>
            <span className="text-surface-muted small" style={{ fontSize: '0.78rem' }}>
              Selecciona quiénes pueden atender este servicio
            </span>
          </div>

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
                  <div className="barbero-selection-panel">
                    {/* Header: contador + acciones masivas */}
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                      <div className="d-flex align-items-center">
                        <span
                          className="barbero-selection-counter-badge"
                          aria-hidden="true"
                        >
                          {count}
                        </span>
                        <span
                          className="text-surface-muted small fw-semibold"
                          aria-live="polite"
                          aria-atomic="true"
                        >
                          de {total} barberos seleccionados
                        </span>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary barbero-action-btn py-1 px-2.5"
                          onClick={() =>
                            field.onChange(barberos.map((b) => Number(b.id)))
                          }
                          disabled={total === 0 || count === total}
                          aria-label="Seleccionar todos los barberos"
                        >
                          Seleccionar todos
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary barbero-action-btn py-1 px-2.5"
                          onClick={() => field.onChange([])}
                          disabled={count === 0}
                          aria-label="Quitar todos los barberos seleccionados"
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
                      ariaLabel="Buscar barbero por nombre"
                      className="mb-3"
                    />

                    {/* Grid de tarjetas o EmptyState */}
                    {barberosFiltrados.length === 0 ? (
                      <EmptyState
                        title="Sin coincidencias"
                        description={`No se encontraron barberos que coincidan con "${busquedaBarbero}".`}
                        actionLabel="Limpiar búsqueda"
                        onAction={() => setBusquedaBarbero('')}
                      />
                    ) : (
                      <>
                        <p id="barberos-help" className="visually-hidden">
                          Pulsa sobre cada tarjeta para añadir o quitar un barbero. Se puede buscar por nombre en el campo superior.
                        </p>
                        <div
                          className="barbero-grid"
                          role="group"
                          aria-label="Selección de barberos"
                          aria-describedby="barberos-help"
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
                                aria-label={`${seleccionado ? 'Quitar' : 'Añadir'} ${b.nombre} ${b.apellido}`}
                                title={`${seleccionado ? 'Quitar' : 'Añadir'} ${b.nombre} ${b.apellido}`}
                                className={`barbero-card ${
                                  seleccionado ? 'barbero-card--selected' : ''
                                }`}
                              >
                                <div className="barbero-card-main">
                                  <UserAvatar
                                    nombre={b.nombre}
                                    apellido={b.apellido}
                                    fotoUrl={b.fotoUrl}
                                    size={34}
                                  />
                                  <div className="barbero-card-info">
                                    <span className="barbero-card-name text-truncate">
                                      {b.nombre} {b.apellido}
                                    </span>
                                    <span className="barbero-card-role text-truncate">
                                      {seleccionado ? 'Asignado' : 'Barbero'}
                                    </span>
                                  </div>
                                </div>

                                <div
                                  className={`barbero-card-checkbox ${
                                    seleccionado ? 'barbero-card-checkbox--checked' : ''
                                  }`}
                                  aria-hidden="true"
                                >
                                  {seleccionado && <Check size={13} strokeWidth={3} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              }}
            />
          )}
        </div>

        {/* Footer de Acciones */}
        <div className="col-12 d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
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
