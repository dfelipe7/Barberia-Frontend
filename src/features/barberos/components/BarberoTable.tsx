import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Unlock, UserMinus, UserCheck } from 'lucide-react';
import Table, { type Column } from '../../../shared/ui/Table';
import Button from '../../../shared/ui/Button';
import type { BarberoGestion } from '../types/barberos.types';
import { puedeGestionarEstado } from '../../../shared/lib/autorizacion/jerarquiaRoles';
import type { Rol } from '../../../shared/lib/autorizacion/roles';

interface BarberoTableProps {
  barberos: BarberoGestion[];
  onSelectBarbero: (barbero: BarberoGestion) => void;
  onEditarComision: (barbero: BarberoGestion) => void;
  onEditarFoto: (barbero: BarberoGestion) => void; 
  onCambiarEstado: (id: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => void;
  onCambiarEstadoGlobal: (id: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => void;
  rolActorPrincipal: Rol; 
  currentUserId?: number;
  isUpdatingId?: number | null;
  isUpdatingGlobalId?: number | null;
}

export const BarberoTable: React.FC<BarberoTableProps> = ({
  barberos,
  onSelectBarbero,
  onEditarComision,
  onEditarFoto,
  onCambiarEstado,
  onCambiarEstadoGlobal,
  rolActorPrincipal,
  currentUserId,
  isUpdatingId,
  isUpdatingGlobalId,
}) => {
  const columns: Column<BarberoGestion>[] = [
    {
      key: 'barbero',
      header: 'Barbero',
      render: (barbero) => (
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle bg-info bg-opacity-10 text-dark d-inline-flex justify-content-center align-items-center fw-bold"
            style={{ width: '36px', height: '36px' }}
          >
            {barbero.nombre.charAt(0)}
            {barbero.apellido.charAt(0)}
          </div>
          <div>
            <span className="fw-semibold d-block">
              {barbero.nombre} {barbero.apellido}
            </span>
            <span className="text-muted small">{barbero.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      render: (barbero) => (
        <span className="text-muted">{barbero.telefono || 'Sin teléfono'}</span>
      ),
    },
    {
      key: 'comision',
      header: 'Comisión',
      render: (barbero) => (
        <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2 py-1 fs-6">
          {barbero.porcentajeComision}%
        </span>
      ),
    },
    {
      key: 'roles',
      header: 'Perfil',
      render: (barbero) => (
        <div className="d-flex flex-wrap gap-1">
          <span className="badge bg-info text-dark">BARBERO</span>
          {barbero.esAdministrador && (
            <span className="badge bg-warning text-dark">ADMIN</span>
          )}
        </div>
      ),
    },
    {
      key: 'estadoGlobal',
      header: 'Estado Global',
      render: (barbero) => (
        <span
          className={`badge ${
            barbero.estadoGlobal === 'ACTIVO' ? 'bg-success' : 'bg-danger'
          }`}
        >
          {barbero.estadoGlobal === 'ACTIVO' ? 'Habilitada' : 'Bloqueada'}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Rol Barbero',
      render: (barbero) => (
        <span
          className={`badge ${
            barbero.estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'
          }`}
        >
          {barbero.estado}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-end',
      render: (barbero) => {
        const esMismoUsuario = currentUserId === barbero.id;
        const isCurrentUpdating = isUpdatingId === barbero.id;
        const isCurrentUpdatingGlobal = isUpdatingGlobalId === barbero.id;
        const puedeEditar = puedeGestionarEstado(rolActorPrincipal, 'BARBERO');
        return (
          <div className="d-inline-flex align-items-center justify-content-end gap-1">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onSelectBarbero(barbero)}
              title="Ver ficha"
            >
              Ficha
            </Button>

            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => onEditarComision(barbero)}
              title="Cambiar % de comisión"
            >
              % Comisión
            </Button>
            {puedeEditar && (
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => onEditarFoto(barbero)}
                title="Cambiar foto"
              >
                Foto
              </Button>
            )}
            {puedeEditar && (
              <Button
                variant={barbero.estado === 'ACTIVO' ? 'outline-warning' : 'outline-success'}
                size="sm"
                isLoading={isCurrentUpdating}
                onClick={() =>
                  onCambiarEstado(
                    barbero.id,
                    barbero.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
                  )
                }
                title={
                  barbero.estado === 'ACTIVO'
                    ? 'Inactivar rol barbero'
                    : 'Activar rol barbero'
                }
              >
                {barbero.estado === 'ACTIVO' ? (
                  <>
                    <UserMinus size={16} className="me-1" />
                    Inactivar Rol
                  </>
                ) : (
                  <>
                    <UserCheck size={16} className="me-1" />
                    Activar Rol
                  </>
                )}
              </Button>
            )}

            {puedeEditar && (
              <Button
                variant={barbero.estadoGlobal === 'ACTIVO' ? 'outline-danger' : 'outline-success'}
                size="sm"
                disabled={esMismoUsuario}
                isLoading={isCurrentUpdatingGlobal}
                onClick={() =>
                  onCambiarEstadoGlobal(
                    barbero.id,
                    barbero.estadoGlobal === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
                  )
                }
                title={
                  esMismoUsuario
                    ? 'No puedes bloquear tu propia cuenta'
                    : barbero.estadoGlobal === 'ACTIVO'
                    ? 'Bloquear cuenta global'
                    : 'Desbloquear cuenta global'
                }
              >
                {barbero.estadoGlobal === 'ACTIVO' ? <Lock size={16} /> : <Unlock size={16} />}
              </Button>
            )}

            {puedeEditar && (
              <Link
                to={`/usuarios/${barbero.id}/editar`}
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
      data={barberos}
      keyExtractor={(item) => item.id}
      emptyMessage="No hay barberos registrados en la gestión."
    />
  );
};

export default BarberoTable;
