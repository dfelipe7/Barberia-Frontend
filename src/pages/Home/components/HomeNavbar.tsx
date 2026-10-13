import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, LayoutDashboard, Moon, Sun, Monitor, LogOut, User } from 'lucide-react';
import BrandLogo from '../../../shared/ui/BrandLogo';
import { BRAND } from '../../../config/brand';
import { MenuIcon, CloseIcon } from './HomeIcons';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useAuth } from '../../../auth/AuthContext';
import { useBodyScrollLock } from '../../../shared/lib/useBodyScrollLock';
import { esRolApp } from '../../../shared/lib/autorizacion/roles';
import { ProductosEnDesarrolloModal } from './ProductosEnDesarrolloModal';

/* ─── Hook: detecta si el usuario hizo scroll más allá de un umbral ─────── */
function useScrolled(threshold = 40): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [threshold]);
  return scrolled;
}



/* ─── Avatar con iniciales + indicador online ───────────────────────────── */
const UserAvatar: React.FC<{ nombre?: string | null; apellido?: string | null; online?: boolean }> = ({ nombre, apellido, online }) => {
  const iniN = (nombre || '').trim()[0] || '';
  const iniA = (apellido || '').trim()[0] || '';
  const initials = (iniN + iniA).toUpperCase() || (nombre || '').trim().slice(0, 2).toUpperCase();
  if (!initials) return null;
  return (
    <span className="kyrios-nav-avatar" aria-hidden="true">
      {initials}
      {online && <span className="kyrios-nav-avatar__dot" />}
    </span>
  );
};

/* ─── Props ─────────────────────────────────────────────────────────────── */
interface HomeNavbarProps {
  isAuthenticated?: boolean;
  nombre?: string | null;
  onLogin?: () => void;
}

/* ─── Componente principal ──────────────────────────────────────────────── */
export const HomeNavbar: React.FC<HomeNavbarProps> = ({
  isAuthenticated: propIsAuthenticated,
  nombre: propNombre,
  onLogin: propOnLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productosModalOpen, setProductosModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const enHome = location.pathname === '/';

  const navLinks = useMemo(() => {
    const base = [
      { id: 'servicios', to: '/catalogo/servicios', label: 'Servicios' },
      { id: 'barberos',  to: '/catalogo/barberos',  label: 'Barberos'  },
      { id: 'productos', to: null,                  label: 'Productos' },
    ];
    return enHome
      ? base
      : [{ id: 'inicio', to: '/', label: 'Inicio' }, ...base];
  }, [enHome]);

  const { theme, setTheme, isDark } = useTheme();
  const {
    isAuthenticated: authIsAuthenticated,
    isInitializing,
    nombre: authNombre,
    apellido: authApellido,
    cerrarSesion,
    roles,
    usuarioDb,
  } = useAuth();

  const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : authIsAuthenticated;
  const nombre = propNombre !== undefined ? propNombre : authNombre;
  const apellido = authApellido;
  const onLogin = propOnLogin || (() => navigate('/login'));
  const tieneAcceso = roles.some(esRolApp) && usuarioDb?.estado === 'ACTIVO';

  // Solo mostramos avatar si la sesión está resuelta Y autenticada Y el
  // usuario existe en la BD local (evita parpadeos con estado parcial).
  const mostrarAvatar =
    !isInitializing &&
    isAuthenticated === true &&
    Boolean(usuarioDb);

  const displayName =
    nombre && apellido ? `${nombre} ${apellido}` : (nombre ?? '');

  const scrolled = useScrolled(40);

  useBodyScrollLock(mobileMenuOpen);

  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((p) => !p), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Cicla: system → light → dark → system (igual que Header.tsx)
  const cycleTheme = useCallback(() => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  }, [theme, setTheme]);

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const themeLabel =
    theme === 'dark'   ? 'Modo oscuro (clic para cambiar)' :
    theme === 'light'  ? 'Modo claro (clic para cambiar)'  :
                         'Seguir sistema (clic para cambiar)';

  // Cierra el drawer antes de cerrar sesión para evitar estado zombie en móvil
  const handleLogout = useCallback(() => {
    closeMobileMenu();
    cerrarSesion();
  }, [closeMobileMenu, cerrarSesion]);

  const mobileMenuId = 'home-mobile-menu';

  return (
    <header
      className={`kyrios-nav${scrolled ? ' is-scrolled' : ''}`}
      role="banner"
    >
      <div className="container py-2 d-flex align-items-center justify-content-between gap-3">

        {/* ── Logo ── */}
        <Link
          to="/"
          className="d-flex align-items-center gap-2 text-decoration-none flex-shrink-0"
          onClick={closeMobileMenu}
          aria-label={`Ir al inicio de ${BRAND.name}`}
        >
          <BrandLogo variant={isDark ? 'white' : 'black'} height={34} alt={BRAND.name} />
        </Link>

        {/* ── Navegación Desktop ── */}
        <nav
          className="d-none d-xl-flex align-items-center gap-1 flex-grow-1 justify-content-center"
          aria-label="Navegación principal"
        >
          {navLinks.map((item) =>
            item.to ? (
              <NavLink
                key={item.id}
                to={item.to}
                end
                className={({ isActive }) =>
                  `kyrios-nav-link${isActive ? ' is-active' : ''}`
                }
                onClick={closeMobileMenu}
              >
                <span className="kyrios-nav-link__label">{item.label}</span>
                <span className="kyrios-nav-link__underline" aria-hidden="true" />
              </NavLink>
            ) : (
              <button
                key={item.id}
                type="button"
                className="kyrios-nav-link"
                onClick={() => {
                  closeMobileMenu();
                  setProductosModalOpen(true);
                }}
              >
                <span className="kyrios-nav-link__label">{item.label}</span>
                <span className="kyrios-nav-link__underline" aria-hidden="true" />
              </button>
            )
          )}
        </nav>

        {/* ── CTA Desktop ── */}
        <div className="d-none d-xl-flex align-items-center gap-2 flex-shrink-0">
          {/* Toggle de tema */}
          <button
            type="button"
            className="kyrios-nav-hamburger"
            onClick={cycleTheme}
            aria-label={themeLabel}
            title={themeLabel}
          >
            <ThemeIcon size={18} strokeWidth={2} />
          </button>

          {isInitializing ? (
            // Espacio reservado para evitar layout shift (sin spinner, sin círculo)
            <div style={{ width: 32, height: 32 }} aria-hidden="true" />
          ) : mostrarAvatar ? (
            <div className="d-flex align-items-center gap-2">
              <UserAvatar nombre={nombre} apellido={apellido} online />
              <span className="kyrios-nav-greeting">{displayName}</span>
              <button
                type="button"
                className="btn-kyrios-primary d-inline-flex align-items-center gap-1"
                onClick={() => navigate('/dashboard')}
                aria-label="Ir a mi panel administrativo"
              >
                <LayoutDashboard size={14} strokeWidth={2} />
                Mi panel
              </button>
              {tieneAcceso && (
                <button
                  type="button"
                  className="btn-kyrios-outline d-inline-flex align-items-center gap-1"
                  onClick={() => navigate('/mi-perfil')}
                  aria-label="Ir a mi perfil"
                >
                  <User size={14} strokeWidth={2} />
                  Mi Perfil
                </button>
              )}
              <button
                type="button"
                className="btn-kyrios-outline d-inline-flex align-items-center gap-1"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
              >
                <LogOut size={14} strokeWidth={2} />
                Salir
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-kyrios-outline d-inline-flex align-items-center gap-1"
              onClick={onLogin}
            >
              Iniciar sesión
              <ArrowUpRight size={14} strokeWidth={2} className="kyrios-nav-cta-arrow" />
            </button>
          )}
        </div>

        {/* ── Zona derecha Móvil / Tablet: toggle tema + CTA compacto + hamburguesa ── */}
        <div className="d-flex d-xl-none align-items-center gap-2 flex-shrink-0">
          {/* Toggle de tema (móvil/tablet, solo icono) */}
          <button
            type="button"
            className="kyrios-nav-hamburger"
            onClick={cycleTheme}
            aria-label={themeLabel}
            title={themeLabel}
          >
            <ThemeIcon size={18} strokeWidth={2} />
          </button>

          {isInitializing ? (
            // Espacio reservado para evitar layout shift (sin spinner, sin círculo)
            <div style={{ width: 32, height: 32 }} aria-hidden="true" />
          ) : mostrarAvatar ? (
            <button
              type="button"
              className="p-0 border-0 bg-transparent d-inline-flex align-items-center rounded-circle"
              onClick={() => navigate('/dashboard')}
              aria-label="Ir a mi panel administrativo"
              title="Mi panel"
            >
              <UserAvatar nombre={nombre} apellido={apellido} online />
            </button>
          ) : (
            <button
              type="button"
              className="btn-kyrios-outline kyrios-nav-cta-compact d-inline-flex align-items-center gap-1"
              onClick={onLogin}
            >
              Ingresar
            </button>
          )}

          <button
            type="button"
            className="kyrios-nav-hamburger"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls={mobileMenuId}
            aria-label={mobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          >
            {mobileMenuOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* ── Menú Desplegable Móvil / Tablet ── */}
      {mobileMenuOpen && (
        <div
          id={mobileMenuId}
          className="kyrios-nav-collapse d-xl-none"
          role="menu"
          aria-label="Menú de navegación móvil"
        >
          <div className="container pb-4 pt-2 d-flex flex-column">
            {navLinks.map((item) =>
              item.to ? (
                <NavLink
                  key={item.id}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    `kyrios-nav-link kyrios-nav-link--mobile${isActive ? ' is-active' : ''}`
                  }
                  onClick={closeMobileMenu}
                  role="menuitem"
                >
                  <span className="kyrios-nav-link__label">{item.label}</span>
                </NavLink>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  className="kyrios-nav-link kyrios-nav-link--mobile text-start w-100"
                  onClick={() => {
                    closeMobileMenu();
                    setProductosModalOpen(true);
                  }}
                  role="menuitem"
                >
                  <span className="kyrios-nav-link__label">{item.label}</span>
                </button>
              )
            )}

            {/* CTA al fondo del drawer */}
            <div className="kyrios-nav-mobile-divider pt-4 mt-2 d-flex flex-column gap-2">
              {isInitializing ? (
                // Espacio reservado para evitar layout shift
                <div style={{ height: 40 }} aria-hidden="true" />
              ) : mostrarAvatar ? (
                <>
                  <div className="kyrios-nav-greeting d-flex align-items-center gap-2 mb-1">
                    <UserAvatar nombre={nombre} apellido={apellido} online />
                    <span>Conectado como <strong>{displayName}</strong></span>
                  </div>
                  <button
                    type="button"
                    className="btn-kyrios-primary w-100 d-inline-flex align-items-center justify-content-center gap-2"
                    onClick={() => { closeMobileMenu(); navigate('/dashboard'); }}
                  >
                    <LayoutDashboard size={15} strokeWidth={2} />
                    Ir a mi panel
                  </button>
                  {tieneAcceso && (
                    <button
                      type="button"
                      className="btn-kyrios-outline w-100 d-inline-flex align-items-center justify-content-center gap-2"
                      onClick={() => { closeMobileMenu(); navigate('/mi-perfil'); }}
                    >
                      <User size={15} strokeWidth={2} />
                      Mi Perfil
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-kyrios-outline w-100 d-inline-flex align-items-center justify-content-center gap-2"
                    onClick={handleLogout}
                    aria-label="Cerrar sesión"
                  >
                    <LogOut size={15} strokeWidth={2} />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-kyrios-primary w-100 d-inline-flex align-items-center justify-content-center gap-2"
                  onClick={() => { closeMobileMenu(); onLogin(); }}
                >
                  Iniciar sesión
                  <ArrowUpRight size={15} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Productos en Desarrollo */}
      <ProductosEnDesarrolloModal
        isOpen={productosModalOpen}
        onClose={() => setProductosModalOpen(false)}
      />
    </header>
  );
};

export default HomeNavbar;
