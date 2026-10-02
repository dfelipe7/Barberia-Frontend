import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
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
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useSystemTheme } from '../lib/useSystemTheme';
import BrandLogo from '../ui/BrandLogo';
import { BRAND } from '../../config/brand';
import { useSidebar } from './SidebarContext';

interface NavItem {
    to: string;
    label: string;
    icon: ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string }>;
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
    const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useSidebar();

    const esSuperAdmin = roles.includes('SUPERADMIN');
    const esAdministrador = roles.includes('ADMINISTRADOR');
    const esBarbero = roles.includes('BARBERO');

    const grupos: NavGroup[] = [
        {
            id: 'principal',
            titulo: 'PRINCIPAL',
            items: [
                {
                    to: '/dashboard',
                    label: 'Dashboard',
                    icon: LayoutDashboard,
                    permiso: true,
                },
                {
                    to: '/mi-perfil',
                    label: 'Mi Perfil',
                    icon: User,
                    permiso: true,
                },
            ],
        },
        {
            id: 'operativo',
            titulo: 'OPERATIVO',
            items: [
                {
                    to: '/barberos',
                    label: 'Barberos',
                    icon: Scissors,
                    permiso: esSuperAdmin || esAdministrador || esBarbero,
                },
                {
                    to: '/reservas',
                    label: 'Reservas',
                    icon: Calendar,
                    permiso: esSuperAdmin || esAdministrador || esBarbero,
                },
                {
                    to: '/horarios',
                    label: 'Horarios',
                    icon: Clock,
                    permiso: esSuperAdmin || esAdministrador || esBarbero,
                },
            ],
        },
        {
            id: 'gestion',
            titulo: 'GESTIÓN',
            items: [
                {
                    to: '/usuarios',
                    label: 'Usuarios',
                    icon: Users,
                    permiso: esSuperAdmin || esAdministrador,
                },
                {
                    to: '/servicios',
                    label: 'Servicios',
                    icon: Sparkles,
                    permiso: esSuperAdmin || esAdministrador,
                },
                {
                    to: '/productos',
                    label: 'Productos',
                    icon: Package,
                    permiso: esSuperAdmin || esAdministrador,
                },
                {
                    to: '/descuentos',
                    label: 'Descuentos',
                    icon: Percent,
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
            <nav className="d-flex flex-column gap-3" aria-label="Menú principal">
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
                                    className={({ isActive }) =>
                                        `sidebar-nav-link ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <Icon size={19} strokeWidth={2} className="sidebar-nav-icon" />
                                    {!collapsed && (
                                        <span className="sidebar-nav-label text-truncate">
                                            {label}
                                        </span>
                                    )}
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
                aria-label="Menú principal"
            >
                <div className="p-3 flex-grow-1 overflow-y-auto">
                    {renderNavContent()}
                </div>

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
            {isMobileOpen && (
                <div
                    className="sidebar-mobile-backdrop"
                    onClick={closeMobile}
                    aria-hidden="true"
                />
            )}

            <aside
                id="mobile-sidebar-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Menú principal de navegación"
                className={`app-sidebar app-sidebar--mobile ${
                    isMobileOpen
                        ? 'sidebar-mobile-drawer--open'
                        : 'sidebar-mobile-drawer--hidden'
                } d-lg-none ${isDark ? 'sidebar--dark' : 'sidebar--light'}`}
            >
                {/* Cabecera del Drawer */}
                <div className="p-3 d-flex align-items-center justify-content-between border-bottom">
                    <BrandLogo
                        variant={isDark ? 'white' : 'black'}
                        height={26}
                        alt={BRAND.name}
                    />
                    <button
                        type="button"
                        onClick={closeMobile}
                        className="btn btn-sm btn-icon border-0 p-1"
                        style={{ color: isDark ? '#FFFDFA' : '#0C0C0C' }}
                        aria-label="Cerrar menú lateral"
                    >
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>

                {/* Navegación dentro del drawer */}
                <div className="p-3 flex-grow-1 overflow-y-auto">
                    {renderNavContent(closeMobile, true)}
                </div>
            </aside>
        </>
    );
}