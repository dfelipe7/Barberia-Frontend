import React from 'react';
import { Link } from 'react-router-dom';
import { UserCog, Shield, Eye, Pencil, UserMinus, UserCheck, Lock, Unlock, Scissors } from 'lucide-react';
import Table, { type Column } from '../../../shared/ui/Table';
import AccionesDropdown from '../../../shared/ui/AccionesDropdown';
import type { AdministradorGestion } from '../types/usuarios.types';

interface UserTableProps {
  administradores: AdministradorGestion[];
  onSelectUsuario: (admin: AdministradorGestion) => void;
  onCambiarEstado: (id: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => void;
  onCambiarEstadoGlobal: (id: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => void;
  onConfigurarBarbero: (admin: AdministradorGestion) => void;
  esSuperAdmin: boolean;
  currentUserId?: number;
  isUpdatingId?: number | null;
  isUpdatingGlobalId?: number | null;
}

export const UserTable: React.FC<UserTableProps> = ({
  administradores,
  onSelectUsuario,
  onCambiarEstado,
  onCambiarEstadoGlobal,
  onConfigurarBarbero,
  esSuperAdmin,
  currentUserId,
  isUpdatingId,
  isUpdatingGlobalId,
}) => {
  const columns: Column<AdministradorGestion>[] = [
    {
      key: 'usuario',
      header: 'Administrador',
      render: (admin) => (
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex justify-content-center align-items-center fw-bold flex-shrink-0"
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
      className: 'text-center',
      render: (admin) => (
        <div className="d-flex flex-wrap justify-content-center gap-1">
          <span className="badge bg-warning text-dark">ADMINISTRADOR</span>
          {admin.esBarbero && (
            <span className="badge bg-info text-dark">BARBERO</span>
          )}
        </div>
      ),
    },
    {
      key: 'estadoGlobal',
      header: 'Estado Global',
      className: 'text-center',
      render: (admin) => (
        <span
          className={`badge ${
            admin.estado === 'ACTIVO' ? 'bg-success' : 'bg-danger'
          }`}
        >
          {admin.estado === 'ACTIVO' ? 'Habilitada' : 'Bloqueada'}
        </span>
      ),
    },
    {
      key: 'estadoAdmin',
      header: 'Rol Admin',
      className: 'text-center',
      render: (admin) => (
        <span
          className={`badge ${
            admin.estadoAdmin === 'ACTIVO' ? 'bg-success' : 'bg-secondary'
          }`}
        >
          {admin.estadoAdmin ?? 'INACTIVO'}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-center',
      render: (admin) => {
        const esMismoUsuario = currentUserId === admin.id;
        const puedeEditar = esSuperAdmin || esMismoUsuario;
        const isCurrentUpdating = isUpdatingId === admin.id;
        const isCurrentUpdatingGlobal = isUpdatingGlobalId === admin.id;

        const itemsPerfil = [
          {
            key: 'ficha',
            label: 'Ver ficha completa',
            icon: <Eye size={15} className="text-secondary" />,
            onClick: () => onSelectUsuario(admin),
            title: 'Ver ficha completa del administrador',
          },
          puedeEditar && {
            key: 'editar',
            label: 'Editar datos del perfil',
            icon: <Pencil size={15} className="text-primary" />,
            to: `/usuarios/${admin.id}/editar`,
            title: 'Editar datos del perfil',
          },
          !admin.esBarbero &&
            esSuperAdmin && {
              key: 'barbero',
              label: 'Habilitar rol de barbero',
              icon: <Scissors size={15} className="text-info" />,
              onClick: () => onConfigurarBarbero(admin),
              title: 'Convertir también en barbero',
            },
        ];

        const itemsRolCuenta = [
          esSuperAdmin &&
            !esMismoUsuario && {
              key: 'rol',
              label:
                admin.estadoAdmin === 'ACTIVO'
                  ? 'Desactivar rol (sigue activo)'
                  : 'Activar rol de administrador',
              icon:
                admin.estadoAdmin === 'ACTIVO' ? (
                  <UserMinus size={15} className="text-warning-emphasis" />
                ) : (
                  <UserCheck size={15} className="text-success" />
                ),
              isLoading: isCurrentUpdating,
              onClick: () =>
                onCambiarEstado(
                  admin.id,
                  admin.estadoAdmin === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
                ),
              title:
                admin.estadoAdmin === 'ACTIVO'
                  ? 'Desactivar rol (el usuario sigue activo)'
                  : 'Activar rol de administrador',
            },
          esSuperAdmin && {
            key: 'global',
            label:
              admin.estado === 'ACTIVO'
                ? 'Bloquear cuenta completa'
                : 'Desbloquear cuenta global',
            icon:
              admin.estado === 'ACTIVO' ? (
                <Lock size={15} className="text-danger" />
              ) : (
                <Unlock size={15} className="text-success" />
              ),
            variant:
              admin.estado === 'ACTIVO' ? ('danger' as const) : ('success' as const),
            disabled: esMismoUsuario,
            isLoading: isCurrentUpdatingGlobal,
            onClick: () =>
              onCambiarEstadoGlobal(
                admin.id,
                admin.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
              ),
            title: esMismoUsuario
              ? 'No puedes bloquear tu propia cuenta'
              : admin.estado === 'ACTIVO'
              ? 'Bloquear cuenta completa (no podrá iniciar sesión)'
              : 'Desbloquear cuenta global',
          },
        ];

        return (
          <div className="d-inline-flex align-items-center justify-content-center gap-2">
            <AccionesDropdown
              label="Gestión de Perfil"
              icon={<UserCog size={15} />}
              buttonVariant="btn-outline-primary"
              items={itemsPerfil}
            />

            {esSuperAdmin && (
              <AccionesDropdown
                label="Rol y Cuenta"
                icon={<Shield size={15} />}
                buttonVariant="btn-outline-dark"
                items={itemsRolCuenta}
              />
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
      emptyContent={
        <div className="text-center py-5 border rounded bg-white">
          <div className="mb-3 text-muted" style={{ opacity: 0.4 }}>
            <Shield size={48} />
          </div>
          <h5 className="fw-semibold text-muted mb-2">Sin administradores registrados</h5>
          <p className="text-muted small mb-3">Empieza registrando al primer administrador del sistema.</p>
          {esSuperAdmin && (
            <Link to="/administradores/nuevo" className="btn btn-dark btn-sm">
              + Crear primer administrador
            </Link>
          )}
        </div>
      }
    />
  );
};

export default UserTable;
