import React, { useState, useMemo } from 'react';
import { CheckCircle2, EyeOff, Lock, Unlock } from 'lucide-react';
import CrudPage from '../../../shared/components/CrudPage';
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
  useProductosGestion,
  useCrearProducto,
  useActualizarProducto,
  useCambiarEstadoProducto,
} from '../api/productos.facade';
import { ProductoForm } from '../components/ProductoForm';
import type { Producto } from '../types/productos.types';
import type { ProductoFormValues } from '../schemas/producto.schema';

export const ProductosPage: React.FC = () => {
  const [filtroNombre, setFiltroNombre] = useState('');
  const debouncedNombre = useDebounce(filtroNombre, 350);
  const [filtroEstado, setFiltroEstado] = useState<'' | 'ACTIVO' | 'INACTIVO'>('');

  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [idProductoCambiando, setIdProductoCambiando] = useState<number | null>(null);
  const [idProductoAnimado, setIdProductoAnimado] = useState<number | null>(null);

  const { showToast } = useToastContext();
  const confirm = useConfirm();

  const filtroGestion = useMemo(
    () => ({
      ...(debouncedNombre.trim() ? { nombre: debouncedNombre.trim() } : {}),
      ...(filtroEstado ? { estado: filtroEstado } : {}),
    }),
    [debouncedNombre, filtroEstado]
  );

  const {
    data: productos = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useProductosGestion(Object.keys(filtroGestion).length > 0 ? filtroGestion : undefined);

  // Conteo para los botones de estado
  const [conteos, setConteos] = useState<{ activos: number; inactivos: number }>({
    activos: 0,
    inactivos: 0,
  });

  if (!filtroEstado && productos.length > 0) {
    const nuevosActivos = productos.filter((p) => p.estado === 'ACTIVO').length;
    const nuevosInactivos = productos.filter((p) => p.estado === 'INACTIVO').length;
    if (conteos.activos !== nuevosActivos || conteos.inactivos !== nuevosInactivos) {
      setConteos({ activos: nuevosActivos, inactivos: nuevosInactivos });
    }
  }

  const activos = conteos.activos || productos.filter((p) => p.estado === 'ACTIVO').length;
  const inactivos = conteos.inactivos || productos.filter((p) => p.estado === 'INACTIVO').length;

  const crearMutation = useCrearProducto();
  const actualizarMutation = useActualizarProducto();
  const cambiarEstadoMutation = useCambiarEstadoProducto();

  const handleGuardar = async (
    datos: ProductoFormValues,
    productoEnEdicion: Producto | null,
    cerrarModal: () => void
  ) => {
    try {
      setErrorForm(null);

      if (productoEnEdicion) {
        await actualizarMutation.mutateAsync({
          id: productoEnEdicion.id,
          datos: {
            nombre: datos.nombre,
            precio: datos.precio,
            descripcion: datos.descripcion,
            imagen: datos.imagen,
          },
        });
        showToast('success', `Producto "${datos.nombre}" actualizado correctamente.`);
      } else {
        await crearMutation.mutateAsync({
          nombre: datos.nombre,
          precio: datos.precio,
          descripcion: datos.descripcion,
          imagen: datos.imagen,
        });
        showToast('success', `Producto "${datos.nombre}" registrado correctamente.`);
      }

      cerrarModal();
    } catch (err: unknown) {
      setErrorForm(mapApiError(err));
    }
  };

  const handleToggleEstado = async (producto: Producto) => {
    const desactivando = producto.estado === 'ACTIVO';
    const ok = await confirm({
      title: desactivando ? '¿Desactivar producto?' : '¿Activar producto?',
      message: desactivando
        ? `¿Desactivar "${producto.nombre}"? No aparecerá disponible en el catálogo de clientes.`
        : `¿Activar "${producto.nombre}" para que esté visible en el catálogo de clientes?`,
      variant: desactivando ? 'warning' : 'primary',
      confirmLabel: desactivando ? 'Desactivar' : 'Activar',
    });
    if (!ok) return;

    try {
      setErrorAccion(null);
      setIdProductoCambiando(producto.id);
      const nuevoEstado = desactivando ? 'INACTIVO' : 'ACTIVO';

      await cambiarEstadoMutation.mutateAsync({
        id: producto.id,
        estado: nuevoEstado,
      });

      showToast(
        'success',
        `Producto "${producto.nombre}" ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'} correctamente.`
      );
      setIdProductoAnimado(producto.id);
      setTimeout(() => {
        setIdProductoAnimado(null);
      }, 350);
    } catch (err: unknown) {
      setErrorAccion(mapApiError(err));
    } finally {
      setIdProductoCambiando(null);
    }
  };

  const handleLimpiarFiltros = () => {
    setFiltroNombre('');
    setFiltroEstado('');
  };

  return (
    <CrudPage<Producto>
      eyebrow="Catálogo Comercial"
      title="Gestión de Productos"
      subtitle="Administra el inventario de artículos y productos disponibles para la venta en tu barbería."
      createButtonText="+ Nuevo Producto"
      canCreate={true}
      isLoading={isLoading && productos.length === 0}
      error={error ? mapApiError(error) : undefined}
      onRetry={refetch}
      modalTitle="Registrar Nuevo Producto"
      editModalTitle="Editar Producto"
      onModalClose={() => setErrorForm(null)}
      renderModalForm={({ onClose, onDirectClose, record, setFormDirty }) => {
        const isGuardando = crearMutation.isPending || actualizarMutation.isPending;

        return (
          <ProductoForm
            productoInicial={record ?? null}
            onSubmit={(datos) =>
              handleGuardar(datos, record ?? null, onDirectClose || onClose)
            }
            onCancel={onClose}
            isSubmitting={isGuardando}
            loadingText={record ? 'Actualizando producto...' : 'Guardando producto...'}
            errorMensaje={errorForm}
            onDirtyChange={setFormDirty}
          />
        );
      }}
    >
      {({ onEdit }) => (
        <div className="d-flex flex-column gap-3">
          {errorAccion && (
            <div className="mb-2">
              <ErrorMessage message={errorAccion} />
            </div>
          )}

          {/* Barra de Filtros */}
          <div className="card shadow-sm border p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-6 col-lg-7">
                <SearchInput
                  value={filtroNombre}
                  onChange={setFiltroNombre}
                  placeholder="Buscar producto por nombre o descripción..."
                  ariaLabel="Buscar productos"
                />
              </div>
              <div className="col-12 col-md-6 col-lg-5 d-flex gap-2 justify-content-md-end">
                <button
                  type="button"
                  className={`btn btn-sm ${
                    filtroEstado === '' ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setFiltroEstado('')}
                >
                  Todos ({activos + inactivos})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                    filtroEstado === 'ACTIVO' ? 'btn-success text-white' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setFiltroEstado('ACTIVO')}
                >
                  <CheckCircle2 size={14} />
                  Activos ({activos})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                    filtroEstado === 'INACTIVO' ? 'btn-secondary text-white' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setFiltroEstado('INACTIVO')}
                >
                  <EyeOff size={14} />
                  Inactivos ({inactivos})
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Productos */}
          <div
            className={`row row-cols-2 row-cols-md-3 row-cols-xl-4 g-2 g-sm-3 g-md-4 ${
              isFetching && productos.length > 0 ? 'opacity-75' : ''
            }`}
          >
            {productos.length === 0 && !isLoading && (
              <div className="col-12">
                <EmptyState
                  title={
                    filtroNombre || filtroEstado
                      ? 'No encontramos productos con ese filtro.'
                      : 'No hay productos registrados aún.'
                  }
                  description={
                    filtroNombre || filtroEstado
                      ? 'Intenta con otro término o limpia los filtros de búsqueda.'
                      : 'Comienza agregando los productos que vendes en tu barbería (ceras, aceites, lociones, etc.).'
                  }
                  actionLabel={
                    filtroNombre || filtroEstado ? 'Limpiar búsqueda' : undefined
                  }
                  onAction={
                    filtroNombre || filtroEstado ? handleLimpiarFiltros : undefined
                  }
                />
              </div>
            )}

            {productos.map((producto) => (
              <div className="col" key={producto.id}>
                <CatalogCard
                  imageUrl={obtenerUrlFoto(producto.imagenUrl) || undefined}
                  title={producto.nombre}
                  subtitle={producto.descripcion || undefined}
                  isActive={producto.estado === 'ACTIVO'}
                  isStateChanging={idProductoAnimado === producto.id}
                  priceLabel={`$${Number(producto.precio).toLocaleString('es-CO')}`}
                  actions={
                    <div className="d-flex gap-1 w-100 catalog-action-buttons">
                      <button
                        type="button"
                        className="btn btn-sm btn-light flex-fill px-1 py-1"
                        style={{ borderRadius: '4px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(producto);
                        }}
                        aria-label={`Editar producto ${producto.nombre}`}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm flex-fill px-1 py-1 d-inline-flex align-items-center justify-content-center gap-1 ${
                          producto.estado === 'ACTIVO'
                            ? 'btn-outline-warning text-warning-emphasis'
                            : 'btn-outline-success text-success-emphasis'
                        }`}
                        style={{ borderRadius: '4px' }}
                        disabled={idProductoCambiando === producto.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleToggleEstado(producto);
                        }}
                        aria-label={
                          producto.estado === 'ACTIVO'
                            ? `Desactivar ${producto.nombre}`
                            : `Activar ${producto.nombre}`
                        }
                      >
                        {producto.estado === 'ACTIVO' ? (
                          <>
                            <Lock size={12} />
                            <span>Pausar</span>
                          </>
                        ) : (
                          <>
                            <Unlock size={12} />
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
        </div>
      )}
    </CrudPage>
  );
};

export default ProductosPage;

