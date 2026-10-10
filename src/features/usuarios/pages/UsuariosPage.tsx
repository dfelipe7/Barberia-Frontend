import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Scissors } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';
import Spinner from '../../../shared/ui/Spinner';
import KyriosSpinner from '../../../shared/ui/KyriosSpinner';
import ErrorMessage from '../../../shared/ui/ErrorMessage';
import { mapApiError } from '../../../shared/lib/mapApiError';
import { useToast } from '../../../shared/lib/useToast';
import { ToastContainer } from '../../../shared/ui/ToastContainer';
import { useDebounce } from '../../../shared/lib/useDebounce';
import { useConfirm } from '../../../shared/contexts/ConfirmContext';

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

  // Búsqueda debounced para administradores y barberos
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const debouncedBusqueda = useDebounce(filtroBusqueda, 350);

  const administradoresFiltrados = useMemo(() => {
    if (!debouncedBusqueda.trim()) return administradores;
    const q = debouncedBusqueda.toLowerCase().trim();
    return administradores.filter((a) =>
      `${a.nombre} ${a.apellido} ${a.email}`.toLowerCase().includes(q)
    );
  }, [administradores, debouncedBusqueda]);

  const barberosFiltrados = useMemo(() => {
    if (!debouncedBusqueda.trim()) return barberos;
    const q = debouncedBusqueda.toLowerCase().trim();
    return barberos.filter((b) =>
      `${b.nombre} ${b.apellido} ${b.email}`.toLowerCase().includes(q)
    );
  }, [barberos, debouncedBusqueda]);

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
  const { toast, showToast, hideToast } = useToast(4000);
  const confirm = useConfirm();

  useEffect(() => {
    const mensaje = location.state?.mensaje as string | undefined;
    if (!mensaje) return;
    showToast('success', mensaje);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state?.mensaje, location.pathname, navigate, showToast]);

  // Handlers
  const handleVerDetalles = (entity: AdministradorGestion | BarberoGestion) => {
    setUsuarioDetalle(usuariosMapper.toDetalleDomain(entity));
  };

  const handleCambiarEstadoAdmin = async (id: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => {
    const admin = administradores.find((a) => a.id === id);
    const nombre = admin ? `${admin.nombre} ${admin.apellido}` : 'este usuario';

    if (nuevoEstado === 'INACTIVO') {
      const ok = await confirm({
        title: '¿Desactivar rol de administrador?',
        message: `¿Desactivar rol de administrador de ${nombre}?`,
        variant: 'warning',
        confirmLabel: 'Desactivar',
      });
      if (!ok) return;
    }

    try {
      await cambiarEstadoAdminMutation.mutateAsync({ id, datos: { estado: nuevoEstado } });
      showToast('success', 'El estado del usuario se actualizó correctamente.');
    } catch (err: unknown) {
      showToast('danger', mapApiError(err));
    }
  };

  const handleCambiarEstadoGlobalAdmin = async (
    id: number,
    nuevoEstado: 'ACTIVO' | 'INACTIVO'
  ) => {
    const admin = administradores.find((a) => a.id === id);
    const nombre = admin ? `${admin.nombre} ${admin.apellido}` : 'este usuario';

    if (nuevoEstado === 'INACTIVO') {
      const ok = await confirm({
        title: '¿Bloquear cuenta?',
        message: `¿Bloquear cuenta completa de ${nombre}? No podrá iniciar sesión.`,
        variant: 'danger',
        confirmLabel: 'Bloquear',
      });
      if (!ok) return;
    }

    try {
      await cambiarEstadoGlobalAdminMutation.mutateAsync({ id, datos: { estado: nuevoEstado } });
      showToast(
        'success',
        nuevoEstado === 'ACTIVO'
          ? 'Cuenta desbloqueada correctamente.'
          : 'Cuenta bloqueada globalmente.'
      );
    } catch (err) {
      showToast('danger', mapApiError(err));
    }
  };

  const handleCambiarEstadoBarbero = async (id: number, nuevoEstado: 'ACTIVO' | 'INACTIVO') => {
    const barbero = barberos.find((b) => b.id === id);
    const nombre = barbero ? `${barbero.nombre} ${barbero.apellido}` : 'este usuario';

    if (nuevoEstado === 'INACTIVO') {
      const ok = await confirm({
        title: '¿Desactivar rol de barbero?',
        message: `¿Desactivar rol de barbero de ${nombre}?`,
        variant: 'warning',
        confirmLabel: 'Desactivar',
      });
      if (!ok) return;
    }

    try {
      await cambiarEstadoBarberoMutation.mutateAsync({ id, datos: { estado: nuevoEstado } });
      showToast('success', 'El estado del usuario se actualizó correctamente.');
    } catch (err: unknown) {
      showToast('danger', mapApiError(err));
    }
  };

  const handleCambiarEstadoGlobalBarbero = async (
    id: number,
    nuevoEstado: 'ACTIVO' | 'INACTIVO'
  ) => {
    const barbero = barberos.find((b) => b.id === id);
    const nombre = barbero ? `${barbero.nombre} ${barbero.apellido}` : 'este usuario';

    if (nuevoEstado === 'INACTIVO') {
      const ok = await confirm({
        title: '¿Bloquear cuenta?',
        message: `¿Bloquear cuenta completa de ${nombre}?`,
        variant: 'danger',
        confirmLabel: 'Bloquear',
      });
      if (!ok) return;
    }

    try {
      await cambiarEstadoGlobalBarberoMutation.mutateAsync({ id, datos: { estado: nuevoEstado } });
      showToast(
        'success',
        nuevoEstado === 'ACTIVO'
          ? 'Cuenta desbloqueada correctamente.'
          : 'Cuenta bloqueada globalmente.'
      );
    } catch (err) {
      showToast('danger', mapApiError(err));
    }
  };

  const handleGuardarComision = async (barberoId: number, porcentaje: number) => {
    try {
      await actualizarComisionMutation.mutateAsync({
        id: barberoId,
        datos: { porcentajeComision: porcentaje },
      });
      setBarberoAEditarComision(null);
      showToast('success', 'La comisión del barbero se actualizó correctamente.');
    } catch (err: unknown) {
      showToast('danger', mapApiError(err));
    }
  };

  const handleGuardarFoto = async (barberoId: number, file: File) => {
    try {
      await subirFotoAdminMutation.mutateAsync({ id: barberoId, file });
      setBarberoAEditarFoto(null);
      showToast('success', 'La foto del barbero se actualizó correctamente.');
    } catch (err: unknown) {
      showToast('danger', mapApiError(err));
    }
  };

  const handleGuardarPerfilBarbero = async (datos: ConfigurarBarberoFormValues) => {
    try {
      if (adminAConfigurar) {
        await configurarBarberoMutation.mutateAsync({
          id: adminAConfigurar.id,
          datos: { telefono: datos.telefono, porcentajeComision: datos.porcentajeComision },
        });
        setAdminAConfigurar(null);
        showToast('success', 'Perfil de barbero configurado correctamente.');
      } else {
        await configurarMeMutation.mutateAsync(datos);
        window.location.reload();
      }
    } catch (err: unknown) {
      showToast('danger', mapApiError(err));
    }
  };


  return (
    <div className="usuarios-page-container">
      {/* Header con contexto claro */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3">
        <div>
          <span className="text-eyebrow mb-2 d-block">Panel de control</span>
          <h1 className="h2 fw-bold mb-1">Gestión de Usuarios</h1>
          <p className="text-muted mb-0">
            Administra administradores, barberos, roles y el estado de cada cuenta.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 pt-1 w-100 w-sm-auto">
          {esSuperAdmin && pestañaActiva === 'administradores' && (
            <Link to="/administradores/nuevo" className="btn btn-dark btn-sm fw-semibold w-100 w-sm-auto text-center">
              + Nuevo Administrador
            </Link>
          )}

          {pestañaActiva === 'barberos' && (
            <Link to="/barberos/nuevo" className="btn btn-dark btn-sm fw-semibold w-100 w-sm-auto text-center">
              + Nuevo Barbero
            </Link>
          )}
        </div>
      </div>

      <ToastContainer toast={toast} onClose={hideToast} />

      {/* Pestañas de Navegación (Pill tabs / Segmented control) */}
      <div
        className="d-flex flex-nowrap gap-2 p-1 rounded bg-surface-app border mb-4 usuarios-tabs-container overflow-x-auto"
        role="tablist"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {esSuperAdmin && (
          <button
            type="button"
            role="tab"
            aria-selected={pestañaActiva === 'administradores'}
            className={`btn btn-sm px-3 py-2 fw-semibold rounded d-inline-flex align-items-center gap-2 text-nowrap flex-shrink-0 ${
              pestañaActiva === 'administradores'
                ? 'btn-dark'
                : 'btn-light text-muted'
            }`}
            onClick={() => {
              setPestañaActiva('administradores');
            }}
          >
            <Shield size={16} />
            <span>Administradores</span>
            <span className={`badge ms-2 ${pestañaActiva === 'administradores' ? 'bg-secondary' : 'bg-secondary-subtle text-secondary-emphasis'}`}>
              {administradores.length}
            </span>
          </button>
        )}
        <button
          type="button"
          role="tab"
          aria-selected={pestañaActiva === 'barberos'}
          className={`btn btn-sm px-3 py-2 fw-semibold rounded d-inline-flex align-items-center gap-2 text-nowrap flex-shrink-0 ${
            pestañaActiva === 'barberos'
              ? 'btn-dark'
              : 'btn-light text-muted'
          }`}
          onClick={() => {
            setPestañaActiva('barberos');
          }}
        >
          <Scissors size={16} />
          <span>Barberos</span>
          <span className={`badge ms-2 ${pestañaActiva === 'barberos' ? 'bg-secondary' : 'bg-secondary-subtle text-secondary-emphasis'}`}>
            {barberos.length}
          </span>
        </button>
      </div>

      {/* ── Barra de búsqueda debounced para usuarios ── */}
      <div className="mb-4" style={{ maxWidth: '440px' }}>
        <div className="position-relative">
          <input
            type="text"
            className="form-control pe-5"
            placeholder={`Buscar en ${pestañaActiva === 'administradores' ? 'administradores' : 'barberos'} por nombre o correo...`}
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            style={{
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
            aria-label="Buscar usuarios"
          />

          {filtroBusqueda !== debouncedBusqueda && (
            <div
              className="position-absolute end-0 top-50 translate-middle-y me-3 d-flex align-items-center"
              style={{ pointerEvents: 'none' }}
              title="Filtrando..."
            >
              <KyriosSpinner size="xs" aria-hidden="true" />
            </div>
          )}
        </div>

        {filtroBusqueda !== debouncedBusqueda && (
          <div
            className="text-surface-muted small mt-1 ms-1"
            style={{ fontSize: '0.75rem', animation: 'fadeInSpinner 120ms ease-out' }}
          >
            Buscando...
          </div>
        )}
      </div>

      {/* Contenido según pestaña con microinteracción de transición */}
      <div key={pestañaActiva} className="usuarios-tab-pane">
        {pestañaActiva === 'administradores' && (
          <>
            {/* Hint explicativo Administradores */}
            <div className="alert alert-light border d-flex align-items-center gap-2 mb-3 py-2 px-3 small text-muted shadow-sm" role="note">
              <span className="fs-5" aria-hidden="true">💡</span>
              <span>
                Los administradores tienen acceso a los módulos de gestión. Puedes desactivar su <strong>rol</strong> sin bloquear su cuenta global.
              </span>
            </div>

            {errorAdmins && (
              <ErrorMessage
                message={errorAdmins.message || 'Error cargando administradores'}
                onRetry={refetchAdmins}
              />
            )}

            {cargandoAdmins ? (
              <Spinner mensaje="Cargando administradores..." />
            ) : administradoresFiltrados.length === 0 && debouncedBusqueda ? (
              <div className="alert-surface text-center py-5 px-3 text-surface-muted border rounded">
                <p className="mb-2 fs-6 fw-semibold text-surface-card">
                  No se encontraron administradores que coincidan con "{debouncedBusqueda}".
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setFiltroBusqueda('')}
                >
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              <UserTable
                administradores={administradoresFiltrados}
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
            {/* Hint explicativo Barberos */}
            <div className="alert alert-light border d-flex align-items-center gap-2 mb-3 py-2 px-3 small text-muted shadow-sm" role="note">
              <span className="fs-5" aria-hidden="true">💡</span>
              <span>
                Los barberos activos aparecen en el catálogo público. El <strong>% de comisión</strong> aplica a sus servicios. Puedes desactivar el rol sin bloquear su cuenta.
              </span>
            </div>

            {errorBarberos && (
              <ErrorMessage
                message={errorBarberos.message || 'Error cargando barberos'}
                onRetry={refetchBarberos}
              />
            )}

            {cargandoBarberos ? (
              <Spinner mensaje="Cargando barberos de gestión..." />
            ) : barberosFiltrados.length === 0 && debouncedBusqueda ? (
              <div className="alert-surface text-center py-5 px-3 text-surface-muted border rounded">
                <p className="mb-2 fs-6 fw-semibold text-surface-card">
                  No se encontraron barberos que coincidan con "{debouncedBusqueda}".
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setFiltroBusqueda('')}
                >
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              <BarberoTable
                barberos={barberosFiltrados}
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
      </div>

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
        error={null}
      />

      <CommissionModal
        isOpen={Boolean(barberoAEditarComision)}
        barbero={barberoAEditarComision}
        onClose={() => setBarberoAEditarComision(null)}
        onSubmit={handleGuardarComision}
        isLoading={actualizarComisionMutation.isPending}
        error={null}
      />

      <FotoBarberoModal
        isOpen={Boolean(barberoAEditarFoto)}
        barbero={barberoAEditarFoto}
        onClose={() => setBarberoAEditarFoto(null)}
        onSubmit={handleGuardarFoto}
        isLoading={subirFotoAdminMutation.isPending}
        error={null}
      />
    </div>
  );
};

export default UsuariosPage;
