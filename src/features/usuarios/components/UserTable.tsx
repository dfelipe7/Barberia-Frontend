import React from 'react';
import { Link } from 'react-router-dom';
import Table, { type Column } from '../../../shared/ui/Table';
import Button from '../../../shared/ui/Button';
import type { AdministradorGestion } from '../types/usuarios.types';

interface UserTableProps {
  administradores: AdministradorGestion[];
  onSelectUsuario: (admin: AdministradorGestion) => void;
  onCambiarEstado: (id: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => void;
  onConfigurarBarbero: (admin: AdministradorGestion) => void;
  esSuperAdmin: boolean;
  currentUserId?: number;
  isUpdatingId?: number | null;
}

export const UserTable: React.FC<UserTableProps> = ({
  administradores,
  onSelectUsuario,
  onCambiarEstado,
  onConfigurarBarbero,
  esSuperAdmin,
  currentUserId,
  isUpdatingId,
}) => {
  const columns: Column<AdministradorGestion>[] = [
    {
      key: 'usuario',
      header: 'Administrador',
      render: (admin) => (
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex justify-content-center align-items-center fw-bold"
            style={{ width: '36px', height: '36px' }}
          >
            {admin.nombre.charAt(0)}
            {admin.apellido.charAt(0)}
          </div>
          <div>
            <span className="fw-semibold d-block">
              {admin.nombre} {admin.apellido}
            </span>
            <span className="text-muted small">{admin.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Perfiles Habilitados',
      render: (admin) => (
        <div className="d-flex flex-wrap gap-1">
          <span className="badge bg-warning text-dark">ADMINISTRADOR</span>
          {admin.esBarbero && (
            <span className="badge bg-info text-dark">BARBERO</span>
          )}
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (admin) => (
        <span
          className={`badge ${
            admin.estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'
          }`}
        >
          {admin.estado}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-end',
      render: (admin) => {
        const esMismoUsuario = currentUserId === admin.id;
        const puedeEditar = esSuperAdmin || esMismoUsuario;
        const isCurrentUpdating = isUpdatingId === admin.id;

        return (
          <div className="d-inline-flex align-items-center justify-content-end gap-1">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onSelectUsuario(admin)}
              title="Ver detalles"
            >
              Ficha
            </Button>

            {!admin.esBarbero && esSuperAdmin && (
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => onConfigurarBarbero(admin)}
                title="Convertir también en Barbero"
              >
                + Barbero
              </Button>
            )}

            {esSuperAdmin && !esMismoUsuario && (
              <Button
                variant={admin.estado === 'ACTIVO' ? 'outline-danger' : 'outline-success'}
                size="sm"
                isLoading={isCurrentUpdating}
                onClick={() =>
                  onCambiarEstado(
                    admin.id,
                    admin.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
                  )
                }
              >
                {admin.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
              </Button>
            )}

            {puedeEditar && (
              <Link
                to={`/usuarios/${admin.id}/editar`}
                className="btn btn-outline-primary btn-sm"
              >
                Editar
              </Link>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      data={administradores}
      keyExtractor={(item) => item.id}
      emptyMessage="No hay administradores registrados en el sistema."
    />
  );
};

export default UserTable;
