import { Link } from 'react-router-dom';
import { Globe, Menu, Moon, Sun, Monitor } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { obtenerUrlFoto } from '../lib/obtenerUrlFoto';
import { obtenerNegocioSlugActivo } from '../lib/http/axios';
import BrandLogo from '../ui/BrandLogo';
import { useTheme } from '../context/ThemeContext';
import { BRAND } from '../../config/brand';
import UserDropdown from './UserDropdown';
import { useUi } from '../contexts/UiContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { ROLES_APP, ROL_HIERARCHY } from '../constants/roles';
import UserAvatar from '../ui/atoms/UserAvatar';
import RoleBadge from '../ui/atoms/RoleBadge';
import WhatsAppStatusIndicator from './WhatsAppStatusIndicator';

export default function Header() {
  const { cerrarSesion, nombre, apellido, email, roles, usuarioDb, fotoUrl: fotoGoogle } = useAuth();
  const confirm = useConfirm();
  const slugActivo = obtenerNegocioSlugActivo() || localStorage.getItem('negocio_slug') || 'kyrios-studio';
  const rutaSitioPublico = `/${slugActivo}`;
  const { theme, setTheme, isDark } = useTheme();
  const { toggleSidebar, isSidebarOpen } = useUi();

  const handleCerrarSesion = async () => {
    const aceptado = await confirm({
      title: 'Cerrar sesión',
      message: '¿Estás seguro de que deseas salir del panel de administración?',
      confirmLabel: 'Cerrar sesión',
      cancelLabel: 'Cancelar',
      variant: 'warning',
    });
    if (aceptado) {
      cerrarSesion(slugActivo);
    }
  };

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
        <div className="container-fluid px-2 px-sm-3 d-flex align-items-center justify-content-between flex-nowrap min-w-0">
          {/* ── Zona izquierda — Marca + Menú Hamburguesa ── */}
          <div className="d-flex align-items-center gap-2 min-w-0 flex-shrink-0">
            <button
              id="hamburger-btn"
              type="button"
              onClick={toggleSidebar}
              className={`btn btn-sm d-lg-none ${isDark ? 'btn-outline-secondary text-light' : 'btn-outline-dark'} header-action-btn touch-target`}
              aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isSidebarOpen}
              aria-controls="main-sidebar"
            >
              <Menu size={20} strokeWidth={2} />
            </button>

            <Link
              to={slugActivo ? `/${slugActivo}/dashboard` : "/dashboard"}
              className="navbar-brand d-flex align-items-center py-0 me-0 min-w-0"
              aria-label={`Ir al dashboard de ${BRAND.name}`}
            >
              <BrandLogo
                variant={isDark ? 'white' : 'black'}
                height={28}
                className="brand-logo-header flex-shrink-0"
                alt={BRAND.name}
              />
            </Link>
          </div>

          {/* ── Zona central — Identidad del usuario (centrada y visible en pantallas grandes >= 1200px) ── */}
          <div className="d-none d-xl-flex align-items-center gap-2 mx-auto px-3 min-w-0">
            <UserAvatar nombre={nombre} apellido={apellido} fotoUrl={fotoUrl} size={32} />
            <span
              className="fw-semibold text-truncate text-surface-app"
              style={{
                fontSize: '0.875rem',
                maxWidth: '180px',
              }}
            >
              {nombre} {apellido}
            </span>
            <RoleBadge rol={rolPrincipal} className="ms-1" />
          </div>

          {/* ── Zona derecha — Acciones ── */}
          <div className="d-flex align-items-center gap-1 gap-sm-2 flex-shrink-0 ms-auto">
            {/* Sitio público en zona de acciones (icono compacto en tablet, expande en desktop) */}
            <Link
              to={rutaSitioPublico}
              className={`btn btn-sm ${isDark ? 'btn-outline-secondary text-light' : 'btn-outline-dark'} d-none d-sm-inline-flex align-items-center gap-1 header-action-btn`}
              title="Ir al sitio público"
              aria-label="Ir al sitio público"
            >
              <Globe size={15} strokeWidth={2} />
              <span className="d-none d-xxl-inline" style={{ fontSize: '0.825rem' }}>
                Sitio público
              </span>
            </Link>

            <WhatsAppStatusIndicator />

            <button
              type="button"
              onClick={cycleTheme}
              className={`btn btn-sm ${isDark ? 'btn-outline-secondary text-light' : 'btn-outline-dark'} d-none d-sm-inline-flex align-items-center gap-1 header-action-btn`}
              title={themeLabel}
              aria-label={themeLabel}
            >
              <ThemeIcon size={15} strokeWidth={2} />
            </button>

            <UserDropdown
              nombre={nombre}
              apellido={apellido}
              email={email}
              roles={roles}
              fotoUrl={fotoUrl}
              isDark={isDark}
              onCerrarSesion={handleCerrarSesion}
            />
          </div>
        </div>
      </nav>
    </header>
  );
}
