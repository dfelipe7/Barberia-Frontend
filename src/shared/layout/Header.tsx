import { Link } from 'react-router-dom';
import { Globe, User, Menu, Moon, Sun, Monitor } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { obtenerUrlFoto } from '../lib/obtenerUrlFoto';
import BrandLogo from '../ui/BrandLogo';
import { useTheme } from '../context/ThemeContext';
import { BRAND } from '../../config/brand';
import UserDropdown from './UserDropdown';
import { useUi } from '../contexts/UiContext';

const ROLES_APP = ['SUPERADMIN', 'ADMINISTRADOR', 'BARBERO'];

const NIVEL_ROL: Record<string, number> = {
    SUPERADMIN: 3,
    ADMINISTRADOR: 2,
    BARBERO: 1,
};

export default function Header() {
    const {
        keycloak,
        nombre,
        apellido,
        email,
        roles,
        usuarioDb,
    } = useAuth();
    const { theme, setTheme, isDark } = useTheme();
    const { toggleSidebar, isSidebarOpen } = useUi();

    const cycleTheme = () => {
        if (theme === 'system') setTheme('light');
        else if (theme === 'light') setTheme('dark');
        else setTheme('system');
    };

    const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
    const themeLabel = theme === 'dark' ? 'Modo oscuro (clic para cambiar)'
        : theme === 'light' ? 'Modo claro (clic para cambiar)'
        : 'Seguir sistema (clic para cambiar)';

    const rolesApp = roles.filter((r) => ROLES_APP.includes(r));
    const rolPrincipal = [...rolesApp].sort(
        (a, b) => (NIVEL_ROL[b] || 0) - (NIVEL_ROL[a] || 0)
    )[0] || roles[0] || 'USUARIO';

    const fotoUrl = obtenerUrlFoto(usuarioDb?.barbero?.fotoUrl);

    const cerrarSesion = () => {
        keycloak.logout({
            redirectUri: window.location.origin,
        });
    };

    const renderCentralAvatar = () => {
        if (fotoUrl) {
            return (
                <img
                    src={fotoUrl}
                    alt={`Foto de ${nombre || 'usuario'}`}
                    className="rounded-circle border"
                    style={{
                        width: '32px',
                        height: '32px',
                        objectFit: 'cover',
                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(12,12,12,0.15)',
                        flexShrink: 0,
                    }}
                />
            );
        }

        const iniN = (nombre || '').trim()[0] || '';
        const iniA = (apellido || '').trim()[0] || '';
        const iniciales = (iniN + iniA).toUpperCase() || 'U';

        return (
            <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold"
                style={{
                    width: '32px',
                    height: '32px',
                    fontSize: '0.75rem',
                    backgroundColor: '#0071BC',
                    color: '#FFFDFA',
                    flexShrink: 0,
                    letterSpacing: '0.04em',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,113,188,0.3)'}`,
                }}
                aria-hidden="true"
            >
                {iniciales}
            </div>
        );
    };

    return (
        <header style={{ position: 'sticky', top: 0, zIndex: 1030 }}>
            <nav
                className={`navbar ${isDark ? 'navbar-dark' : 'navbar-light'} border-bottom`}
                style={{
                    backgroundColor: 'var(--surface-chrome-bg)',
                    borderColor: 'var(--surface-chrome-border)',
                    color: 'var(--surface-chrome-text)',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
                }}
            >
                <div className="container-fluid px-2 px-sm-3 d-flex align-items-center justify-content-between">
                    {/* ── Zona izquierda — Marca + Home ── */}
                    <div className="d-flex align-items-center gap-2 gap-sm-3">
                        <button
                            id="hamburger-btn"
                            type="button"
                            onClick={toggleSidebar}
                            className={`btn btn-sm d-lg-none ${isDark ? 'btn-outline-secondary text-light' : 'btn-outline-dark'} p-1 header-action-btn`}
                            aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
                            aria-expanded={isSidebarOpen}
                            aria-controls="main-sidebar"
                        >
                            <Menu size={20} strokeWidth={2} />
                        </button>

                        <Link
                            to="/dashboard"
                            className="navbar-brand d-flex align-items-center py-0 me-0"
                            aria-label={`Ir al dashboard de ${BRAND.name}`}
                        >
                            <BrandLogo
                                variant={isDark ? 'white' : 'black'}
                                height={30}
                                className="brand-logo-header"
                                alt={BRAND.name}
                            />
                        </Link>

                        <Link
                            to="/"
                            className={`btn btn-sm ${isDark ? 'btn-outline-secondary text-light' : 'btn-outline-dark'} d-inline-flex align-items-center gap-1 header-action-btn`}
                            title="Ir al sitio público"
                            aria-label="Ir al sitio público"
                        >
                            <Globe size={15} strokeWidth={2} />
                            <span className="d-none d-sm-inline" style={{ fontSize: '0.825rem' }}>
                                Sitio público
                            </span>
                        </Link>
                    </div>

                    {/* ── Zona central — Identidad del usuario (oculta en móvil y tablets < 992px) ── */}
                    <div className="d-none d-lg-flex align-items-center gap-2">
                        {renderCentralAvatar()}
                        <span
                            className="fw-semibold text-truncate"
                            style={{
                                fontSize: '0.875rem',
                                maxWidth: '200px',
                                color: isDark ? '#FFFDFA' : '#0C0C0C',
                            }}
                        >
                            {nombre} {apellido}
                        </span>
                        <span
                            className="badge font-display"
                            style={{
                                backgroundColor: isDark ? 'rgba(0, 113, 188, 0.2)' : 'rgba(0, 113, 188, 0.1)',
                                color: isDark ? '#38bdf8' : '#0071BC',
                                border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(0, 113, 188, 0.25)'}`,
                                fontSize: '0.68rem',
                                letterSpacing: '0.06em',
                                fontWeight: 700,
                                padding: '0.25rem 0.55rem',
                                borderRadius: '3px',
                            }}
                        >
                            {rolPrincipal}
                        </span>
                    </div>

                    {/* ── Zona derecha — Acciones ── */}
                    <div className="d-flex align-items-center gap-2">
                        <button
                            type="button"
                            onClick={cycleTheme}
                            className={`btn btn-sm ${isDark ? 'btn-outline-secondary text-light' : 'btn-outline-dark'} d-inline-flex align-items-center gap-1 header-action-btn`}
                            title={themeLabel}
                            aria-label={themeLabel}
                        >
                            <ThemeIcon size={15} strokeWidth={2} />
                        </button>

                        <Link
                            to="/mi-perfil"
                            className={`btn btn-sm ${isDark ? 'btn-outline-secondary text-light' : 'btn-outline-dark'} d-inline-flex align-items-center gap-1 header-action-btn`}
                            title="Mi Perfil"
                            aria-label="Ir a Mi Perfil"
                        >
                            <User size={15} strokeWidth={2} />
                            <span className="d-none d-md-inline" style={{ fontSize: '0.825rem' }}>
                                Mi Perfil
                            </span>
                        </Link>

                        <UserDropdown
                            nombre={nombre}
                            apellido={apellido}
                            email={email}
                            roles={roles}
                            fotoUrl={fotoUrl}
                            isDark={isDark}
                            onCerrarSesion={cerrarSesion}
                        />
                    </div>
                </div>
            </nav>
        </header>
    );
}
