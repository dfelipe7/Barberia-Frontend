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

    const rolApp = roles.find((r) => ROLES_APP.includes(r));
    const colorRol = rolApp ? COLORES_ROL[rolApp] : 'secondary';

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

                            {rolApp && (
                                <span className={`badge bg-${colorRol}`}>
                                    {rolApp}
                                </span>
                            )}
                        </div>

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
