import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const ROLES_APP = ['SUPERADMIN', 'ADMINISTRADOR', 'BARBERO'];

const SERVICIOS = [
    {
        id: 1,
        nombre: 'Corte Clásico',
        descripcion: 'Corte tradicional a tijera o máquina, incluye lavado y peinado.',
        precio: '$25.000',
        icono: '✂️',
    },
    {
        id: 2,
        nombre: 'Arreglo de Barba',
        descripcion: 'Perfilado y recorte de barba con toalla caliente y navaja.',
        precio: '$15.000',
        icono: '🧔',
    },
    {
        id: 3,
        nombre: 'Corte + Barba',
        descripcion: 'El paquete completo para lucir impecable. Incluye lavado.',
        precio: '$35.000',
        icono: '🔥',
    },
    {
        id: 4,
        nombre: 'Corte para Niños',
        descripcion: 'Corte especial y paciente para los más pequeños.',
        precio: '$20.000',
        icono: '👦',
    },
    {
        id: 5,
        nombre: 'Perfilado de Cejas',
        descripcion: 'Dale forma a tus cejas para una mirada más limpia.',
        precio: '$10.000',
        icono: '👁️',
    },
    {
        id: 6,
        nombre: 'Tinte / Decoloración',
        descripcion: 'Cambia tu estilo con colores modernos o cubre las canas.',
        precio: '$50.000',
        icono: '🎨',
    },
];

export default function HomePage() {
    const { keycloak, isAuthenticated, nombre, roles } = useAuth();
    const navigate = useNavigate();

    const tienePermiso = roles.some((rol) => ROLES_APP.includes(rol));

    useEffect(() => {
        // Si inicia sesión pero no tiene ningún rol en la app, lo mandamos a la vista de "Sin Acceso"
        if (isAuthenticated && !tienePermiso) {
            navigate('/sin-acceso');
        }
    }, [isAuthenticated, tienePermiso, navigate]);

    return (
        <div className="d-flex flex-column min-vh-100 bg-light">
            {/* Header */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow">
                <div className="container">
                    <span className="navbar-brand mb-0 h1 fw-bold">💈 Barbería VIP</span>
                    
                    <div className="ms-auto">
                        {isAuthenticated ? (
                            <div className="d-flex align-items-center gap-3">
                                <span className="text-white d-none d-sm-inline">
                                    Hola, <span className="fw-semibold">{nombre}</span>
                                </span>
                                <button
                                    className="btn btn-outline-light btn-sm px-3"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    Ir a mi panel
                                </button>
                            </div>
                        ) : (
                            <button
                                className="btn btn-primary px-4 fw-semibold"
                                onClick={() => keycloak.login()}
                            >
                                Iniciar Sesión
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero / Título */}
            <div className="bg-dark text-white text-center py-5 shadow-sm">
                <div className="container py-4">
                    <h1 className="display-4 fw-bold mb-3">Nuestros Servicios</h1>
                    <p className="lead mb-0" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        Descubre todo lo que podemos hacer por tu estilo. Calidad, precisión y los mejores profesionales a tu disposición.
                    </p>
                </div>
            </div>

            {/* Catálogo de Servicios */}
            <main className="flex-grow-1 container py-5">
                <div className="row g-4">
                    {SERVICIOS.map((servicio) => (
                        <div key={servicio.id} className="col-12 col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm border-0 bg-white" style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                <div className="card-body p-4 text-center d-flex flex-column">
                                    <div className="display-4 mb-3">{servicio.icono}</div>
                                    <h4 className="card-title fw-bold">{servicio.nombre}</h4>
                                    <p className="card-text text-muted flex-grow-1">
                                        {servicio.descripcion}
                                    </p>
                                    <div className="mt-3">
                                        <span className="fs-5 fw-bold text-dark">{servicio.precio}</span>
                                    </div>
                                    <button 
                                        className="btn btn-outline-dark w-100 mt-4 fw-semibold"
                                        onClick={() => {
                                            if (!isAuthenticated) {
                                                keycloak.login();
                                            } else {
                                                alert('El sistema de reservas estará disponible pronto.');
                                            }
                                        }}
                                    >
                                        Reservar Turno
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-dark text-white text-center py-4 mt-auto">
                <div className="container">
                    <p className="mb-0 text-muted small">
                        &copy; {new Date().getFullYear()} Barbería VIP. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
