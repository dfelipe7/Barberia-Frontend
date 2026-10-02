import React from 'react';
import { Link } from 'react-router-dom';
import { UserCog, Shield, Eye, Percent, Camera, Pencil, Scissors, UserMinus, UserCheck, Lock, Unlock } from 'lucide-react';
import Table, { type Column } from '../../../shared/ui/Table';
import AccionesDropdown from '../../../shared/ui/AccionesDropdown';
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
            className="rounded-circle bg-info bg-opacity-10 text-dark d-inline-flex justify-content-center align-items-center fw-bold flex-shrink-0"
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
      className: 'text-center',
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

  return (
    <Table
      columns={columns}
      data={barberos}
      keyExtractor={(item) => item.id}
      emptyContent={
        <div className="text-center py-5 border rounded bg-white">
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
  );
};

export default BarberoTable;
