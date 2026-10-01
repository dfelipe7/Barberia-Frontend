import React from 'react';
import CrudPage from '../../../shared/components/CrudPage';
import CatalogCard from '../../../shared/ui/Catalogcard';
import { obtenerUrlFoto } from '../../../shared/lib/obtenerUrlFoto';
import { useServicios } from '../api/servicios.facade';
import type { Servicio } from '../types/servicios.types';

export const ServiciosPage: React.FC = () => {
  const { data: servicios = [], isLoading, error, refetch } = useServicios();

  return (
    <CrudPage<Servicio>
      title="Catálogo de Servicios"
      subtitle="Gestiona los cortes, tratamientos y tarifas disponibles para los clientes."
      createButtonText="+ Nuevo Servicio"
      canCreate={true}
      isLoading={isLoading}
      error={error?.message}
      onRetry={refetch}
      modalTitle="Registrar Nuevo Servicio"
      editModalTitle="Editar Servicio"
      renderModalForm={({ onClose }) => (
        <div className="text-center py-4">
          <p className="text-muted">
            Formulario de creación de servicio (Sprint 2 - HE-02).
          </p>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      )}
    >
      {({ onEdit }) => (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
          {servicios.length === 0 && (
            <p className="text-muted">No hay servicios registrados.</p>
          )}
          {servicios.map((s) => (
            <div className="col" key={s.id}>
              <CatalogCard
                imageUrl={obtenerUrlFoto(s.fotoUrl) || undefined}
                title={s.nombre}
                subtitle={`${s.duracionMinutos} min · ${s.categoria || 'General'}`}
                isActive={s.activo}
                badges={[
                  { label: s.activo ? 'Activo' : 'Inactivo', tone: 'dark' },
                  { label: s.categoria || 'General' },
                ]}
                priceLabel={`$${s.precio.toLocaleString()}`}
                actions={
                  <button
                    className="btn btn-sm btn-light w-100"
                    style={{ borderRadius: '2px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(s);
                    }}
                  >
                    Editar
                  </button>
                }
              />
            </div>
          ))}
        </div>
      )}
    </CrudPage>
  );
};

export default ServiciosPage;
