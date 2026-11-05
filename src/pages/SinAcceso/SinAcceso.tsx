import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { esRolApp } from '../../shared/lib/autorizacion/roles';
import BrandLogo from '../../shared/ui/BrandLogo';

export default function SinAcceso() {
    const { cerrarSesion, email, roles, usuarioDb } = useAuth();
    const navigate = useNavigate();

    const cuentaBloqueada = usuarioDb?.estado === 'INACTIVO';
    // ¿El usuario está autenticado pero sin ningún rol reconocido del sistema?
    const sinRolesAsignados = roles.every((r) => !esRolApp(r));
    const tieneRolApp = roles.some((r) => esRolApp(r));

    return (
        <div
            className="d-flex flex-column align-items-center justify-content-center text-center p-3 bg-surface-app"
            style={{ minHeight: '100vh' }}
        >
            <div className="card-surface card shadow p-4 p-md-5" style={{ maxWidth: 500, width: '100%' }}>
                <div className="mb-4">
                    <BrandLogo variant="auto" height={36} />
                </div>

                <div className="mb-3" style={{ fontSize: '2.5rem' }}>
                    {cuentaBloqueada ? '🔒' : sinRolesAsignados ? '⚠️' : '🛡️'}
                </div>

                <h1 className="h3 fw-bold mb-2">
                    {cuentaBloqueada
                        ? 'Cuenta bloqueada'
                        : sinRolesAsignados
                        ? 'Sin roles asignados'
                        : 'Acceso restringido'}
                </h1>

                {cuentaBloqueada ? (
                    <>
                        <p className="text-surface-muted mb-1">
                            Tu cuenta <strong>{email}</strong> ha sido bloqueada globalmente por un administrador.
                        </p>
                        <p className="text-surface-muted mb-4">
                            No tienes acceso al sistema mientras tu cuenta permanezca inactiva. Comunícate con la administración para más información.
                        </p>
                    </>
                ) : sinRolesAsignados ? (
                    <>
                        <p className="text-surface-muted mb-1">
                            Tu cuenta <strong>{email}</strong> está activa pero no tiene ningún rol
                            habilitado en el sistema.
                        </p>
                        <p className="text-surface-muted mb-4">
                            Contacta al administrador para que te asigne o reactive tu rol de
                            <strong> Administrador</strong> o <strong>Barbero</strong>.
                        </p>
                    </>
                ) : (
                    <>
                        <p className="text-surface-muted mb-1">
                            Tu cuenta <strong>{email}</strong> tiene rol activo (<strong>{roles.filter(esRolApp).join(', ')}</strong>), pero la sección solicitada requiere permisos administrativos adicionales.
                        </p>
                        <p className="text-surface-muted mb-4">
                            Puedes volver a tu panel principal para continuar accediendo a tus funciones permitidas.
                        </p>
                    </>
                )}

                <div className="d-flex flex-wrap gap-2 justify-content-center">
                    {tieneRolApp && !cuentaBloqueada && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => navigate('/dashboard')}
                        >
                            Ir a mi Dashboard
                        </button>
                    )}
                    <button
                        type="button"
                        className={tieneRolApp && !cuentaBloqueada ? 'btn btn-outline-secondary' : 'btn btn-primary'}
                        onClick={() => cerrarSesion()}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
