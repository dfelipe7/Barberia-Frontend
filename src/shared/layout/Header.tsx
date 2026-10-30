import { Link } from 'react-router-dom';
import { Globe, User, Menu, Moon, Sun, Monitor } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { obtenerUrlFoto } from '../lib/obtenerUrlFoto';
import { obtenerNegocioSlugActivo } from '../lib/http/axios';
import BrandLogo from '../ui/BrandLogo';
import { useTheme } from '../context/ThemeContext';
import { BRAND } from '../../config/brand';
import UserDropdown from './UserDropdown';
import { useUi } from '../contexts/UiContext';
import { ROLES_APP, ROL_HIERARCHY } from '../constants/roles';
import UserAvatar from '../ui/atoms/UserAvatar';
import RoleBadge from '../ui/atoms/RoleBadge';

export default function Header() {
  const { cerrarSesion, nombre, apellido, email, roles, usuarioDb, fotoUrl: fotoGoogle } = useAuth();
  const slugActivo = obtenerNegocioSlugActivo() || localStorage.getItem('negocio_slug') || 'kyrios-studio';
  const rutaSitioPublico = `/${slugActivo}`;
  const { theme, setTheme, isDark } = useTheme();
  const { toggleSidebar, isSidebarOpen } = useUi();

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const themeLabel =
    theme === 'dark'
      ? 'Modo oscuro (clic para cambiar)'
      : theme === 'light'
        ? 'Modo claro (clic para cambiar)'
        : 'Seguir sistema (clic para cambiar)';

  const rolesApp = roles.filter((r) => (ROLES_APP as readonly string[]).includes(r));
  const rolPrincipal =
    [...rolesApp].sort(
      (a, b) =>
        (ROL_HIERARCHY[b as keyof typeof ROL_HIERARCHY] || 0) -
        (ROL_HIERARCHY[a as keyof typeof ROL_HIERARCHY] || 0),
    )[0] ||
    roles[0] ||
    'USUARIO';

  // Prioridad: 1° Foto de barbero subida a la base de datos -> 2° Foto de Google de la sesión -> 3° null
  const fotoUrl = obtenerUrlFoto(usuarioDb?.barbero?.fotoUrl) || fotoGoogle || null;

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
              to={rutaSitioPublico}
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
            <UserAvatar nombre={nombre} apellido={apellido} fotoUrl={fotoUrl} size={32} />
            <span
              className="fw-semibold text-truncate text-surface-app"
              style={{
                fontSize: '0.875rem',
                maxWidth: '200px',
              }}
            >
              {nombre} {apellido}
            </span>
            <RoleBadge rol={rolPrincipal} />
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
