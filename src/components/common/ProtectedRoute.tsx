import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../../auth/AuthContext';

interface ProtectedRouteProps {
    rolesPermitidos: string[];
}

export default function ProtectedRoute({
    rolesPermitidos,
}: ProtectedRouteProps) {
    const { roles, isAuthenticated, keycloak } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            keycloak.login();
        }
    }, [isAuthenticated, keycloak]);

    if (!isAuthenticated) {
        return null;
    }

    const tienePermiso = rolesPermitidos.some(
        (rol) => roles.includes(rol),
    );

    if (!tienePermiso) {
        return <Navigate to="/sin-acceso" replace />;
    }

    return <Outlet />;
}

