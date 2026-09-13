import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import Spinner from '../../../shared/ui/Spinner';
import ErrorMessage from '../../../shared/ui/ErrorMessage';

// Facades
import {
  useAdministradores,
  useCambiarEstadoAdministrador,
  useConfigurarBarbero,
  useConfigurarMeComoBarbero,
} from '../api/usuarios.facade';
import {
  useBarberosGestion,
  useCambiarEstadoBarbero,
  useActualizarComision,
} from '../../barberos/api/barberos.facade';

// Atomic Components
import UserTable from '../components/UserTable';
import BarberoTable from '../../barberos/components/BarberoTable';
import UserDetailModal from '../components/UserDetailModal';
import BarberoConfigModal from '../components/BarberoConfigModal';
import CommissionModal from '../../barberos/components/CommissionModal';

// Types & Mappers
import type { AdministradorGestion, UsuarioDetalle } from '../types/usuarios.types';
import type { BarberoGestion } from '../../barberos/types/barberos.types';
import { usuariosMapper } from '../api/usuarios.mapper';
import type { ConfigurarBarberoFormValues } from '../schemas/usuario.schema';

type Pestaña = 'administradores' | 'barberos';

export const UsuariosPage: React.FC = () => {
  const { roles, usuarioDb } = useAuth();
  const location = useLocation();

  const esSuperAdmin = roles.includes('SUPERADMIN');
  const [pestañaActiva, setPestañaActiva] = useState<Pestaña>(
    esSuperAdmin ? 'administradores' : 'barberos'
  );

  // Consultas asíncronas con TanStack Query
  const {
    data: administradores = [],
    isLoading: cargandoAdmins,
    error: errorAdmins,
    refetch: refetchAdmins,
  } = useAdministradores(esSuperAdmin && pestañaActiva === 'administradores');

  const {
    data: barberos = [],
    isLoading: cargandoBarberos,
    error: errorBarberos,
    refetch: refetchBarberos,
  } = useBarberosGestion(pestañaActiva === 'barberos');

  // Mutaciones
  const cambiarEstadoAdminMutation = useCambiarEstadoAdministrador();
  const cambiarEstadoBarberoMutation = useCambiarEstadoBarbero();
  const actualizarComisionMutation = useActualizarComision();
  const configurarBarberoMutation = useConfigurarBarbero();
  const configurarMeMutation = useConfigurarMeComoBarbero();

  // Estados de modales
  const [usuarioDetalle, setUsuarioDetalle] = useState<UsuarioDetalle | null>(null);
  const [adminAConfigurar, setAdminAConfigurar] = useState<AdministradorGestion | null>(null);
  const [barberoAEditarComision, setBarberoAEditarComision] = useState<BarberoGestion | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  // Handlers
  const handleVerDetalles = (entity: AdministradorGestion | BarberoGestion) => {
    setUsuarioDetalle(usuariosMapper.toDetalleDomain(entity));
  };

  const handleCambiarEstadoAdmin = async (id: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => {
    try {
      setErrorAccion(null);
      await cambiarEstadoAdminMutation.mutateAsync({ id, datos: { estado: nuevoEstado } });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cambiar el estado del administrador.';
      setErrorAccion(errorMsg);
    }
  };

  const handleCambiarEstadoBarbero = async (id: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => {
    try {
      setErrorAccion(null);
      await cambiarEstadoBarberoMutation.mutateAsync({ id, datos: { estado: nuevoEstado } });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cambiar el estado del barbero.';
      setErrorAccion(errorMsg);
    }
  };

  const handleGuardarComision = async (barberoId: number, porcentaje: number) => {
    try {
      setErrorAccion(null);
      await actualizarComisionMutation.mutateAsync({
        id: barberoId,
        datos: { porcentajeComision: porcentaje },
      });
      setBarberoAEditarComision(null);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar la comisión.';
      setErrorAccion(errorMsg);
    }
  };

  const handleGuardarPerfilBarbero = async (datos: ConfigurarBarberoFormValues) => {
    try {
      setErrorAccion(null);
      if (adminAConfigurar) {
        await configurarBarberoMutation.mutateAsync({
          id: adminAConfigurar.id,
          datos: { telefono: datos.telefono, porcentajeComision: datos.porcentajeComision },
        });
        setAdminAConfigurar(null);
      } else {
        await configurarMeMutation.mutateAsync(datos);
        window.location.reload();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al asignar el perfil de barbero.';
      setErrorAccion(errorMsg);
    }
  };

  const mensajeNavegacion = location.state?.mensaje as string | undefined;

  return (
    <div className="usuarios-page-container">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="h2 fw-bold mb-1">Gestión de Usuarios</h1>
          <p className="text-muted mb-0">
            Administra los usuarios, perfiles operativos y asignación de barberos.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {esSuperAdmin && pestañaActiva === 'administradores' && (
            <Link to="/administradores/nuevo" className="btn btn-primary">
              + Nuevo Administrador
            </Link>
          )}

          {pestañaActiva === 'barberos' && (
            <Link to="/barberos/nuevo" className="btn btn-primary">
              + Nuevo Barbero
            </Link>
          )}
        </div>
      </div>

      {mensajeNavegacion && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {mensajeNavegacion}
        </div>
      )}

      {errorAccion && <ErrorMessage message={errorAccion} />}

      {/* Pestañas de Navegación */}
      <ul className="nav nav-tabs mb-4">
        {esSuperAdmin && (
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${
                pestañaActiva === 'administradores' ? 'active text-primary' : 'text-muted'
              }`}
              onClick={() => {
                setPestañaActiva('administradores');
                setErrorAccion(null);
              }}
            >
              Administradores ({administradores.length})
            </button>
          </li>
        )}
        <li className="nav-item">
          <button
            className={`nav-link fw-semibold ${
              pestañaActiva === 'barberos' ? 'active text-primary' : 'text-muted'
            }`}
            onClick={() => {
              setPestañaActiva('barberos');
              setErrorAccion(null);
            }}
          >
            Barberos ({barberos.length})
          </button>
        </li>
      </ul>

      {/* Contenido según pestaña */}
      {pestañaActiva === 'administradores' && (
        <>
          {errorAdmins && (
            <ErrorMessage
              message={errorAdmins.message || 'Error cargando administradores'}
              onRetry={refetchAdmins}
            />
          )}

          {cargandoAdmins ? (
            <Spinner mensaje="Cargando administradores..." />
          ) : (
            <UserTable
              administradores={administradores}
              onSelectUsuario={handleVerDetalles}
              onCambiarEstado={handleCambiarEstadoAdmin}
              onConfigurarBarbero={(admin) => setAdminAConfigurar(admin)}
              esSuperAdmin={esSuperAdmin}
              currentUserId={usuarioDb?.id}
              isUpdatingId={cambiarEstadoAdminMutation.isPending ? cambiarEstadoAdminMutation.variables?.id : null}
            />
          )}
        </>
      )}

      {pestañaActiva === 'barberos' && (
        <>
          {errorBarberos && (
            <ErrorMessage
              message={errorBarberos.message || 'Error cargando barberos'}
              onRetry={refetchBarberos}
            />
          )}

          {cargandoBarberos ? (
            <Spinner mensaje="Cargando barberos de gestión..." />
          ) : (
            <BarberoTable
              barberos={barberos}
              onSelectBarbero={handleVerDetalles}
              onEditarComision={(barbero) => setBarberoAEditarComision(barbero)}
              onCambiarEstado={handleCambiarEstadoBarbero}
              esSuperAdmin={esSuperAdmin}
              isUpdatingId={cambiarEstadoBarberoMutation.isPending ? cambiarEstadoBarberoMutation.variables?.id : null}
            />
          )}
        </>
      )}

      {/* Modales Atómicos */}
      <UserDetailModal
        usuario={usuarioDetalle}
        onClose={() => setUsuarioDetalle(null)}
      />

      <BarberoConfigModal
        isOpen={Boolean(adminAConfigurar)}
        admin={adminAConfigurar}
        onClose={() => setAdminAConfigurar(null)}
        onSubmit={handleGuardarPerfilBarbero}
        isLoading={configurarBarberoMutation.isPending || configurarMeMutation.isPending}
        error={errorAccion}
      />

      <CommissionModal
        isOpen={Boolean(barberoAEditarComision)}
        barbero={barberoAEditarComision}
        onClose={() => setBarberoAEditarComision(null)}
        onSubmit={handleGuardarComision}
        isLoading={actualizarComisionMutation.isPending}
        error={errorAccion}
      />
    </div>
  );
};

export default UsuariosPage;
