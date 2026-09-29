import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { esRolApp } from '../../shared/lib/autorizacion/roles';

const SERVICIOS = [
    {
        id: 1,
        nombre: 'Corte Clásico',
        descripcion: 'Corte tradicional a tijera o máquina, incluye lavado y peinado.',
        precio: '$25.000',
        icono: '✂️',
        categoria: 'Clásicos',
    },
    {
        id: 2,
        nombre: 'Arreglo de Barba',
        descripcion: 'Perfilado y recorte de barba con toalla caliente y navaja.',
        precio: '$15.000',
        icono: '🧔',
        categoria: 'Barba',
    },
    {
        id: 3,
        nombre: 'Corte + Barba',
        descripcion: 'El paquete completo para lucir impecable. Incluye lavado.',
        precio: '$35.000',
        icono: '🔥',
        categoria: 'Combos',
    },
    {
        id: 4,
        nombre: 'Corte para Niños',
        descripcion: 'Corte especial y paciente para los más pequeños.',
        precio: '$20.000',
        icono: '👦',
        categoria: 'Clásicos',
    },
    {
        id: 5,
        nombre: 'Perfilado de Cejas',
        descripcion: 'Dale forma a tus cejas para una mirada más limpia.',
        precio: '$10.000',
        icono: '👁️',
        categoria: 'Detalle',
    },
    {
        id: 6,
        nombre: 'Tinte / Decoloración',
        descripcion: 'Cambia tu estilo con colores modernos o cubre las canas.',
        precio: '$50.000',
        icono: '🎨',
        categoria: 'Color',
    },
];

export default function HomePage() {
    const { keycloak, isAuthenticated, nombre, roles } = useAuth();
    const navigate = useNavigate();

    const tienePermiso = roles.some((r) => esRolApp(r));

    useEffect(() => {
        // Si inicia sesión pero no tiene ningún rol en la app, lo mandamos a la vista de "Sin Acceso"
        if (isAuthenticated && !tienePermiso) {
            navigate('/sin-acceso');
        }
    }, [isAuthenticated, tienePermiso, navigate]);

    return (
        <div className="d-flex flex-column min-vh-100" style={{ background: 'var(--bs-body-bg)' }}>
            {/* ── Navbar ── */}
            <nav className="navbar navbar-expand-lg sticky-top" style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
                <div className="container">
                    <span className="navbar-brand mb-0 font-display text-white" style={{ fontSize: '1.3rem', letterSpacing: '0.06em' }}>
                        💈 BARBERÍA VIP
                    </span>

                    <div className="ms-auto">
                        {isAuthenticated ? (
                            <div className="d-flex align-items-center gap-3">
                                <span className="text-white d-none d-sm-inline" style={{ fontSize: '0.875rem' }}>
                                    Hola, <span className="fw-semibold">{nombre}</span>
                                </span>
                                <button
                                    className="btn btn-sm btn-outline-light px-3"
                                    style={{ borderRadius: '2px', fontSize: '0.8rem', letterSpacing: '0.06em' }}
                                    onClick={() => navigate('/dashboard')}
                                >
                                    IR A MI PANEL
                                </button>
                            </div>
                        ) : (
                            <button
                                className="btn btn-sm px-4 fw-semibold"
                                style={{ background: '#fafafa', color: '#0a0a0a', borderRadius: '2px', fontSize: '0.8rem', letterSpacing: '0.06em' }}
                                onClick={() => keycloak.login()}
                            >
                                INICIAR SESIÓN
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Hero / Título ── */}
            <section className="home-hero py-5">
                <div className="container py-4 text-center">
                    <p className="home-hero__eyebrow mb-3">Barbería de alto estándar</p>
                    <h1 className="home-hero__title mb-4" style={{ fontSize: 'clamp(2.8rem, 8vw, 5rem)' }}>
                        Nuestros Servicios
                    </h1>
                    <p style={{ maxWidth: '520px', margin: '0 auto', color: '#aaaaaa', fontSize: '0.95rem', lineHeight: 1.7 }}>
                        Descubre todo lo que podemos hacer por tu estilo. Calidad, precisión y los mejores profesionales a tu disposición.
                    </p>
                </div>
            </section>

            {/* ── Catálogo de Servicios ── */}
            <main className="flex-grow-1 container py-5">
                <div className="d-flex align-items-center gap-3 mb-4">
                    <h2 className="font-display mb-0" style={{ fontSize: '1rem', letterSpacing: '0.1em' }}>
                        TODOS LOS SERVICIOS
                    </h2>
                    <div style={{ flex: 1, height: '1px', background: 'var(--catalog-muted-border)' }} />
                    <span className="text-eyebrow">{SERVICIOS.length} disponibles</span>
                </div>

                <div className="row g-3">
                    {SERVICIOS.map((servicio) => (
                        <div key={servicio.id} className="col-12 col-md-6 col-lg-4">
                            <div className="home-service-card h-100">
                                {/* Zona de ícono como placeholder de imagen */}
                                <div
                                    className="d-flex align-items-center justify-content-center"
                                    style={{ height: '140px', background: 'var(--catalog-image-bg)', fontSize: '3rem' }}
                                >
                                    {servicio.icono}
                                </div>

                                <div className="p-3 d-flex flex-column gap-2">
                                    {/* Badge de categoría */}
                                    <span className="badge-outline" style={{ borderRadius: '2px', alignSelf: 'flex-start' }}>
                                        {servicio.categoria}
                                    </span>

                                    <h3 className="font-display mb-0" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                                        {servicio.nombre}
                                    </h3>

                                    <p className="mb-0" style={{ fontSize: '0.875rem', color: 'var(--catalog-muted)', lineHeight: 1.6 }}>
                                        {servicio.descripcion}
                                    </p>

                                    <div className="d-flex align-items-center justify-content-between mt-2">
                                        <span className="catalog-card-price" style={{ fontSize: '1.1rem' }}>
                                            {servicio.precio}
                                        </span>
                                        <button
                                            className="btn btn-sm"
                                            style={{
                                                background: '#0a0a0a',
                                                color: '#fafafa',
                                                borderRadius: '2px',
                                                fontSize: '0.75rem',
                                                letterSpacing: '0.06em',
                                                padding: '0.35rem 0.9rem',
                                            }}
                                            onClick={() => {
                                                if (!isAuthenticated) {
                                                    keycloak.login();
                                                } else {
                                                    alert('El sistema de reservas estará disponible pronto.');
                                                }
                                            }}
                                        >
                                            RESERVAR
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* ── Footer ── */}
            <footer style={{ background: '#0a0a0a', borderTop: '1px solid #1a1a1a' }} className="py-4 mt-auto">
                <div className="container text-center">
                    <p className="mb-0 text-eyebrow">
                        &copy; {new Date().getFullYear()} Barbería VIP. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
