import React from 'react';
import CrudPage from '../../../shared/components/CrudPage';
import Table, { type Column } from '../../../shared/ui/Table';
import { useServicios } from '../api/servicios.facade';
import type { Servicio } from '../types/servicios.types';

export const ServiciosPage: React.FC = () => {
  const { data: servicios = [], isLoading, error, refetch } = useServicios();

  const columns: Column<Servicio>[] = [
    {
      key: 'nombre',
      header: 'Servicio',
      render: (s) => (
        <div>
          <span className="fw-semibold d-block">{s.nombre}</span>
          <span className="text-muted small">{s.descripcion}</span>
        </div>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoría',
      render: (s) => (
        <span className="badge bg-light text-dark border">
          {s.categoria || 'General'}
        </span>
      ),
    },
    {
      key: 'duracion',
      header: 'Duración',
      render: (s) => <span>{s.duracionMinutos} min</span>,
    },
    {
      key: 'precio',
      header: 'Precio',
      render: (s) => (
        <span className="fw-bold text-success">
          ${s.precio.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (s) => (
        <span className={`badge ${s.activo ? 'bg-success' : 'bg-secondary'}`}>
          {s.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

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
      <Table
        columns={columns}
        data={servicios}
        keyExtractor={(s) => s.id}
        emptyMessage="No hay servicios registrados."
      />
    </CrudPage>
  );
};

export default ServiciosPage;
