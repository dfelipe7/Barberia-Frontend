import { useAuth } from '../../auth/AuthContext';

export default function Navbar() {
    const {
        keycloak,
        nombre,
        apellido,
    } = useAuth();

    const cerrarSesion = () => {
        keycloak.logout({
            redirectUri: window.location.origin,
        });
    };

    return (
        <nav className="navbar navbar-dark bg-dark">
            <div className="container-fluid">
                <span className="navbar-brand mb-0 h1">
                    Barbería
                </span>

                <div className="d-flex align-items-center gap-3">
                    <span className="text-white">
                        {nombre} {apellido}
                    </span>

                    <button
                        className="btn btn-outline-light btn-sm"
                        onClick={cerrarSesion}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </nav>
    );
}