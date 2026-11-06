import React from 'react';
import { Link } from 'react-router-dom';
import { UserCog, Shield, Eye, Pencil, UserMinus, UserCheck, Lock, Unlock, Scissors } from 'lucide-react';
import Table, { type Column } from '../../../shared/ui/Table';
import AccionesDropdown from '../../../shared/ui/AccionesDropdown';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import StatusBadge from '../../../shared/ui/atoms/StatusBadge';
import UserAvatar from '../../../shared/ui/atoms/UserAvatar';
import { useMediaQuery } from '../../../shared/lib/useMediaQuery';
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

interface AdminActionsProps {
  admin: AdministradorGestion;
  currentUserId?: number;
  esSuperAdmin: boolean;
  isUpdatingId?: number | null;
  isUpdatingGlobalId?: number | null;
  onSelectUsuario: (admin: AdministradorGestion) => void;
  onConfigurarBarbero: (admin: AdministradorGestion) => void;
  onCambiarEstado: (id: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => void;
  onCambiarEstadoGlobal: (id: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => void;
}

function resolverTituloBloqueoGlobal(esMismoUsuario: boolean, esSuperAdminAdmin: boolean, estadoActivo: boolean): string {
  if (esMismoUsuario) return 'No puedes bloquear tu propia cuenta';
  if (esSuperAdminAdmin) return 'No se puede bloquear la cuenta de un Superadministrador';
  if (estadoActivo) return 'Bloquear cuenta completa (no podrá iniciar sesión)';
  return 'Desbloquear cuenta global';
}

function resolverTituloRolAdmin(esSuperAdminAdmin: boolean, estadoAdminActivo: boolean): string {
  if (esSuperAdminAdmin) return 'No se pueden modificar los privilegios de un Superadministrador';
  if (estadoAdminActivo) return 'Desactivar rol (el usuario sigue activo)';
  return 'Activar rol de administrador';
}

function resolverIconoRolAdmin(isCurrentUpdating: boolean, estadoAdminActivo: boolean) {
  if (isCurrentUpdating) return <KyriosSpinner size="xs" aria-hidden="true" />;
  if (estadoAdminActivo) return <UserMinus size={18} />;
  return <UserCheck size={18} />;
}

function resolverIconoBloqueoGlobal(isCurrentUpdatingGlobal: boolean, isActivo: boolean) {
  if (isCurrentUpdatingGlobal) return <KyriosSpinner size="xs" aria-hidden="true" />;
  if (isActivo) return <Lock size={18} />;
  return <Unlock size={18} />;
}

const AdminActionsDropdown: React.FC<AdminActionsProps> = ({
  admin,
  currentUserId,
  esSuperAdmin,
  isUpdatingId,
  isUpdatingGlobalId,
  onSelectUsuario,
  onConfigurarBarbero,
  onCambiarEstado,
  onCambiarEstadoGlobal,
}) => {
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
      linkState: { from: '/usuarios?tab=administradores' },
      title: 'Editar datos del perfil',
    },
    !admin.esBarbero &&
      (esSuperAdmin || esMismoUsuario) && {
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
        disabled: isCurrentUpdating || Boolean(admin.esSuperAdmin),
        isLoading: isCurrentUpdating,
        onClick: () =>
          onCambiarEstado(
            admin.id,
            admin.estadoAdmin === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
          ),
        title: resolverTituloRolAdmin(Boolean(admin.esSuperAdmin), admin.estadoAdmin === 'ACTIVO'),
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
      disabled: esMismoUsuario || isCurrentUpdatingGlobal || Boolean(admin.esSuperAdmin),
      isLoading: isCurrentUpdatingGlobal,
      onClick: () =>
        onCambiarEstadoGlobal(
          admin.id,
          admin.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
        ),
      title: resolverTituloBloqueoGlobal(Boolean(esMismoUsuario), Boolean(admin.esSuperAdmin), admin.estado === 'ACTIVO'),
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
};

const AdminMobileActions: React.FC<AdminActionsProps> = ({
  admin,
  currentUserId,
  esSuperAdmin,
  isUpdatingId,
  isUpdatingGlobalId,
  onSelectUsuario,
  onConfigurarBarbero,
  onCambiarEstado,
  onCambiarEstadoGlobal,
}) => {
  const esMismoUsuario = currentUserId === admin.id;
  const puedeEditar = esSuperAdmin || esMismoUsuario;
  const isCurrentUpdating = isUpdatingId === admin.id;
  const isCurrentUpdatingGlobal = isUpdatingGlobalId === admin.id;
  const isActivo = admin.estado === 'ACTIVO';

  return (
    <div className="d-flex flex-wrap gap-2 pt-2 justify-content-end">
      <button
        type="button"
        className="btn btn-outline-secondary mobile-action-btn"
        onClick={() => onSelectUsuario(admin)}
        title="Ver ficha completa"
        aria-label="Ver ficha completa"
      >
        <Eye size={18} />
      </button>

      {puedeEditar && (
        <Link
          to={`/usuarios/${admin.id}/editar`}
          state={{ from: '/usuarios?tab=administradores' }}
          className="btn btn-outline-primary mobile-action-btn"
          title="Editar datos del perfil"
          aria-label="Editar datos del perfil"
        >
          <Pencil size={18} />
        </Link>
      )}

      {!admin.esBarbero && (esSuperAdmin || esMismoUsuario) && (
        <button
          type="button"
          className="btn btn-outline-info mobile-action-btn"
          onClick={() => onConfigurarBarbero(admin)}
          title="Habilitar rol de barbero"
          aria-label="Habilitar rol de barbero"
        >
          <Scissors size={18} />
        </button>
      )}

      {esSuperAdmin && !esMismoUsuario && (
        <button
          type="button"
          className="btn btn-outline-warning mobile-action-btn"
          disabled={isCurrentUpdating || Boolean(admin.esSuperAdmin)}
          onClick={() =>
            onCambiarEstado(
              admin.id,
              admin.estadoAdmin === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
            )
          }
          title={resolverTituloRolAdmin(Boolean(admin.esSuperAdmin), admin.estadoAdmin === 'ACTIVO')}
          aria-label={
            admin.estadoAdmin === 'ACTIVO'
              ? 'Desactivar rol de administrador'
              : 'Activar rol de administrador'
          }
        >
          {resolverIconoRolAdmin(Boolean(isCurrentUpdating), admin.estadoAdmin === 'ACTIVO')}
        </button>
      )}

      {esSuperAdmin && (
        <button
          type="button"
          className={`btn ${isActivo ? 'btn-outline-danger' : 'btn-outline-success'} mobile-action-btn`}
          disabled={esMismoUsuario || isCurrentUpdatingGlobal || Boolean(admin.esSuperAdmin)}
          onClick={() =>
            onCambiarEstadoGlobal(
              admin.id,
              isActivo ? 'INACTIVO' : 'ACTIVO'
            )
          }
          title={resolverTituloBloqueoGlobal(Boolean(esMismoUsuario), Boolean(admin.esSuperAdmin), Boolean(isActivo))}
          aria-label={isActivo ? 'Bloquear cuenta de usuario' : 'Desbloquear cuenta de usuario'}
        >
          {resolverIconoBloqueoGlobal(Boolean(isCurrentUpdatingGlobal), Boolean(isActivo))}
        </button>
      )}
    </div>
  );
};

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
  const isMobile = useMediaQuery('(max-width: 767.98px)');

  const columns: Column<AdministradorGestion>[] = [
    {
      key: 'usuario',
      header: 'Administrador',
      render: (admin) => (
        <div className="d-flex align-items-center gap-2">
          <UserAvatar nombre={admin.nombre} apellido={admin.apellido} size={36} />
          <div>
            <span className="fw-semibold d-block">
              {admin.nombre} {admin.apellido}
            </span>
            <span className="text-muted small d-none d-sm-block">{admin.email}</span>
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
          {admin.esSuperAdmin ? (
            <span className="badge bg-danger text-white fw-bold">SUPERADMIN</span>
          ) : (
            <span className="badge bg-warning text-dark">ADMINISTRADOR</span>
          )}
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
        <StatusBadge estado={admin.estado} tone="global" />
      ),
    },
    {
      key: 'estadoAdmin',
      header: 'Rol Admin',
      className: 'text-center d-none d-lg-table-cell',
      render: (admin) => (
        <StatusBadge estado={admin.estadoAdmin ?? 'INACTIVO'} tone="role" />
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-center',
      render: (admin) => (
        <AdminActionsDropdown
          admin={admin}
          currentUserId={currentUserId}
          esSuperAdmin={esSuperAdmin}
          isUpdatingId={isUpdatingId}
          isUpdatingGlobalId={isUpdatingGlobalId}
          onSelectUsuario={onSelectUsuario}
          onConfigurarBarbero={onConfigurarBarbero}
          onCambiarEstado={onCambiarEstado}
          onCambiarEstadoGlobal={onCambiarEstadoGlobal}
        />
      ),
    },
  ];

  // Vista en móvil: lista de cards apiladas
  if (isMobile) {
    if (administradores.length === 0) {
      return (
        <div className="text-center py-5 border rounded card-surface">
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
      );
    }

    return (
      <div className="mobile-cards-container d-flex flex-column gap-3">
        {administradores.map((admin) => {
          const isActivo = admin.estado === 'ACTIVO';
          const borderColor = isActivo ? '#10B981' : '#EF4444';

          return (
            <div
              key={admin.id}
              className="mobile-user-card border-start border-4 shadow-sm"
              style={{ borderLeftColor: borderColor }}
            >
              {/* 1. Avatar + Nombre + Email */}
              <div className="d-flex align-items-center gap-3 mb-2">
                <UserAvatar nombre={admin.nombre} apellido={admin.apellido} size={42} />
                <div className="text-truncate">
                  <span className="fw-bold d-block text-truncate" style={{ fontSize: '0.95rem' }}>
                    {admin.nombre} {admin.apellido}
                  </span>
                  <span className="text-muted small d-block text-truncate">
                    {admin.email}
                  </span>
                </div>
              </div>

              {/* 2. Badges de Rol */}
              <div className="d-flex flex-wrap align-items-center gap-1 mb-2">
                {admin.esSuperAdmin ? (
                  <span className="badge bg-danger text-white fw-bold" style={{ fontSize: '0.7rem' }}>
                    SUPERADMIN
                  </span>
                ) : (
                  <span className="badge bg-warning text-dark" style={{ fontSize: '0.7rem' }}>
                    ADMINISTRADOR
                  </span>
                )}
                {admin.esBarbero && (
                  <span className="badge bg-info text-dark" style={{ fontSize: '0.7rem' }}>
                    BARBERO
                  </span>
                )}
              </div>

              {/* 3. Estado Global + Estado de Rol */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 border-top border-bottom my-2 bg-surface-app px-2 rounded">
                <div className="d-flex align-items-center gap-1">
                  <span className="text-muted small">Cuenta:</span>
                  <StatusBadge estado={admin.estado} tone="global" />
                </div>
                <div className="d-flex align-items-center gap-1">
                  <span className="text-muted small">Rol:</span>
                  <StatusBadge estado={admin.estadoAdmin ?? 'INACTIVO'} tone="role" />
                </div>
              </div>

              {/* 4. Fila de acciones (iconos táctiles ≥ 44x44px) */}
              <AdminMobileActions
                admin={admin}
                currentUserId={currentUserId}
                esSuperAdmin={esSuperAdmin}
                isUpdatingId={isUpdatingId}
                isUpdatingGlobalId={isUpdatingGlobalId}
                onSelectUsuario={onSelectUsuario}
                onConfigurarBarbero={onConfigurarBarbero}
                onCambiarEstado={onCambiarEstado}
                onCambiarEstadoGlobal={onCambiarEstadoGlobal}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // Vista en desktop / tablet
  return (
    <div className="table-view-container">
      <Table
        columns={columns}
        data={administradores}
        keyExtractor={(item) => item.id}
        emptyContent={
          <div className="text-center py-5 border rounded card-surface">
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
    </div>
  );
};

export default UserTable;
