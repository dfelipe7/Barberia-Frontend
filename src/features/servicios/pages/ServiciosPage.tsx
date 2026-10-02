import React, { useState } from 'react';
import { CheckCircle2, EyeOff, Lock, Unlock } from 'lucide-react';
import CrudPage from '../../../shared/components/CrudPage';
import CatalogCard from '../../../shared/ui/Catalogcard';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { mapApiError } from '../../../shared/lib/mapApiError';
import { useToast } from '../../../shared/lib/useToast';
import { ToastContainer } from '../../../shared/ui/ToastContainer';
import {
  useServiciosGestion,
  useCrearServicio,
  useActualizarServicio,
  useCambiarEstadoServicio,
} from '../api/servicios.facade';
import { ServicioForm } from '../components/ServicioForm';
import { FotoServicioModal } from '../components/FotoServicioModal';
import type { Servicio } from '../types/servicios.types';
import type { ServicioFormValues } from '../schemas/servicio.schema';

export const ServiciosPage: React.FC = () => {
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'' | 'ACTIVO' | 'INACTIVO'>('');
  const [servicioAEditarFoto, setServicioAEditarFoto] = useState<Servicio | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [idServicioCambiando, setIdServicioCambiando] = useState<number | null>(null);
  const [idServicioAnimado, setIdServicioAnimado] = useState<number | null>(null);
  const { toast, showToast, hideToast } = useToast(4000);

  const { data: todosLosServicios = [], isLoading, error, refetch } = useServiciosGestion({
    ...(filtroNombre.trim() && { nombre: filtroNombre.trim() }),
  });

  const activos = todosLosServicios.filter((s) => s.estado === 'ACTIVO').length;
  const inactivos = todosLosServicios.filter((s) => s.estado === 'INACTIVO').length;

  const servicios = filtroEstado
    ? todosLosServicios.filter((s) => s.estado === filtroEstado)
    : todosLosServicios;

  const crearMutation = useCrearServicio();
  const actualizarMutation = useActualizarServicio();
  const cambiarEstadoMutation = useCambiarEstadoServicio();

  const handleGuardar = async (
    datos: ServicioFormValues,
    servicioEnEdicion: Servicio | null,
    cerrarModal: () => void
  ) => {
    try {
      setErrorForm(null);
      if (servicioEnEdicion) {
        await actualizarMutation.mutateAsync({ id: servicioEnEdicion.id, datos });
        showToast('success', 'Servicio actualizado correctamente.');
      } else {
        await crearMutation.mutateAsync(datos);
        showToast('success', 'Servicio creado correctamente.');
      }
      cerrarModal();
    } catch (err: unknown) {
      setErrorForm(mapApiError(err));
    }
  };

  const handleCambiarEstado = async (servicio: Servicio) => {
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

  return (
    <CrudPage<Servicio>
      title="Catálogo de Servicios"
      subtitle="Gestiona los cortes, tratamientos y tarifas disponibles para los clientes."
      createButtonText="+ Nuevo Servicio"
      canCreate={true}
      isLoading={isLoading}
      error={error ? mapApiError(error) : undefined}
      onRetry={refetch}
      modalTitle="Registrar Nuevo Servicio"
      editModalTitle="Editar Servicio"
      onModalClose={() => setErrorForm(null)}
      renderModalForm={({ onClose, record }) => (
        <ServicioForm
          servicioInicial={record ?? null}
          onSubmit={(datos) => handleGuardar(datos, record ?? null, onClose)}
          onCancel={onClose}
          isSubmitting={crearMutation.isPending || actualizarMutation.isPending}
          errorMensaje={errorForm}
        />
      )}
    >
      {({ onEdit }) => (
        <>
          <ToastContainer toast={toast} onClose={hideToast} />

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

          {/* ── 3. Barra de filtros con pills destacadas ── */}
          <div className="row g-2 mb-4 align-items-center">
            <div className="col-12 col-md-7">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre o descripción..."
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
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
                  className={`btn btn-sm px-3 py-1 fw-semibold rounded flex-fill flex-md-grow-0 ${
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
                  className={`btn btn-sm px-3 py-1 fw-semibold rounded d-inline-flex align-items-center justify-content-center gap-1 flex-fill flex-md-grow-0 ${
                    filtroEstado === 'ACTIVO'
                      ? 'btn-primary text-white shadow-sm'
                      : 'btn-link text-decoration-none text-surface-muted border-0'
                  }`}
                  style={{ transition: 'all 150ms ease' }}
                >
                  <CheckCircle2 size={13} />
                  <span>Activos</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filtroEstado === 'INACTIVO'}
                  onClick={() => setFiltroEstado('INACTIVO')}
                  className={`btn btn-sm px-3 py-1 fw-semibold rounded d-inline-flex align-items-center justify-content-center gap-1 flex-fill flex-md-grow-0 ${
                    filtroEstado === 'INACTIVO'
                      ? 'btn-primary text-white shadow-sm'
                      : 'btn-link text-decoration-none text-surface-muted border-0'
                  }`}
                  style={{ transition: 'all 150ms ease' }}
                >
                  <EyeOff size={13} />
                  <span>Inactivos</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid de servicios */}
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
            {servicios.length === 0 && (
              <div className="col-12">
                <div className="alert-surface text-center py-5 text-surface-muted border rounded">
                  <p className="mb-0 fs-6">No se encontraron servicios con el filtro seleccionado.</p>
                </div>
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
                    <div className="d-flex gap-1 w-100">
                      <button
                        type="button"
                        className="btn btn-sm btn-light flex-fill"
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
                        className="btn btn-sm btn-light flex-fill"
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
                        className={`btn btn-sm flex-fill d-inline-flex align-items-center justify-content-center gap-1 ${
                          s.estado === 'ACTIVO' ? 'btn-outline-danger' : 'btn-success'
                        }`}
                        style={{ borderRadius: '2px', transition: 'all 150ms ease' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCambiarEstado(s);
                        }}
                        disabled={cambiarEstadoMutation.isPending && idServicioCambiando === s.id}
                        aria-label={s.estado === 'ACTIVO' ? `Desactivar ${s.nombre}` : `Activar ${s.nombre}`}
                      >
                        {cambiarEstadoMutation.isPending && idServicioCambiando === s.id ? (
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            style={{ width: '13px', height: '13px' }}
                          />
                        ) : s.estado === 'ACTIVO' ? (
                          <>
                            <Lock size={13} />
                            <span>Desactivar</span>
                          </>
                        ) : (
                          <>
                            <Unlock size={13} />
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
