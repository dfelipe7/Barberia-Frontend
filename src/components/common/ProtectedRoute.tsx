
import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../../auth/AuthContext';

interface ProtectedRouteProps {
    rolesPermitidos: string[];
}

export default function ProtectedRoute({
    rolesPermitidos,
}: ProtectedRouteProps) {
    const { roles } = useAuth();

    const tienePermiso = rolesPermitidos.some(
        (rol) => roles.includes(rol),
    );

    if (!tienePermiso) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

