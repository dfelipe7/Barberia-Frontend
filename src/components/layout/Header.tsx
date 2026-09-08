import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

const ROLES_APP = ['SUPERADMIN', 'ADMINISTRADOR', 'BARBERO'];

const COLORES_ROL: Record<string, string> = {
    SUPERADMIN: 'danger',
    ADMINISTRADOR: 'warning',
    BARBERO: 'info',
};

export default function Header() {
    const {
        keycloak,
        nombre,
        apellido,
        roles,
        usuarioDb,
    } = useAuth();

    const [mostrarModalPerfil, setMostrarModalPerfil] = useState(false);

    const rolesApp = roles.filter((r) => ROLES_APP.includes(r));

    const cerrarSesion = () => {
        keycloak.logout({
            redirectUri: window.location.origin,
        });
    };

    return (
        <header>
            <nav className="navbar navbar-dark bg-dark">
                <div className="container-fluid">
                    <span className="navbar-brand mb-0 h1">
                        Barbería
                    </span>

                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-white">
                                {nombre} {apellido}
                            </span>

                            {rolesApp.map((rol) => (
                                <span key={rol} className={`badge bg-${COLORES_ROL[rol] || 'secondary'}`}>
                                    {rol}
                                </span>
                            ))}
                        </div>

                        <button
                            className="btn btn-outline-info btn-sm"
                            onClick={() => setMostrarModalPerfil(true)}
                        >
                            Mi Perfil
                        </button>
                        <button
                            className="btn btn-outline-light btn-sm"
                            onClick={cerrarSesion}
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </nav>

            {/* Modal de Mi Perfil */}
            {mostrarModalPerfil && usuarioDb && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Mi Perfil</h5>
                                <button type="button" className="btn-close" onClick={() => setMostrarModalPerfil(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <strong>Nombre completo:</strong> {usuarioDb.nombre} {usuarioDb.apellido}
                                </div>
                                <div className="mb-3">
                                    <strong>Correo electrónico:</strong> {usuarioDb.email}
                                </div>
                                <div className="mb-3">
                                    <strong>Rol principal:</strong> <span className={`badge bg-${COLORES_ROL[usuarioDb.rol] || 'secondary'}`}>{usuarioDb.rol}</span>
                                </div>
                                <div className="mb-3">
                                    <strong>Estado de cuenta:</strong>{' '}
                                    <span className={`badge ${usuarioDb.estado === 'ACTIVO' ? 'bg-success' : 'bg-danger'}`}>
                                        {usuarioDb.estado}
                                    </span>
                                </div>

                                {usuarioDb.barbero && (
                                    <>
                                        <hr />
                                        <h6 className="text-muted mb-3">Información de Barbero</h6>
                                        <div className="mb-3">
                                            <strong>Teléfono:</strong> {usuarioDb.barbero.telefono}
                                        </div>
                                        <div className="mb-3">
                                            <strong>Comisión:</strong> {usuarioDb.barbero.porcentajeComision}%
                                        </div>
                                        <div className="mb-3">
                                            <strong>Estado en el catálogo:</strong>{' '}
                                            <span className={`badge ${usuarioDb.barbero.estado === 'ACTIVO' ? 'bg-success' : 'bg-warning'}`}>
                                                {usuarioDb.barbero.estado}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setMostrarModalPerfil(false)}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
