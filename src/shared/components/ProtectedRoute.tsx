import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import KyriosSpinner from '../ui/KyriosSpinner';

interface ProtectedRouteProps {
  rolesPermitidos: string[];
}

/**
 * PATRÓN DECORATOR:
 * Envuelve el renderizado de la ruta (<Outlet />) decorándolo con validaciones
 * de autenticación (Keycloak) y de autorización RBAC (rolesPermitidos).
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

  const tienePermiso = rolesPermitidos.some((rol) => roles.includes(rol));

  if (!tienePermiso || usuarioDb?.estado === 'INACTIVO') {
    return <Navigate to="/sin-acceso" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
