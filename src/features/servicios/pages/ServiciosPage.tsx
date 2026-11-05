import React, { useState, useMemo } from 'react';
import { CheckCircle2, EyeOff, Lock, Unlock } from 'lucide-react';
import CrudPage from '../../../shared/components/CrudPage';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import CatalogCard from '../../../shared/ui/Catalogcard';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import SearchInput from '../../../shared/ui/molecules/SearchInput';
import EmptyState from '../../../shared/ui/molecules/EmptyState';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { mapApiError } from '../../../shared/lib/mapApiError';
import { useToastContext } from '../../../shared/ui/ToastContext';
import { useDebounce } from '../../../shared/lib/useDebounce';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';
import {
  useServiciosGestion,
  useCrearServicio,
  useActualizarServicio,
  useCambiarEstadoServicio,
  useSubirFotoServicio,
  useEliminarFotoServicio,
} from '../api/servicios.facade';
import { ServicioForm } from '../components/ServicioForm';
import { FotoServicioModal } from '../components/FotoServicioModal';
import type { Servicio } from '../types/servicios.types';
import type { ServicioFormValues } from '../schemas/servicio.schema';

export const ServiciosPage: React.FC = () => {
  // Estado local e inmediato para el campo de búsqueda (evita lag en input)
  const [filtroNombre, setFiltroNombre] = useState('');
  // Valor debounced para la petición HTTP (350ms delay)
  const debouncedNombre = useDebounce(filtroNombre, 350);

  // Filtro discreto de estado (inmediato, sin debounce)
  const [filtroEstado, setFiltroEstado] = useState<'' | 'ACTIVO' | 'INACTIVO'>('');

  const [servicioAEditarFoto, setServicioAEditarFoto] = useState<Servicio | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [idServicioCambiando, setIdServicioCambiando] = useState<number | null>(null);
  const [idServicioAnimado, setIdServicioAnimado] = useState<number | null>(null);
  const { showToast } = useToastContext();
  const confirm = useConfirm();

  // Memorizar objeto de filtro para queryKey estable
  const filtroGestion = useMemo(() => ({
    ...(debouncedNombre.trim() ? { nombre: debouncedNombre.trim() } : {}),
    ...(filtroEstado ? { estado: filtroEstado } : {}),
  }), [debouncedNombre, filtroEstado]);

  const {
    data: servicios = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useServiciosGestion(Object.keys(filtroGestion).length > 0 ? filtroGestion : undefined);

  // Guardar conteos de activos/inactivos para mantener el resumen aun al filtrar
  const [conteos, setConteos] = useState<{ activos: number; inactivos: number }>({ activos: 0, inactivos: 0 });

  if (!filtroEstado && servicios.length > 0) {
    const nuevosActivos = servicios.filter((s) => s.estado === 'ACTIVO').length;
    const nuevosInactivos = servicios.filter((s) => s.estado === 'INACTIVO').length;
    if (conteos.activos !== nuevosActivos || conteos.inactivos !== nuevosInactivos) {
      setConteos({ activos: nuevosActivos, inactivos: nuevosInactivos });
    }
  }

  const activos = conteos.activos || servicios.filter((s) => s.estado === 'ACTIVO').length;
  const inactivos = conteos.inactivos || servicios.filter((s) => s.estado === 'INACTIVO').length;

  // Indicador de búsqueda en curso (mientras el debounce espera o la query hace fetch)
  const estaBuscando = isFetching || filtroNombre !== debouncedNombre;

  const crearMutation = useCrearServicio();
  const actualizarMutation = useActualizarServicio();
  const cambiarEstadoMutation = useCambiarEstadoServicio();
  const subirFotoMutation = useSubirFotoServicio();
  const eliminarFotoMutation = useEliminarFotoServicio();

  const handleGuardar = async (
    datos: ServicioFormValues,
    servicioEnEdicion: Servicio | null,
    cerrarModal: () => void
  ) => {
    try {
      setErrorForm(null);

      // ── Paso 1: Crear o actualizar el servicio ──
      const { foto, eliminarFoto, ...datosSinArchivos } = datos;

      let servicioGuardado: { id: number } | undefined;
      if (servicioEnEdicion) {
        servicioGuardado = await actualizarMutation.mutateAsync({
          id: servicioEnEdicion.id,
          datos: datosSinArchivos,
        });
      } else {
        servicioGuardado = await crearMutation.mutateAsync(datosSinArchivos);
      }

      const servicioId = servicioGuardado?.id ?? servicioEnEdicion?.id;
      if (!servicioId) {
        throw new Error('No se pudo obtener el ID del servicio');
      }

      // ── Paso 2: Subir imagen si hay una nueva ──
      if (foto instanceof File) {
        await subirFotoMutation.mutateAsync({
          id: servicioId,
          file: foto,
        });
      }

      // ── Paso 3: Eliminar imagen si el usuario la quitó ──
      if (eliminarFoto === true && servicioEnEdicion?.fotoUrl) {
        await eliminarFotoMutation.mutateAsync(servicioId);
      }

      // ── Paso 4: Feedback y cerrar ──
      showToast(
        'success',
        servicioEnEdicion
          ? 'Servicio actualizado correctamente.'
          : 'Servicio creado correctamente.'
      );
      cerrarModal();
    } catch (err: unknown) {
      const mensaje = mapApiError(err);
      setErrorForm(mensaje);
      showToast('danger', mensaje);
    }
  };

  const handleCambiarEstado = async (servicio: Servicio) => {
    const desactivando = servicio.estado === 'ACTIVO';
    const ok = await confirm({
      title: desactivando ? '¿Desactivar servicio?' : '¿Activar servicio?',
      message: desactivando
        ? `¿Desactivar el servicio "${servicio.nombre}"? No aparecerá en el catálogo para los clientes.`
        : `¿Activar el servicio "${servicio.nombre}" para que esté disponible en el catálogo?`,
      variant: desactivando ? 'warning' : 'primary',
      confirmLabel: desactivando ? 'Desactivar' : 'Activar',
    });
    if (!ok) return;

    try {
      setErrorAccion(null);
      setIdServicioCambiando(servicio.id);
      const nuevoEstado = servicio.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
      await cambiarEstadoMutation.mutateAsync({
        id: servicio.id,
        datos: { estado: nuevoEstado },
      });
      showToast(
        'success',
        `Servicio "${servicio.nombre}" ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'} correctamente.`
      );
      setIdServicioAnimado(servicio.id);
      setTimeout(() => {
        setIdServicioAnimado(null);
      }, 350);
    } catch (err: unknown) {
      setErrorAccion(mapApiError(err));
    } finally {
      setIdServicioCambiando(null);
    }
  };

  const handleLimpiarFiltros = () => {
    setFiltroNombre('');
    setFiltroEstado('');
  };

  return (
    <CrudPage<Servicio>
      title="Catálogo de Servicios"
      subtitle="Gestiona los cortes, tratamientos y tarifas disponibles para los clientes."
      createButtonText="+ Nuevo Servicio"
      canCreate={true}
      isLoading={isLoading && servicios.length === 0}
      error={error ? mapApiError(error) : undefined}
      onRetry={refetch}
      modalTitle="Registrar Nuevo Servicio"
      editModalTitle="Editar Servicio"
      onModalClose={() => setErrorForm(null)}
      renderModalForm={({ onClose, onDirectClose, record, setFormDirty }) => {
        const isGuardandoServicio =
          crearMutation.isPending ||
          actualizarMutation.isPending ||
          subirFotoMutation.isPending ||
          eliminarFotoMutation.isPending;

        return (
          <ServicioForm
            servicioInicial={record ?? null}
            onSubmit={(datos) => handleGuardar(datos, record ?? null, onDirectClose || onClose)}
            onCancel={onClose}
            isSubmitting={isGuardandoServicio}
            loadingText={subirFotoMutation.isPending ? 'Subiendo imagen...' : 'Guardando...'}
            errorMensaje={errorForm}
            onDirtyChange={setFormDirty}
          />
        );
      }}
    >
      {({ onEdit }) => (
        <>
          {errorAccion && <ErrorMessage message={errorAccion} />}

          {/* ── 2. Encabezado con resumen de estados ── */}
          <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
            <span className="badge bg-success bg-opacity-10 text-success fw-semibold px-3 py-2 d-inline-flex align-items-center">
              <CheckCircle2 size={14} className="me-1" />
              {activos} activos
            </span>
            <span className="badge bg-secondary bg-opacity-10 text-secondary fw-semibold px-3 py-2 d-inline-flex align-items-center">
              <EyeOff size={14} className="me-1" />
              {inactivos} inactivos
            </span>
          </div>

          {/* ── 3. Barra de filtros con búsqueda debounced y pills destacadas ── */}
          <div className="row g-2 mb-4 align-items-center">
            <div className="col-12 col-md-7">
              <SearchInput
                placeholder="Buscar servicios..."
                value={filtroNombre}
                onChange={setFiltroNombre}
                isSearching={estaBuscando}
                ariaLabel="Buscar servicios"
              />
            </div>

            <div className="col-12 col-md-5 d-flex align-items-center justify-content-md-end">
              <div
                className="d-inline-flex p-1 rounded border bg-surface-card gap-1 w-100 w-md-auto justify-content-between justify-content-md-start"
                role="tablist"
                aria-label="Filtrar por estado del servicio"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={filtroEstado === ''}
                  onClick={() => setFiltroEstado('')}
                  className={`btn btn-sm px-2 px-sm-3 py-1 fw-semibold rounded flex-fill flex-md-grow-0 text-center justify-content-center ${
                    filtroEstado === ''
                      ? 'btn-primary text-white shadow-sm'
                      : 'btn-link text-decoration-none text-surface-muted border-0'
                  }`}
                  style={{ transition: 'all 150ms ease' }}
                >
                  Todos
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filtroEstado === 'ACTIVO'}
                  onClick={() => setFiltroEstado('ACTIVO')}
                  className={`btn btn-sm px-2 px-sm-3 py-1 fw-semibold rounded d-inline-flex align-items-center justify-content-center gap-1 flex-fill flex-md-grow-0 text-center ${
                    filtroEstado === 'ACTIVO'
                      ? 'btn-primary text-white shadow-sm'
                      : 'btn-link text-decoration-none text-surface-muted border-0'
                  }`}
                  style={{ transition: 'all 150ms ease' }}
                >
                  <CheckCircle2 size={13} className="d-none d-sm-inline flex-shrink-0" />
                  <span>Activos</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filtroEstado === 'INACTIVO'}
                  onClick={() => setFiltroEstado('INACTIVO')}
                  className={`btn btn-sm px-2 px-sm-3 py-1 fw-semibold rounded d-inline-flex align-items-center justify-content-center gap-1 flex-fill flex-md-grow-0 text-center ${
                    filtroEstado === 'INACTIVO'
                      ? 'btn-primary text-white shadow-sm'
                      : 'btn-link text-decoration-none text-surface-muted border-0'
                  }`}
                  style={{ transition: 'all 150ms ease' }}
                >
                  <EyeOff size={13} className="d-none d-sm-inline flex-shrink-0" />
                  <span>Inactivos</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid de servicios con placeholderData (mantiene lista previa sin parpadeo) */}
          <div
            className={`row row-cols-2 row-cols-md-3 row-cols-xl-4 g-2 g-sm-3 g-md-4 catalog-grid-2col search-results-fade ${
              isFetching && servicios.length > 0 ? 'opacity-75' : ''
            }`}
            style={{ transition: 'opacity 150ms ease' }}
          >
            {servicios.length === 0 && !isLoading && (
              <div className="col-12">
                <EmptyState
                  title={
                    filtroNombre || filtroEstado
                      ? 'No encontramos servicios con ese criterio de búsqueda.'
                      : 'No hay servicios registrados en este momento.'
                  }
                  description={
                    filtroNombre || filtroEstado
                      ? 'Intenta con otro término o restablece los filtros.'
                      : 'Comienza creando un nuevo servicio para tu catálogo.'
                  }
                  actionLabel={filtroNombre || filtroEstado ? 'Limpiar búsqueda' : undefined}
                  onAction={filtroNombre || filtroEstado ? handleLimpiarFiltros : undefined}
                />
              </div>
            )}

            {servicios.map((s) => (
              <div className="col" key={s.id}>
                <CatalogCard
                  imageUrl={obtenerUrlFoto(s.fotoUrl) || undefined}
                  title={s.nombre}
                  subtitle={`${s.duracionMinutos} min`}
                  isActive={s.estado === 'ACTIVO'}
                  isStateChanging={idServicioAnimado === s.id}
                  priceLabel={`$${s.precio.toLocaleString()}`}
                  actions={
                    <div className="d-flex gap-1 w-100 catalog-action-buttons">
                      <button
                        type="button"
                        className="btn btn-sm btn-light flex-fill px-1 py-1 catalog-btn-action"
                        style={{ borderRadius: '2px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(s);
                        }}
                        aria-label={`Editar servicio ${s.nombre}`}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-light flex-fill px-1 py-1 catalog-btn-action"
                        style={{ borderRadius: '2px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setServicioAEditarFoto(s);
                        }}
                        aria-label={`Cambiar foto de ${s.nombre}`}
                      >
                        Foto
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm flex-fill px-1 py-1 d-inline-flex align-items-center justify-content-center gap-1 catalog-btn-action ${
                          s.estado === 'ACTIVO' ? 'btn-outline-danger' : 'btn-success'
                        }`}
                        style={{ borderRadius: '2px', transition: 'all 150ms ease' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleCambiarEstado(s);
                        }}
                        disabled={cambiarEstadoMutation.isPending && idServicioCambiando === s.id}
                        aria-label={s.estado === 'ACTIVO' ? `Desactivar ${s.nombre}` : `Activar ${s.nombre}`}
                      >
                        {cambiarEstadoMutation.isPending && idServicioCambiando === s.id ? (
                          <KyriosSpinner size="xs" aria-hidden="true" />
                        ) : s.estado === 'ACTIVO' ? (
                          <>
                            <Lock size={12} className="flex-shrink-0" />
                            <span className="d-none d-sm-inline">Desactivar</span>
                            <span className="d-inline d-sm-none">Desact.</span>
                          </>
                        ) : (
                          <>
                            <Unlock size={12} className="flex-shrink-0" />
                            <span>Activar</span>
                          </>
                        )}
                      </button>
                    </div>
                  }
                />
              </div>
            ))}
          </div>

          <FotoServicioModal
            servicio={servicioAEditarFoto}
            onClose={() => setServicioAEditarFoto(null)}
            onSuccess={(msg) => {
              setServicioAEditarFoto(null);
              showToast('success', msg);
            }}
          />
        </>
      )}
    </CrudPage>
  );
};

export default ServiciosPage;
