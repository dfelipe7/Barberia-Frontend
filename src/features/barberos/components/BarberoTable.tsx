import React from 'react';
import { Link } from 'react-router-dom';
import { UserCog, Shield, Eye, Percent, Camera, Pencil, Scissors, UserMinus, UserCheck, Lock, Unlock } from 'lucide-react';
import Table, { type Column } from '../../../shared/ui/Table';
import AccionesDropdown from '../../../shared/ui/AccionesDropdown';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import StatusBadge from '../../../shared/ui/atoms/StatusBadge';
import UserAvatar from '../../../shared/ui/atoms/UserAvatar';
import { useMediaQuery } from '../../../shared/lib/useMediaQuery';
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
  const isMobile = useMediaQuery('(max-width: 767.98px)');

  const columns: Column<BarberoGestion>[] = [
    {
      key: 'barbero',
      header: 'Barbero',
      render: (barbero) => (
        <div className="d-flex align-items-center gap-2">
          <UserAvatar nombre={barbero.nombre} apellido={barbero.apellido} fotoUrl={barbero.fotoUrl} size={36} />
          <div>
            <span className="fw-semibold d-block">
              {barbero.nombre} {barbero.apellido}
            </span>
            <span className="text-muted small d-none d-sm-block">{barbero.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'comision',
      header: 'Comisión',
      className: 'text-center',
      render: (barbero) => (
        <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2 py-1 fs-6">
          {barbero.porcentajeComision}%
        </span>
      ),
    },
    {
      key: 'roles',
      header: 'Perfil',
      className: 'text-center',
      render: (barbero) => (
        <div className="d-flex flex-wrap justify-content-center gap-1">
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
      className: 'text-center',
      render: (barbero) => (
        <StatusBadge estado={barbero.estadoGlobal} tone="global" />
      ),
    },
    {
      key: 'estado',
      header: 'Rol Barbero',
      className: 'text-center d-none d-lg-table-cell',
      render: (barbero) => (
        <StatusBadge estado={barbero.estado} tone="role" />
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-center',
      render: (barbero) => {
        const esMismoUsuario = currentUserId === barbero.id;
        const isCurrentUpdating = isUpdatingId === barbero.id;
        const isCurrentUpdatingGlobal = isUpdatingGlobalId === barbero.id;
        const puedeEditar = puedeGestionarEstado(rolActorPrincipal, 'BARBERO');

        const itemsPerfil = [
          {
            key: 'ficha',
            label: 'Ver ficha completa',
            icon: <Eye size={15} className="text-secondary" />,
            onClick: () => onSelectBarbero(barbero),
            title: 'Ver ficha completa del profesional',
          },
          puedeEditar && {
            key: 'editar',
            label: 'Editar datos del perfil',
            icon: <Pencil size={15} className="text-primary" />,
            to: `/usuarios/${barbero.id}/editar`,
            linkState: { from: '/barberos' },
            title: 'Editar datos del perfil',
          },
          {
            key: 'comision',
            label: 'Cambiar % de comisión',
            icon: <Percent size={15} className="text-warning-emphasis" />,
            onClick: () => onEditarComision(barbero),
            title: 'Cambiar porcentaje de comisión',
          },
          puedeEditar && {
            key: 'foto',
            label: 'Actualizar foto profesional',
            icon: <Camera size={15} className="text-info" />,
            onClick: () => onEditarFoto(barbero),
            title: 'Actualizar foto profesional',
          },
        ];

        const itemsRolCuenta = [
          puedeEditar && {
            key: 'rol',
            label:
              barbero.estado === 'ACTIVO'
                ? 'Desactivar rol (sigue activo)'
                : 'Activar rol de barbero',
            icon:
              barbero.estado === 'ACTIVO' ? (
                <UserMinus size={15} className="text-warning-emphasis" />
              ) : (
                <UserCheck size={15} className="text-success" />
              ),
            isLoading: isCurrentUpdating,
            onClick: () =>
              onCambiarEstado(
                barbero.id,
                barbero.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
              ),
            title:
              barbero.estado === 'ACTIVO'
                ? 'Desactivar rol (el usuario sigue activo)'
                : 'Activar rol de barbero',
          },
          puedeEditar && {
            key: 'global',
            label:
              barbero.estadoGlobal === 'ACTIVO'
                ? 'Bloquear cuenta completa'
                : 'Desbloquear cuenta global',
            icon:
              barbero.estadoGlobal === 'ACTIVO' ? (
                <Lock size={15} className="text-danger" />
              ) : (
                <Unlock size={15} className="text-success" />
              ),
            variant:
              barbero.estadoGlobal === 'ACTIVO' ? ('danger' as const) : ('success' as const),
            disabled: esMismoUsuario,
            isLoading: isCurrentUpdatingGlobal,
            onClick: () =>
              onCambiarEstadoGlobal(
                barbero.id,
                barbero.estadoGlobal === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
              ),
            title: esMismoUsuario
              ? 'No puedes bloquear tu propia cuenta'
              : barbero.estadoGlobal === 'ACTIVO'
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

            {puedeEditar && (
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

  // Vista en móvil: lista de cards apiladas
  if (isMobile) {
    if (barberos.length === 0) {
      return (
        <div className="text-center py-5 border rounded card-surface">
          <div className="mb-3 text-muted" style={{ opacity: 0.4 }}>
            <Scissors size={48} />
          </div>
          <h5 className="fw-semibold text-muted mb-2">Sin barberos registrados</h5>
          <p className="text-muted small mb-3">Empieza creando el primer profesional del equipo.</p>
          <Link to="/barberos/nuevo" className="btn btn-dark btn-sm">
            + Crear primer barbero
          </Link>
        </div>
      );
    }

    return (
      <div className="mobile-cards-container d-flex flex-column gap-3">
        {barberos.map((barbero) => {
          const esMismoUsuario = currentUserId === barbero.id;
          const isCurrentUpdating = isUpdatingId === barbero.id;
          const isCurrentUpdatingGlobal = isUpdatingGlobalId === barbero.id;
          const puedeEditar = puedeGestionarEstado(rolActorPrincipal, 'BARBERO');
          const isActivo = barbero.estadoGlobal === 'ACTIVO';
          const borderColor = isActivo ? '#10B981' : '#EF4444';

          return (
            <div
              key={barbero.id}
              className="mobile-user-card border-start border-4 shadow-sm"
              style={{ borderLeftColor: borderColor }}
            >
              {/* 1. Avatar + Nombre + Email */}
              <div className="d-flex align-items-center gap-3 mb-2">
                <UserAvatar nombre={barbero.nombre} apellido={barbero.apellido} fotoUrl={barbero.fotoUrl} size={42} />
                <div className="text-truncate">
                  <span className="fw-bold d-block text-truncate" style={{ fontSize: '0.95rem' }}>
                    {barbero.nombre} {barbero.apellido}
                  </span>
                  <span className="text-muted small d-block text-truncate">
                    {barbero.email}
                  </span>
                </div>
              </div>

              {/* 2. Badges de Rol y Comisión */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 mb-2">
                <div className="d-flex flex-wrap align-items-center gap-1">
                  <span className="badge bg-info text-dark" style={{ fontSize: '0.7rem' }}>
                    BARBERO
                  </span>
                  {barbero.esAdministrador && (
                    <span className="badge bg-warning text-dark" style={{ fontSize: '0.7rem' }}>
                      ADMIN
                    </span>
                  )}
                </div>
                <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2 py-1" style={{ fontSize: '0.78rem' }}>
                  Comisión: {barbero.porcentajeComision}%
                </span>
              </div>

              {/* 3. Estados: Global + Rol */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 border-top border-bottom my-2 bg-surface-app px-2 rounded">
                <div className="d-flex align-items-center gap-1">
                  <span className="text-muted small">Cuenta:</span>
                  <StatusBadge estado={barbero.estadoGlobal} tone="global" />
                </div>
                <div className="d-flex align-items-center gap-1">
                  <span className="text-muted small">Rol:</span>
                  <StatusBadge estado={barbero.estado} tone="role" />
                </div>
              </div>

              {/* 4. Fila de acciones (iconos táctiles ≥ 44x44px) */}
              <div className="d-flex flex-wrap gap-2 pt-2 justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary mobile-action-btn"
                  onClick={() => onSelectBarbero(barbero)}
                  title="Ver ficha completa"
                  aria-label="Ver ficha completa"
                >
                  <Eye size={18} />
                </button>

                {puedeEditar && (
                  <Link
                    to={`/usuarios/${barbero.id}/editar`}
                    state={{ from: '/barberos' }}
                    className="btn btn-outline-primary mobile-action-btn"
                    title="Editar datos del perfil"
                    aria-label="Editar datos del perfil"
                  >
                    <Pencil size={18} />
                  </Link>
                )}

                <button
                  type="button"
                  className="btn btn-outline-warning mobile-action-btn"
                  onClick={() => onEditarComision(barbero)}
                  title="Cambiar % de comisión"
                  aria-label="Cambiar porcentaje de comisión"
                >
                  <Percent size={18} />
                </button>

                {puedeEditar && (
                  <button
                    type="button"
                    className="btn btn-outline-info mobile-action-btn"
                    onClick={() => onEditarFoto(barbero)}
                    title="Actualizar foto profesional"
                    aria-label="Actualizar foto profesional"
                  >
                    <Camera size={18} />
                  </button>
                )}

                {puedeEditar && (
                  <button
                    type="button"
                    className="btn btn-outline-warning mobile-action-btn"
                    disabled={isCurrentUpdating}
                    onClick={() =>
                      onCambiarEstado(
                        barbero.id,
                        barbero.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
                      )
                    }
                    title={barbero.estado === 'ACTIVO' ? 'Desactivar rol' : 'Activar rol de barbero'}
                    aria-label={barbero.estado === 'ACTIVO' ? 'Desactivar rol de barbero' : 'Activar rol de barbero'}
                  >
                    {isCurrentUpdating ? (
                      <KyriosSpinner size="xs" aria-hidden="true" />
                    ) : barbero.estado === 'ACTIVO' ? (
                      <UserMinus size={18} />
                    ) : (
                      <UserCheck size={18} />
                    )}
                  </button>
                )}

                {puedeEditar && (
                  <button
                    type="button"
                    className={`btn ${isActivo ? 'btn-outline-danger' : 'btn-outline-success'} mobile-action-btn`}
                    disabled={esMismoUsuario || isCurrentUpdatingGlobal}
                    onClick={() =>
                      onCambiarEstadoGlobal(
                        barbero.id,
                        barbero.estadoGlobal === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
                      )
                    }
                    title={
                      esMismoUsuario
                        ? 'No puedes bloquear tu propia cuenta'
                        : isActivo
                        ? 'Bloquear cuenta completa'
                        : 'Desbloquear cuenta global'
                    }
                    aria-label={isActivo ? 'Bloquear cuenta completa' : 'Desbloquear cuenta global'}
                  >
                    {isCurrentUpdatingGlobal ? (
                      <KyriosSpinner size="xs" aria-hidden="true" />
                    ) : isActivo ? (
                      <Lock size={18} />
                    ) : (
                      <Unlock size={18} />
                    )}
                  </button>
                )}
              </div>
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
        data={barberos}
        keyExtractor={(item) => item.id}
        emptyContent={
          <div className="text-center py-5 border rounded card-surface">
            <div className="mb-3 text-muted" style={{ opacity: 0.4 }}>
              <Scissors size={48} />
            </div>
            <h5 className="fw-semibold text-muted mb-2">Sin barberos registrados</h5>
            <p className="text-muted small mb-3">Empieza creando el primer profesional del equipo.</p>
            <Link to="/barberos/nuevo" className="btn btn-dark btn-sm">
              + Crear primer barbero
            </Link>
          </div>
        }
      />
    </div>
  );
};

export default BarberoTable;
