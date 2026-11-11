import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import KyriosSpinner from '../ui/KyriosSpinner';

import { esRolApp } from '../lib/autorizacion/roles';

/**
 * Propiedades del componente `ProtectedRoute`.
 */
export interface ProtectedRouteProps {
  /**
   * Colección de nombres de roles del sistema autorizados para visualizar esta ruta.
   * Ej: `['SUPERADMIN', 'ADMINISTRADOR']` o `['BARBERO']`.
   */
  rolesPermitidos: string[];
}

/**
 * PATRÓN DECORATOR / ROUTE GUARD:
 * Intercepta y decora el renderizado de subrutas (`<Outlet />`) aplicando una
 * cadena de defensas en profundidad:
 *
 * @remarks
 * **Cadena de Validación:**
 * 1. **Inicialización Asíncrona:** Si la sesión aún se está verificando en almacenamiento local,
 *    despliega el spinner `KyriosSpinner` evitando parpadeos de redirección no autorizada.
 * 2. **Autenticación (JWT + OAuth):** Si no existe una sesión activa, redirige inmediatamente
 *    a la pantalla de login correspondiente (`/{slug}/login` o `/login`).
 * 3. **Aislamiento Multitenant:** Si la URL apunta a una barbería (`/{slug}/...`), valida que
 *    el token del usuario pertenezca a la misma barbería mediante `esStaffDeSede(slug)`.
 * 4. **Estado de Cuenta Activo:** Si el usuario tiene estado `INACTIVO` (suspendido),
 *    lo redirige a `/sin-acceso`.
 * 5. **Autorización RBAC:** Verifica que al menos uno de los roles del usuario se encuentre
 *    en `rolesPermitidos`. Si tiene un rol válido pero no los permisos para esa sección
 *    (ej. un Barbero intentando entrar a Configuración), lo redirige a `/dashboard` con un aviso informativo.
 *
 * @param props - Propiedades con la lista de roles autorizados.
 * @returns El componente de salida anidado (`<Outlet />`) o una redirección (`<Navigate />`).
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ rolesPermitidos }) => {
  const { roles, isAuthenticated, isInitializing, usuarioDb, esStaffDeSede } = useAuth();
  const { slug } = useParams<{ slug?: string }>();

  // Mientras se inicializa el estado de autenticación, mostrar un fallback NO bloqueante
  if (isInitializing) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <KyriosSpinner size="md" mensaje="Verificando sesión..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={slug ? `/${slug}/login` : '/login'} replace />;
  }

  // Verificación multitenant: Si la URL indica una sede específica, verificar que la sesión pertenezca a esa sede
  if (slug && !esStaffDeSede(slug)) {
    return (
      <Navigate
        to={`/${slug}/login`}
        replace
        state={{
          avisoAcceso: 'Tu cuenta actual no pertenece al personal de esta barbería. Inicia sesión con la cuenta autorizada.',
        }}
      />
    );
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
