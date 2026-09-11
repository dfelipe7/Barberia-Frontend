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
        usuarioDb,
    } = useAuth();

    const rolesApp = roles.filter((r) => ROLES_APP.includes(r));

    const fotoUrl = usuarioDb?.barbero?.fotoUrl
        ? (usuarioDb.barbero.fotoUrl.startsWith('http')
            ? usuarioDb.barbero.fotoUrl
            : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${usuarioDb.barbero.fotoUrl}`)
        : null;

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
                            {fotoUrl && (
                                <img
                                    src={fotoUrl}
                                    alt="Foto"
                                    className="rounded-circle border border-1 border-white me-1"
                                    style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                />
                            )}
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
