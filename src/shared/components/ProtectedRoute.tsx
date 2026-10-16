import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import KyriosSpinner from '../ui/KyriosSpinner';

import { esRolApp } from '../lib/autorizacion/roles';

interface ProtectedRouteProps {
  rolesPermitidos: string[];
}

/**
 * PATRÓN DECORATOR:
 * Envuelve el renderizado de la ruta (<Outlet />) decorándolo con validaciones
 * de autenticación (Google OAuth + JWT) y de autorización RBAC (rolesPermitidos).
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ rolesPermitidos }) => {
  const { roles, isAuthenticated, isInitializing, usuarioDb } = useAuth();

  // Mientras se inicializa el estado de autenticación, mostrar un fallback NO bloqueante
  if (isInitializing) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <KyriosSpinner size="md" mensaje="Verificando sesión..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 1. Cuenta bloqueada globalmente
  if (usuarioDb?.estado === 'INACTIVO') {
    return <Navigate to="/sin-acceso" replace />;
  }

  // 2. Usuario sin ningún rol del sistema asignado
  const tieneRolApp = roles.some((rol) => esRolApp(rol));
  if (!tieneRolApp) {
    return <Navigate to="/sin-acceso" replace />;
  }

  // 3. Verificación de permiso para la ruta actual
  const tienePermiso = rolesPermitidos.some((rol) => roles.includes(rol));
  if (!tienePermiso) {
    // Si el usuario tiene un rol activo (ej. Barbero) pero no para esta vista administrativa,
    // se le redirige a su Dashboard con aviso en vez de bloquearlo en /sin-acceso
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{
          avisoAcceso:
            'No tienes los permisos necesarios para acceder a esa sección. Te hemos redirigido a tu panel principal.',
        }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
