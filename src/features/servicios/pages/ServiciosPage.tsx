import React, { useState, useEffect } from 'react';
import CrudPage from '../../../shared/components/CrudPage';
import CatalogCard from '../../../shared/ui/Catalogcard';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { mapApiError } from '../../../shared/lib/mapApiError';
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
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const { data: servicios = [], isLoading, error, refetch } = useServiciosGestion({
    ...(filtroNombre.trim() && { nombre: filtroNombre.trim() }),
    ...(filtroEstado && { estado: filtroEstado }),
  });

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
        setMensajeExito('Servicio actualizado correctamente.');
      } else {
        await crearMutation.mutateAsync(datos);
        setMensajeExito('Servicio creado correctamente.');
      }
      cerrarModal();
    } catch (err: unknown) {
      setErrorForm(mapApiError(err));
    }
  };

  const handleCambiarEstado = async (servicio: Servicio) => {
    try {
      setErrorAccion(null);
      await cambiarEstadoMutation.mutateAsync({
        id: servicio.id,
        datos: { estado: servicio.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' },
      });
    } catch (err: unknown) {
      setErrorAccion(mapApiError(err));
    }
  };

  useEffect(() => {
    if (!mensajeExito) return;
    const t = setTimeout(() => setMensajeExito(null), 4000);
    return () => clearTimeout(t);
  }, [mensajeExito]);

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
          {mensajeExito && (
            <div className="alert alert-success alert-dismissible" role="alert">
              {mensajeExito}
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                onClick={() => setMensajeExito(null)}
              />
            </div>
          )}

          {errorAccion && <ErrorMessage message={errorAccion} />}

          {/* Barra de filtros */}
          <div className="row g-2 mb-3">
            <div className="col-12 col-sm-7">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre o descripción..."
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div className="col-12 col-sm-5">
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as '' | 'ACTIVO' | 'INACTIVO')}
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>
            </div>
          </div>

          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
            {servicios.length === 0 && (
              <p className="text-muted">No hay servicios registrados.</p>
            )}
            {servicios.map((s) => (
              <div className="col" key={s.id}>
                <CatalogCard
                  imageUrl={obtenerUrlFoto(s.fotoUrl) || undefined}
                  title={s.nombre}
                  subtitle={`${s.duracionMinutos} min`}
                  isActive={s.estado === 'ACTIVO'}
                  badges={[
                    { label: s.estado === 'ACTIVO' ? 'Activo' : 'Inactivo', tone: 'dark' },
                  ]}
                  priceLabel={`$${s.precio.toLocaleString()}`}
                  actions={
                    <div className="d-flex gap-1 w-100">
                      <button
                        className="btn btn-sm btn-light flex-fill"
                        style={{ borderRadius: '2px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(s);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-light flex-fill"
                        style={{ borderRadius: '2px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setServicioAEditarFoto(s);
                        }}
                      >
                        Foto
                      </button>
                      <button
                        className={`btn btn-sm flex-fill ${
                          s.estado === 'ACTIVO' ? 'btn-outline-danger' : 'btn-outline-success'
                        }`}
                        style={{ borderRadius: '2px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCambiarEstado(s);
                        }}
                        disabled={cambiarEstadoMutation.isPending}
                      >
                        {s.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
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
            onSuccess={(msg) => { setServicioAEditarFoto(null); setMensajeExito(msg); }}
          />
        </>
      )}
    </CrudPage>
  );
};

export default ServiciosPage;
