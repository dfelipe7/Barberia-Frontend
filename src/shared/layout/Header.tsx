import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { obtenerUrlFoto } from '../lib/obtenerUrlFoto';
import BrandLogo from '../ui/BrandLogo';
import { useSystemTheme } from '../lib/useSystemTheme';
import { BRAND } from '../../config/brand';

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
    const systemTheme = useSystemTheme();
    const isDark = systemTheme === 'dark';

    const rolesApp = roles.filter((r) => ROLES_APP.includes(r));
    const fotoUrl = obtenerUrlFoto(usuarioDb?.barbero?.fotoUrl);

    const cerrarSesion = () => {
        keycloak.logout({
            redirectUri: window.location.origin,
        });
    };

    return (
        <header style={{ position: 'sticky', top: 0, zIndex: 1030 }}>
            <nav
                className={`navbar ${isDark ? 'navbar-dark bg-dark' : 'navbar-light bg-white'} border-bottom shadow-sm`}
                style={{
                    backgroundColor: isDark ? 'var(--brand-black, #0C0C0C)' : 'var(--brand-white, #FFFDFA)',
                    borderColor: isDark ? '#222222' : '#e5e3dc',
                    transition: 'background-color 0.25s ease, border-color 0.25s ease',
                }}
            >
                <div className="container-fluid d-flex align-items-center justify-content-between">
                    <Link
                        to="/"
                        className="navbar-brand mb-0 d-flex align-items-center py-1"
                        aria-label={`Ir al inicio de ${BRAND.name}`}
                    >
                        {/* Se usa el logo real con detección automática de tema:
                            fondo oscuro -> logo-white
                            fondo claro  -> logo-black
                        */}
                        <BrandLogo
                            variant={isDark ? 'white' : 'black'}
                            height={30}
                            alt={BRAND.name}
                        />
                    </Link>

                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center gap-2">
                            {fotoUrl && (
                                <img
                                    src={fotoUrl}
                                    alt={`Foto de ${nombre || 'usuario'}`}
                                    className="rounded-circle border border-1 me-1"
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        objectFit: 'cover',
                                        borderColor: isDark ? '#ffffff' : '#0C0C0C',
                                    }}
                                />
                            )}
                            <span className={isDark ? 'text-white' : 'text-dark'}>
                                {nombre} {apellido}
                            </span>

                            {rolesApp.map((rol) => (
                                <span key={rol} className={`badge bg-${COLORES_ROL[rol] || 'secondary'}`}>
                                    {rol}
                                </span>
                            ))}
                        </div>

                        <Link
                            className={`btn btn-sm ${isDark ? 'btn-outline-info' : 'btn-outline-primary'}`}
                            to="/mi-perfil"
                        >
                            Mi Perfil
                        </Link>
                        <button
                            className={`btn btn-sm ${isDark ? 'btn-outline-light' : 'btn-outline-secondary'}`}
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
