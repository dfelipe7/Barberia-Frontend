import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const ROLES_APP = ['SUPERADMIN', 'ADMINISTRADOR', 'BARBERO'];

const COLORES_ROL: Record<string, string> = {
    SUPERADMIN: 'danger',
    ADMINISTRADOR: 'warning',
    BARBERO: 'info',
};

export default function Header() {
    const {
        keycloak,
        nombre,
        apellido,
        roles,
    } = useAuth();

    const rolesApp = roles.filter((r) => ROLES_APP.includes(r));

    const cerrarSesion = () => {
        keycloak.logout({
            redirectUri: window.location.origin,
        });
    };

    return (
        <header>
            <nav className="navbar navbar-dark bg-dark">
                <div className="container-fluid">
                    <span className="navbar-brand mb-0 h1">
                        Barbería
                    </span>

                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-white">
                                {nombre} {apellido}
                            </span>

                            {rolesApp.map((rol) => (
                                <span key={rol} className={`badge bg-${COLORES_ROL[rol] || 'secondary'}`}>
                                    {rol}
                                </span>
                            ))}
                        </div>

                        <Link
                            className="btn btn-outline-info btn-sm"
                            to="/mi-perfil"
                        >
                            Mi Perfil
                        </Link>
                        <button
                            className="btn btn-outline-light btn-sm"
                            onClick={cerrarSesion}
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </nav>


        </header>
    );
}
