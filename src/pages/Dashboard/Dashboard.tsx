import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const SHORTCUTS = [
    { label: 'Reservas', descripcion: 'Gestiona las reservas de la barbería.', to: '/reservas', icon: '📅' },
    { label: 'Barberos', descripcion: 'Consulta y administra los barberos.', to: '/barberos', icon: '✂️' },
    { label: 'Servicios', descripcion: 'Gestiona los servicios disponibles.', to: '/servicios', icon: '🗂️' },
    { label: 'Productos', descripcion: 'Administra el catálogo de productos.', to: '/productos', icon: '📦' },
] as const;

export default function Dashboard() {
    const {
        nombre,
        apellido,
        roles,
    } = useAuth();

    return (
        <div className="p-4">
            {/* ── Cabecera ── */}
            <div className="mb-5">
                <p className="text-eyebrow mb-2">Panel principal</p>
                <h1 className="font-display mb-1" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800 }}>
                    Dashboard
                </h1>
                <p className="mb-3" style={{ color: 'var(--catalog-muted)', fontSize: '0.95rem' }}>
                    Bienvenido, {nombre} {apellido}.
                </p>

                {/* Roles como badges */}
                <div className="d-flex flex-wrap gap-2">
                    {roles.map((rol) => (
                        <span key={rol} className="dash-role-badge">
                            {rol}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Divisor editorial ── */}
            <div className="d-flex align-items-center gap-3 mb-4">
                <h2 className="font-display mb-0" style={{ fontSize: '0.85rem', letterSpacing: '0.12em' }}>
                    ACCESOS DIRECTOS
                </h2>
                <div style={{ flex: 1, height: '1px', background: 'var(--catalog-muted-border)' }} />
            </div>

            {/* ── Tarjetas de acceso directo ── */}
            <div className="row g-3">
                {SHORTCUTS.map(({ label, descripcion, to, icon }) => (
                    <div key={label} className="col-md-6 col-xl-3">
                        <NavLink
                            to={to}
                            className="text-decoration-none"
                            style={{ display: 'block', height: '100%' }}
                        >
                            <div className="dash-shortcut-card card h-100">
                                <div className="card-body p-3 d-flex flex-column gap-2">
                                    <span style={{ fontSize: '1.6rem' }}>{icon}</span>
                                    <h3
                                        className="font-display mb-0"
                                        style={{ fontSize: '1rem', fontWeight: 700, color: '#0a0a0a' }}
                                    >
                                        {label}
                                    </h3>
                                    <p
                                        className="mb-0"
                                        style={{ fontSize: '0.825rem', color: 'var(--catalog-muted)', lineHeight: 1.6 }}
                                    >
                                        {descripcion}
                                    </p>
                                </div>
                            </div>
                        </NavLink>
                    </div>
                ))}
            </div>
        </div>
    );
}