import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Calendar,
    Scissors,
    Globe,
    Users,
    LayoutGrid,
    Package,
    ArrowUpRight,
    LogOut,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { ROLES_APP } from '../../shared/constants/roles';

interface ShortcutItem {
    label: string;
    descripcion: string;
    to: string;
    icon: ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string }>;
    color: string;
    badge?: string;
}

const SHORTCUTS_OPERATIVOS: ShortcutItem[] = [
    {
        label: 'Reservas',
        descripcion: 'Gestiona la agenda, citas y reservas del día.',
        to: '/reservas',
        icon: Calendar,
        color: '#0071BC',
    },
    {
        label: 'Barberos',
        descripcion: 'Consulta y administra el equipo de profesionales.',
        to: '/barberos',
        icon: Scissors,
        color: '#C9A961',
    },
    {
        label: 'Sitio Público',
        descripcion: 'Explora la landing y catálogo tal como lo ven tus clientes.',
        to: '/',
        icon: Globe,
        color: '#0C0C0C',
        badge: 'LANDING',
    },
];

const SHORTCUTS_GESTION: ShortcutItem[] = [
    {
        label: 'Usuarios',
        descripcion: 'Administra cuentas, roles, permisos y estado del personal.',
        to: '/usuarios',
        icon: Users,
        color: '#0071BC',
    },
    {
        label: 'Servicios',
        descripcion: 'Gestiona el catálogo de servicios, precios y duraciones.',
        to: '/servicios',
        icon: LayoutGrid,
        color: '#10B981',
    },
    {
        label: 'Productos',
        descripcion: 'Controla el inventario y venta de productos exclusivos.',
        to: '/productos',
        icon: Package,
        color: '#8B5CF6',
    },
];



export default function Dashboard() {
    const {
        cerrarSesion,
        nombre,
        apellido,
        email,
        roles,
    } = useAuth();

    const esSuperAdmin = roles.includes('SUPERADMIN');
    const esAdministrador = roles.includes('ADMINISTRADOR');
    const esAdmin = esSuperAdmin || esAdministrador;

    const rolesApp = roles.filter((r) => (ROLES_APP as readonly string[]).includes(r));
    const rolesMostrados = rolesApp.length > 0 ? rolesApp : roles;

    const renderCard = ({ label, descripcion, to, icon: Icon, color, badge }: ShortcutItem) => {
        const isDarkAccent = color === '#0C0C0C';

        return (
            <div key={label} className="col-12 col-md-6 col-xl-3">
                <NavLink
                    to={to}
                    className="dash-shortcut-link"
                >
                    <div
                        className="dash-shortcut-card card h-100 border-start border-4"
                        style={{ borderLeftColor: color }}
                    >
                        <div className="card-body p-4 d-flex flex-column justify-content-between h-100">
                            <div>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div
                                        className="dash-shortcut-card__icon"
                                        style={{
                                            backgroundColor: isDarkAccent
                                                ? 'var(--dash-public-icon-bg, rgba(12, 12, 12, 0.08))'
                                                : `${color}18`,
                                            color: isDarkAccent
                                                ? 'var(--dash-public-color, #0C0C0C)'
                                                : color,
                                            width: '46px',
                                            height: '46px',
                                        }}
                                    >
                                        <Icon size={26} strokeWidth={2} />
                                    </div>
                                    {badge && (
                                        <span
                                            className="badge font-display"
                                            style={{
                                                backgroundColor: 'rgba(0, 113, 188, 0.1)',
                                                color: '#0071BC',
                                                fontSize: '0.65rem',
                                                letterSpacing: '0.08em',
                                                fontWeight: 700,
                                                borderRadius: '2px',
                                                padding: '0.3em 0.6em',
                                            }}
                                        >
                                            {badge}
                                        </span>
                                    )}
                                </div>
                                <h3
                                    className="font-display mb-1"
                                    style={{ fontSize: '1.05rem', fontWeight: 700 }}
                                >
                                    {label}
                                </h3>
                                <p
                                    className="text-muted small mb-0"
                                    style={{ lineHeight: 1.5 }}
                                >
                                    {descripcion}
                                </p>
                            </div>

                            <div className="d-flex justify-content-end align-items-center mt-3 pt-2">
                                <ArrowUpRight
                                    size={16}
                                    className="dash-shortcut-card__arrow text-muted"
                                    aria-hidden="true"
                                />
                            </div>
                        </div>
                    </div>
                </NavLink>
            </div>
        );
    };

    return (
        <div className="p-3 p-md-4">
            {/* ── 1. Cabecera con identidad de marca ── */}
            <div className="mb-5 pb-4 border-bottom">
                <span className="text-eyebrow mb-2 d-block">Panel principal</span>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div>
                        <h1 className="font-display mb-2" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800 }}>
                            Hola, {nombre || 'Usuario'}
                        </h1>
                        <p className="text-muted mb-0">
                            Bienvenido de nuevo. Este es el resumen de tu actividad en Kyrios Studio.
                        </p>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                        {rolesMostrados.map((rol) => (
                            <span key={rol} className="dash-role-badge">
                                {rol}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── 2. Bloque A: Accesos Operativos ── */}
            <div className="mb-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                    <h2 className="font-display mb-0" style={{ fontSize: '0.85rem', letterSpacing: '0.12em' }}>
                        OPERATIVO
                    </h2>
                    <div style={{ flex: 1, height: '1px', background: 'var(--catalog-muted-border)' }} />
                </div>

                <div className="row g-3">
                    {SHORTCUTS_OPERATIVOS.map(renderCard)}
                </div>
            </div>

            {/* ── 3. Bloque B: Accesos de Gestión (solo Administradores) ── */}
            {esAdmin && (
                <div className="mt-5 mb-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <h2 className="font-display mb-0" style={{ fontSize: '0.85rem', letterSpacing: '0.12em' }}>
                            GESTIÓN
                        </h2>
                        <div style={{ flex: 1, height: '1px', background: 'var(--catalog-muted-border)' }} />
                    </div>

                    <div className="row g-3">
                        {SHORTCUTS_GESTION.map(renderCard)}
                    </div>
                </div>
            )}

            {/* ── 4. Bloque Informativo: Estado del Sistema ── */}
            <div className="mt-5 pt-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                    <h2 className="font-display mb-0" style={{ fontSize: '0.85rem', letterSpacing: '0.12em' }}>
                        ESTADO DEL SISTEMA
                    </h2>
                    <div style={{ flex: 1, height: '1px', background: 'var(--catalog-muted-border)' }} />
                </div>

                <div className="dash-system-card card p-3 p-md-4">
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <div
                                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: '#10B981',
                                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
                                }}
                                title="Sesión activa"
                            />
                            <div>
                                <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                                    <span className="fw-bold" style={{ fontSize: '0.95rem' }}>
                                        Conectado como {nombre} {apellido}
                                    </span>
                                    {email && (
                                        <span className="text-surface-muted small">
                                            ({email})
                                        </span>
                                    )}
                                </div>
                                <p className="text-surface-muted small mb-0">
                                    Sesión activa mediante autenticación Keycloak SSO. Roles asignados:{' '}
                                    <span className="fw-semibold">{rolesMostrados.join(', ') || 'Sin rol asignado'}</span>
                                </p>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={cerrarSesion}
                                className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold"
                                style={{
                                    borderRadius: '4px',
                                    transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                                }}
                            >
                                <LogOut size={16} strokeWidth={2} />
                                <span>Cerrar sesión</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}