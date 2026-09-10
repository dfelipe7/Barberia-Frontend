import { useAuth } from '../../auth/AuthContext';

const ROLES_APP = ['SUPERADMIN', 'ADMINISTRADOR', 'BARBERO'];

export default function SinAcceso() {
    const { keycloak, email, roles } = useAuth();

    const cerrarSesion = () => {
        keycloak.logout({
            redirectUri: window.location.origin,
        });
    };

    // ¿El usuario está autenticado pero sin ningún rol reconocido del sistema?
    const sinRolesAsignados = roles.every((r) => !ROLES_APP.includes(r));

    return (
        <div
            className="d-flex flex-column align-items-center justify-content-center text-center"
            style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}
        >
            <div className="card shadow p-5" style={{ maxWidth: 500 }}>
                <div className="mb-3" style={{ fontSize: '3rem' }}>
                    {sinRolesAsignados ? '⚠️' : '🚫'}
                </div>

                <h1 className="h3 fw-bold mb-2">
                    {sinRolesAsignados ? 'Sin roles asignados' : 'Sin acceso'}
                </h1>

                {sinRolesAsignados ? (
                    <>
                        <p className="text-muted mb-1">
                            Tu cuenta <strong>{email}</strong> está activa pero no tiene ningún rol
                            habilitado en el sistema.
                        </p>
                        <p className="text-muted mb-4">
                            Contacta al administrador para que te asigne o reactive tu rol de
                            <strong> Administrador</strong> o <strong>Barbero</strong>.
                        </p>
                    </>
                ) : (
                    <>
                        <p className="text-muted mb-1">
                            Tu cuenta <strong>{email}</strong> no tiene permisos para acceder a esta aplicación.
                        </p>
                        <p className="text-muted mb-4">
                            Contacta al administrador para que te asigne un rol.
                        </p>
                    </>
                )}

                <button
                    className="btn btn-dark"
                    onClick={cerrarSesion}
                >
                    Cerrar sesión
                </button>
            </div>
        </div>
    );
}
