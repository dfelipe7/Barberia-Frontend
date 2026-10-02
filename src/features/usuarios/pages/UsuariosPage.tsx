import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import Spinner from '../../../shared/ui/Spinner';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { mapApiError } from '../../../shared/lib/mapApiError';

// Facades
import {
  useAdministradores,
  useCambiarEstadoAdministrador,
  useCambiarEstadoUsuarioGlobal,
  useConfigurarBarbero,
  useConfigurarMeComoBarbero,
} from '../api/usuarios.facade';
import {
  useBarberosGestion,
  useCambiarEstadoBarbero,
  useCambiarEstadoGlobalBarbero,
  useActualizarComision,
  useSubirFotoAdmin,
} from '../../barberos/api/barberos.facade';

// Atomic Components
import UserTable from '../components/UserTable';
import BarberoTable from '../../barberos/components/BarberoTable';
import UserDetailModal from '../components/UserDetailModal';
import BarberoConfigModal from '../components/BarberoConfigModal';
import CommissionModal from '../../barberos/components/CommissionModal';
import FotoBarberoModal from '../../barberos/components/FotoBarberoModal';

// Types & Mappers
import type { AdministradorGestion, UsuarioDetalle } from '../types/usuarios.types';
import type { BarberoGestion } from '../../barberos/types/barberos.types';
import { usuariosMapper } from '../api/usuarios.mapper';
import type { ConfigurarBarberoFormValues } from '../schemas/usuario.schema';
import type { Rol } from '../../../shared/lib/autorizacion/roles';

type Pestaña = 'administradores' | 'barberos';

export const UsuariosPage: React.FC = () => {
  const { roles, usuarioDb } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const esSuperAdmin = roles.includes('SUPERADMIN');
  const esAdministrador = roles.includes('ADMINISTRADOR');
  const rolActorPrincipal: Rol = esSuperAdmin
  ? 'SUPERADMIN'
  : esAdministrador
    ? 'ADMINISTRADOR'
    : 'BARBERO';
  const [pestañaActiva, setPestañaActiva] = useState<Pestaña>(
    esSuperAdmin ? 'administradores' : 'barberos'
  );

  // Consultas asíncronas con TanStack Query
  const {
    data: administradores = [],
    isLoading: cargandoAdmins,
    error: errorAdmins,
    refetch: refetchAdmins,
  } = useAdministradores(esSuperAdmin);

  const {
    data: barberos = [],
    isLoading: cargandoBarberos,
    error: errorBarberos,
    refetch: refetchBarberos,
  } = useBarberosGestion(esSuperAdmin || esAdministrador);

  // Mutaciones
  const cambiarEstadoAdminMutation = useCambiarEstadoAdministrador();
  const cambiarEstadoGlobalAdminMutation = useCambiarEstadoUsuarioGlobal();
  const cambiarEstadoBarberoMutation = useCambiarEstadoBarbero();
  const cambiarEstadoGlobalBarberoMutation = useCambiarEstadoGlobalBarbero();
  const actualizarComisionMutation = useActualizarComision();
  const configurarBarberoMutation = useConfigurarBarbero();
  const configurarMeMutation = useConfigurarMeComoBarbero();
  const subirFotoAdminMutation = useSubirFotoAdmin();

  // Estados de modales
  const [usuarioDetalle, setUsuarioDetalle] = useState<UsuarioDetalle | null>(null);
  const [adminAConfigurar, setAdminAConfigurar] = useState<AdministradorGestion | null>(null);
  const [barberoAEditarComision, setBarberoAEditarComision] = useState<BarberoGestion | null>(null);
  const [barberoAEditarFoto, setBarberoAEditarFoto] = useState<BarberoGestion | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  useEffect(() => {
    const mensaje = location.state?.mensaje as string | undefined;

    if (!mensaje) return;

    setMensajeExito(mensaje);

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location.state?.mensaje, location.pathname, navigate]);
  useEffect(() => {
    if (!mensajeExito) return;

    const timer = window.setTimeout(() => {
      setMensajeExito(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [mensajeExito]);
  // Handlers
  const handleVerDetalles = (entity: AdministradorGestion | BarberoGestion) => {
    setUsuarioDetalle(usuariosMapper.toDetalleDomain(entity));
  };

  const handleCambiarEstadoAdmin = async (id: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => {
    try {
      setMensajeExito(null);
      setErrorAccion(null);
      await cambiarEstadoAdminMutation.mutateAsync({ id, datos: { estado: nuevoEstado } });
      setMensajeExito('El estado del usuario se actualizó correctamente.');
    } catch (err: unknown) {
      setErrorAccion(mapApiError(err));
    }
  };

  const handleCambiarEstadoGlobalAdmin = async (
    id: number,
    nuevoEstado: 'ACTIVO' | 'INACTIVO'
  ) => {
    try {
      setMensajeExito(null);
      setErrorAccion(null);
      await cambiarEstadoGlobalAdminMutation.mutateAsync({ id, datos: { estado: nuevoEstado } });
      setMensajeExito(
        nuevoEstado === 'ACTIVO'
          ? 'Cuenta desbloqueada correctamente.'
          : 'Cuenta bloqueada globalmente.'
      );
    } catch (err) {
      setErrorAccion(mapApiError(err));
    }
  };

  const handleCambiarEstadoBarbero = async (id: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => {
    try {
      setMensajeExito(null);
      setErrorAccion(null);
      await cambiarEstadoBarberoMutation.mutateAsync({ id, datos: { estado: nuevoEstado } });
      setMensajeExito('El estado del usuario se actualizó correctamente.');
    } catch (err: unknown) {
      setErrorAccion(mapApiError(err));
    }
  };

  const handleCambiarEstadoGlobalBarbero = async (
    id: number,
    nuevoEstado: 'ACTIVO' | 'INACTIVO'
  ) => {
    try {
      setMensajeExito(null);
      setErrorAccion(null);
      await cambiarEstadoGlobalBarberoMutation.mutateAsync({ id, datos: { estado: nuevoEstado } });
      setMensajeExito(
        nuevoEstado === 'ACTIVO'
          ? 'Cuenta desbloqueada correctamente.'
          : 'Cuenta bloqueada globalmente.'
      );
    } catch (err) {
      setErrorAccion(mapApiError(err));
    }
  };

  const handleGuardarComision = async (barberoId: number, porcentaje: number) => {
    try {
    setMensajeExito(null);
    setErrorAccion(null);

    await actualizarComisionMutation.mutateAsync({
      id: barberoId,
      datos: { porcentajeComision: porcentaje },
    });

    setBarberoAEditarComision(null);
    setMensajeExito('La comisión del barbero se actualizó correctamente.');
    } catch (err: unknown) {
      setErrorAccion(mapApiError(err));
    }
  };

  const handleGuardarFoto = async (barberoId: number, file: File) => {
    try {
      setMensajeExito(null);
      setErrorAccion(null);

      await subirFotoAdminMutation.mutateAsync({
        id: barberoId,
        file,
      });

      setBarberoAEditarFoto(null);
      setMensajeExito('La foto del barbero se actualizó correctamente.');
    } catch (err: unknown) {
      setErrorAccion(mapApiError(err));
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
      setErrorAccion(mapApiError(err));
    }
  };


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

      {mensajeExito && (
        <div className="alert alert-success py-2 mb-4" role="alert">
          {mensajeExito}
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
              onCambiarEstadoGlobal={handleCambiarEstadoGlobalAdmin}
              onConfigurarBarbero={(admin) => setAdminAConfigurar(admin)}
              esSuperAdmin={esSuperAdmin}
              currentUserId={usuarioDb?.id}
              isUpdatingId={cambiarEstadoAdminMutation.isPending ? cambiarEstadoAdminMutation.variables?.id : null}
              isUpdatingGlobalId={cambiarEstadoGlobalAdminMutation.isPending ? cambiarEstadoGlobalAdminMutation.variables?.id : null}
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
              onEditarFoto={(barbero) => setBarberoAEditarFoto(barbero)}
              onCambiarEstado={handleCambiarEstadoBarbero}
              onCambiarEstadoGlobal={handleCambiarEstadoGlobalBarbero}
              rolActorPrincipal={rolActorPrincipal}
              currentUserId={usuarioDb?.id}
              isUpdatingId={cambiarEstadoBarberoMutation.isPending ? cambiarEstadoBarberoMutation.variables?.id : null}
              isUpdatingGlobalId={cambiarEstadoGlobalBarberoMutation.isPending ? cambiarEstadoGlobalBarberoMutation.variables?.id : null}
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

      <FotoBarberoModal
        isOpen={Boolean(barberoAEditarFoto)}
        barbero={barberoAEditarFoto}
        onClose={() => setBarberoAEditarFoto(null)}
        onSubmit={handleGuardarFoto}
        isLoading={subirFotoAdminMutation.isPending}
        error={errorAccion}
      />
    </div>
  );
};

export default UsuariosPage;
