import { useEffect, useRef, type ComponentType } from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Scissors,
  Calendar,
  Clock,
  Users,
  Sparkles,
  Package,
  Percent,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useSystemTheme } from '../lib/useSystemTheme';
import { useBodyScrollLock } from '../lib/useBodyScrollLock';
import BrandLogo from '../ui/BrandLogo';
import { BRAND } from '../../config/brand';
import { useUi } from '../contexts/UiContext';
import { obtenerNegocioSlugActivo } from '../lib/http/axios';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{
    size?: number | string;
    strokeWidth?: number | string;
    className?: string;
  }>;
  permiso: boolean;
}

interface NavGroup {
  id: string;
  titulo: string;
  items: NavItem[];
}

export default function Sidebar() {
  const { roles } = useAuth();
  const systemTheme = useSystemTheme();
  const isDark = systemTheme === 'dark';
  const location = useLocation();
  const { slug: paramSlug } = useParams<{ slug?: string }>();
  const slugActivo = paramSlug || obtenerNegocioSlugActivo();
  const basePrefix = slugActivo ? `/${slugActivo}` : '';

  const { isSidebarOpen, closeSidebar, isCollapsed, toggleCollapse } = useUi();

  // 1. Bloqueo de scroll en body mientras el drawer móvil está abierto
  useBodyScrollLock(isSidebarOpen);

  // 2. Cierre automático al cambiar de ruta (usando ref para evitar cerrar al abrir)
  const prevPathnameRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname;
      if (isSidebarOpen) {
        closeSidebar();
      }
    }
  }, [location.pathname, isSidebarOpen, closeSidebar]);

  // 3. Cierre automático si la ventana se redimensiona a desktop (evita estados zombies)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992 && isSidebarOpen) {
        closeSidebar();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen, closeSidebar]);

  // 4. Cierre mediante la tecla Escape
  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, closeSidebar]);

  // 5. Gestión de foco y Focus Trap para accesibilidad completa (Emil Kowalski)
  const drawerRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isSidebarOpen) {
      prevFocusedElementRef.current = document.activeElement as HTMLElement | null;
      const timer = setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (prevFocusedElementRef.current) {
      prevFocusedElementRef.current.focus();
      prevFocusedElementRef.current = null;
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', trapFocus);
    return () => window.removeEventListener('keydown', trapFocus);
  }, [isSidebarOpen]);

  const esSuperAdmin = roles.includes('SUPERADMIN');
  const esAdministrador = roles.includes('ADMINISTRADOR');
  const esBarbero = roles.includes('BARBERO');

  const grupos: NavGroup[] = [
    {
      id: 'principal',
      titulo: 'PRINCIPAL',
      items: [
        {
          to: `${basePrefix}/dashboard`,
          label: 'Dashboard',
          icon: LayoutDashboard,
          permiso: true,
        },
        {
          to: `${basePrefix}/mi-perfil`,
          label: 'Mi Perfil',
          icon: User,
          permiso: true,
        },
        {
          to: slugActivo ? `/${slugActivo}/cliente/mi-cuenta` : '/cliente/mi-cuenta',
          label: 'Portal Cliente',
          icon: Sparkles,
          permiso: true,
        },
      ],
    },
    {
      id: 'operativo',
      titulo: 'OPERATIVO',
      items: [
        {
          to: `${basePrefix}/barberos`,
          label: 'Barberos',
          icon: Scissors,
          permiso: esSuperAdmin || esAdministrador || esBarbero,
        },
        {
          to: `${basePrefix}/reservas`,
          label: 'Reservas',
          icon: Calendar,
          permiso: esSuperAdmin || esAdministrador || esBarbero,
        },
        {
          to: `${basePrefix}/horarios`,
          label: 'Horarios',
          icon: Clock,
          permiso: esBarbero,
        },
      ],
    },
    {
      id: 'gestion',
      titulo: 'GESTIÓN',
      items: [
        {
          to: `${basePrefix}/usuarios`,
          label: 'Usuarios',
          icon: Users,
          permiso: esSuperAdmin || esAdministrador,
        },
        {
          to: `${basePrefix}/servicios`,
          label: 'Servicios',
          icon: Sparkles,
          permiso: esSuperAdmin || esAdministrador,
        },
        {
          to: `${basePrefix}/productos`,
          label: 'Productos',
          icon: Package,
          permiso: esSuperAdmin || esAdministrador,
        },
        {
          to: `${basePrefix}/descuentos`,
          label: 'Descuentos',
          icon: Percent,
          permiso: esSuperAdmin || esAdministrador,
        },
        {
          to: `${basePrefix}/whatsapp`,
          label: 'WhatsApp',
          icon: MessageSquare,
          permiso: esSuperAdmin || esAdministrador,
        },
        {
          to: `${basePrefix}/configuracion`,
          label: 'Configuración',
          icon: Settings,
          permiso: esSuperAdmin || esAdministrador,
        },
      ],
    },
  ];

  // Filtra los grupos para mostrar sólo aquellos con al menos un ítem permitido
  const gruposVisibles = grupos
    .map((grupo) => ({
      ...grupo,
      items: grupo.items.filter((item) => item.permiso),
    }))
    .filter((grupo) => grupo.items.length > 0);

  const renderNavContent = (onItemClick?: () => void, forceExpanded = false) => {
    const collapsed = isCollapsed && !forceExpanded;

    return (
      <nav className="d-flex flex-column gap-3" aria-label="Navegación principal">
        {gruposVisibles.map((grupo, idx) => (
          <div
            key={grupo.id}
            role="group"
            aria-labelledby={`group-title-${grupo.id}-${forceExpanded ? 'mob' : 'desk'}`}
          >
            {/* Encabezado o separador editorial */}
            {collapsed ? (
              idx > 0 && <hr className="sidebar-group-divider my-2 mx-2" />
            ) : (
              <div
                id={`group-title-${grupo.id}-${forceExpanded ? 'mob' : 'desk'}`}
                className="sidebar-group-header px-3 mb-1"
              >
                <span className="text-eyebrow">{grupo.titulo}</span>
              </div>
            )}

            <div className="d-flex flex-column gap-1">
              {grupo.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onItemClick}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={19} strokeWidth={2} className="sidebar-nav-icon" />
                  {!collapsed && <span className="sidebar-nav-label text-truncate">{label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    );
  };

  return (
    <>
      {/* ── 1. Sidebar para Desktop (≥ 992px) ── */}
      <aside
        className={`app-sidebar app-sidebar--desktop d-none d-lg-flex flex-column ${
          isCollapsed ? 'sidebar--collapsed' : ''
        } ${isDark ? 'sidebar--dark' : 'sidebar--light'}`}
        style={{
          width: isCollapsed ? '72px' : '240px',
        }}
        aria-label="Menú principal de escritorio"
      >
        <div className="p-3 flex-grow-1 overflow-y-auto">{renderNavContent()}</div>

        {/* Botón inferior para colapsar / expandir */}
        <div className="p-2 border-top sidebar-footer-wrapper">
          <button
            type="button"
            onClick={toggleCollapse}
            className="sidebar-collapse-btn"
            aria-label={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {isCollapsed ? (
              <ChevronRight size={18} strokeWidth={2} />
            ) : (
              <>
                <ChevronLeft size={18} strokeWidth={2} />
                <span className="ms-2">Colapsar menú</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── 2. Drawer móvil con Overlay (< 992px) ── */}
      {isSidebarOpen && (
        <div className="sidebar-overlay d-lg-none" onClick={closeSidebar} aria-hidden="true" />
      )}

      <aside
        id="main-sidebar"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú principal"
        className={`sidebar sidebar--mobile ${
          isSidebarOpen ? 'is-open' : ''
        } d-lg-none ${isDark ? 'sidebar--dark' : 'sidebar--light'}`}
      >
        {/* Cabecera del Drawer */}
        <div className="p-3 d-flex align-items-center justify-content-between border-bottom">
          <BrandLogo variant={isDark ? 'white' : 'black'} height={26} alt={BRAND.name} />
          <button
            ref={closeBtnRef}
            type="button"
            className="btn-close-drawer text-surface-app"
            onClick={closeSidebar}
            aria-label="Cerrar menú"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Navegación dentro del drawer */}
        <div className="p-3 flex-grow-1 overflow-y-auto">
          {renderNavContent(closeSidebar, true)}
        </div>
      </aside>
    </>
  );
}
