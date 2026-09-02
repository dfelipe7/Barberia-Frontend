import { useAuth } from '../../auth/AuthContext';

export default function SinAcceso() {
    const { keycloak, email } = useAuth();

    const cerrarSesion = () => {
        keycloak.logout({
            redirectUri: window.location.origin,
        });
    };

    return (
        <div
            className="d-flex flex-column align-items-center justify-content-center text-center"
            style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}
        >
            <div className="card shadow p-5" style={{ maxWidth: 480 }}>
                <div className="mb-3" style={{ fontSize: '3rem' }}>🚫</div>

                <h1 className="h3 fw-bold mb-2">Sin acceso</h1>

                <p className="text-muted mb-1">
                    Tu cuenta <strong>{email}</strong> no tiene permisos para acceder a esta aplicación.
                </p>

                <p className="text-muted mb-4">
                    Contacta al administrador para que te asigne un rol.
                </p>

                <button
                    className="btn btn-dark"
                    onClick={cerrarSesion}
                >
                    Volver al inicio
                </button>
            </div>
        </div>
    );
}
