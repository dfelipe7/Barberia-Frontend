import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { usuariosService } from '../services/usuarios.service';

const COLORES_ROL: Record<string, string> = {
    SUPERADMIN: 'danger',
    ADMINISTRADOR: 'warning',
    BARBERO: 'info',
};

const obtenerUrlFoto = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${baseUrl}${url}`;
};

export default function MiPerfilPage() {
    const { usuarioDb, refrescarPerfil } = useAuth();

    // ── Estado del formulario de datos personales ──────────────────────────────
    const [editando, setEditando] = useState(false);
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [guardandoDatos, setGuardandoDatos] = useState(false);
    const [errorDatos, setErrorDatos] = useState('');
    const [exitoDatos, setExitoDatos] = useState('');

    // ── Estado del formulario de contraseña ────────────────────────────────────
    const [contrasenaActual, setContrasenaActual] = useState('');
    const [nuevaContrasena, setNuevaContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');
    const [guardandoClave, setGuardandoClave] = useState(false);
    const [errorClave, setErrorClave] = useState('');
    const [exitoClave, setExitoClave] = useState('');

    // ── Estado de la foto de perfil (Barbero) ──────────────────────────────────
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [subiendoFoto, setSubiendoFoto] = useState(false);
    const [eliminandoFoto, setEliminandoFoto] = useState(false);
    const [errorFoto, setErrorFoto] = useState('');
    const [exitoFoto, setExitoFoto] = useState('');

    // Recargar datos frescos al entrar a la página
    useEffect(() => {
        refrescarPerfil();
    }, [refrescarPerfil]);

    // Sincronizar campos del formulario cuando llegan los datos de la BD
    useEffect(() => {
        if (usuarioDb) {
            setNombre(usuarioDb.nombre);
            setApellido(usuarioDb.apellido);
            setEmail(usuarioDb.email);
            setTelefono(usuarioDb.barbero?.telefono ?? '');
        }
    }, [usuarioDb]);

    const handleGuardarDatos = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorDatos('');
        setExitoDatos('');

        if (!nombre.trim() || !apellido.trim() || !email.trim()) {
            setErrorDatos('Nombre, apellido y correo son obligatorios.');
            return;
        }

        try {
            setGuardandoDatos(true);
            await usuariosService.actualizarUsuario(usuarioDb!.id, {
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                email: email.trim(),
                ...(usuarioDb?.barbero && telefono.trim() && { telefono: telefono.trim() }),
            });
            await refrescarPerfil();
            setExitoDatos('¡Información actualizada correctamente!');
            setEditando(false);
        } catch (err: any) {
            setErrorDatos(
                err?.response?.data?.message || 'No fue posible actualizar la información.'
            );
        } finally {
            setGuardandoDatos(false);
        }
    };

    const handleCambiarContrasena = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorClave('');
        setExitoClave('');

        if (nuevaContrasena.length < 8) {
            setErrorClave('La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (nuevaContrasena !== confirmarContrasena) {
            setErrorClave('La nueva contraseña y su confirmación no coinciden.');
            return;
        }

        try {
            setGuardandoClave(true);
            await usuariosService.cambiarContrasena({ contrasenaActual, nuevaContrasena });
            setExitoClave('¡Contraseña actualizada correctamente!');
            setContrasenaActual('');
            setNuevaContrasena('');
            setConfirmarContrasena('');
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            if (msg === 'La contraseña actual es incorrecta.') {
                setErrorClave('La contraseña actual que ingresaste es incorrecta.');
            } else {
                setErrorClave('Ocurrió un error al cambiar la contraseña. Inténtalo de nuevo.');
            }
        } finally {
            setGuardandoClave(false);
        }
    };

    const handleSeleccionarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setErrorFoto('');
        setExitoFoto('');

        if (file.size > 5 * 1024 * 1024) {
            setErrorFoto('La imagen supera el límite permitido de 5 MB.');
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
            setErrorFoto('Formato no válido. Solo se admiten imágenes JPG, PNG o WEBP.');
            return;
        }

        try {
            setSubiendoFoto(true);
            await usuariosService.subirFotoBarbero(file);
            await refrescarPerfil();
            setExitoFoto('¡Foto de perfil actualizada correctamente!');
        } catch (err: any) {
            setErrorFoto(err?.response?.data?.message || 'Error al subir la imagen.');
        } finally {
            setSubiendoFoto(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleEliminarFoto = async () => {
        if (!window.confirm('¿Seguro que deseas eliminar tu foto de perfil del catálogo?')) return;

        setErrorFoto('');
        setExitoFoto('');
        try {
            setEliminandoFoto(true);
            await usuariosService.eliminarFotoBarbero();
            await refrescarPerfil();
            setExitoFoto('Foto de perfil eliminada correctamente.');
        } catch (err: any) {
            setErrorFoto(err?.response?.data?.message || 'Error al eliminar la foto.');
        } finally {
            setEliminandoFoto(false);
        }
    };

    if (!usuarioDb) {
        return (
            <div className="d-flex justify-content-center mt-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4">
                <h1>Mi Perfil</h1>
                <p className="text-muted mb-0">
                    Gestiona tu información personal y la seguridad de tu cuenta.
                </p>
            </div>

            <div className="row">
                {/* ── Columna izquierda ─────────────────────────────── */}
                <div className="col-md-7">

                    {/* Tarjeta: Información General */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">Información General</h5>
                            {!editando && (
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => { setEditando(true); setExitoDatos(''); setErrorDatos(''); }}
                                >
                                    Editar
                                </button>
                            )}
                        </div>
                        <div className="card-body">
                            {exitoDatos && (
                                <div className="alert alert-success py-2 small">{exitoDatos}</div>
                            )}

                            {editando ? (
                                /* ── Modo edición ── */
                                <form onSubmit={handleGuardarDatos}>
                                    {errorDatos && (
                                        <div className="alert alert-danger py-2 small">{errorDatos}</div>
                                    )}
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Nombre</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                                disabled={guardandoDatos}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Apellido</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={apellido}
                                                onChange={(e) => setApellido(e.target.value)}
                                                disabled={guardandoDatos}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold">Correo electrónico</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={guardandoDatos}
                                            required
                                        />
                                    </div>

                                    {usuarioDb.barbero && (
                                        <div className="mb-3">
                                            <label className="form-label small fw-semibold">Teléfono</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={telefono}
                                                onChange={(e) => setTelefono(e.target.value)}
                                                disabled={guardandoDatos}
                                            />
                                        </div>
                                    )}

                                    <div className="d-flex gap-2 justify-content-end mt-4">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => { setEditando(false); setErrorDatos(''); }}
                                            disabled={guardandoDatos}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={guardandoDatos}
                                        >
                                            {guardandoDatos ? 'Guardando...' : 'Guardar cambios'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                /* ── Modo lectura ── */
                                <>
                                    <div className="row mb-3">
                                        <div className="col-sm-4 text-muted fw-semibold">Nombre completo</div>
                                        <div className="col-sm-8">{usuarioDb.nombre} {usuarioDb.apellido}</div>
                                    </div>
                                    <hr />
                                    <div className="row mb-3">
                                        <div className="col-sm-4 text-muted fw-semibold">Correo electrónico</div>
                                        <div className="col-sm-8">{usuarioDb.email}</div>
                                    </div>
                                    <hr />
                                    <div className="row mb-3">
                                        <div className="col-sm-4 text-muted fw-semibold">Rol principal</div>
                                        <div className="col-sm-8">
                                            <span className={`badge bg-${COLORES_ROL[usuarioDb.rol] || 'secondary'}`}>
                                                {usuarioDb.rol}
                                            </span>
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="row mb-3">
                                        <div className="col-sm-4 text-muted fw-semibold">Estado de cuenta</div>
                                        <div className="col-sm-8">
                                            <span className={`badge ${usuarioDb.estado === 'ACTIVO' ? 'bg-success' : 'bg-danger'}`}>
                                                {usuarioDb.estado === 'ACTIVO' ? 'Activa' : 'Bloqueada'}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Tarjeta: Información de Barbero (comisión de solo lectura) */}
                    {usuarioDb.barbero && (
                        <div className="card shadow-sm mb-4">
                            <div className="card-header bg-white py-3">
                                <h5 className="card-title mb-0">Información de Barbero</h5>
                            </div>
                            <div className="card-body">
                                <div className="row mb-3">
                                    <div className="col-sm-4 text-muted fw-semibold">Teléfono</div>
                                    <div className="col-sm-8">{usuarioDb.barbero.telefono}</div>
                                </div>
                                <hr />
                                <div className="row mb-3">
                                    <div className="col-sm-4 text-muted fw-semibold">Comisión asignada</div>
                                    <div className="col-sm-8">
                                        {usuarioDb.barbero.porcentajeComision}%
                                        <span className="ms-2 text-muted small">(solo puede modificarla un administrador)</span>
                                    </div>
                                </div>
                                <hr />
                                <div className="row mb-3">
                                    <div className="col-sm-4 text-muted fw-semibold">Visibilidad en catálogo</div>
                                    <div className="col-sm-8">
                                        <span className={`badge ${usuarioDb.barbero.estado === 'ACTIVO' ? 'bg-success' : 'bg-warning'}`}>
                                            {usuarioDb.barbero.estado}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Columna derecha: Foto Profesional y Seguridad ─ */}
                <div className="col-md-5">
                    {/* Tarjeta: Foto de Perfil Profesional (Solo para quienes tienen rol Barbero) */}
                    {usuarioDb.barbero && (
                        <div className="card shadow-sm mb-4">
                            <div className="card-header bg-white py-3">
                                <h5 className="card-title mb-0">Foto Profesional (Catálogo)</h5>
                            </div>
                            <div className="card-body text-center">
                                {errorFoto && <div className="alert alert-danger py-2 small">{errorFoto}</div>}
                                {exitoFoto && <div className="alert alert-success py-2 small">{exitoFoto}</div>}

                                <div className="d-inline-block position-relative mb-3">
                                    {usuarioDb.barbero.fotoUrl ? (
                                        <img
                                            src={obtenerUrlFoto(usuarioDb.barbero.fotoUrl)!}
                                            alt="Foto de Barbero"
                                            className="rounded-circle shadow-sm border border-3 border-primary"
                                            style={{ width: '130px', height: '130px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div
                                            className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto shadow-sm border border-2 border-secondary border-dashed"
                                            style={{ width: '130px', height: '130px' }}
                                        >
                                            <span className="text-muted fw-bold" style={{ fontSize: '2.5rem' }}>
                                                {usuarioDb.nombre.charAt(0)}{usuarioDb.apellido.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-muted small mb-3">
                                    Esta es la imagen visible para los clientes cuando vayan a reservar un servicio en el catálogo.
                                </p>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={handleSeleccionarFoto}
                                    style={{ display: 'none' }}
                                />

                                <div className="d-flex justify-content-center gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={subiendoFoto || eliminandoFoto}
                                    >
                                        {subiendoFoto ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                Subiendo...
                                            </>
                                        ) : (
                                            usuarioDb.barbero.fotoUrl ? 'Cambiar Foto' : 'Subir Foto'
                                        )}
                                    </button>

                                    {usuarioDb.barbero.fotoUrl && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={handleEliminarFoto}
                                            disabled={subiendoFoto || eliminandoFoto}
                                        >
                                            {eliminandoFoto ? 'Eliminando...' : 'Eliminar'}
                                        </button>
                                    )}
                                </div>
                                <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                                    Formatos: JPG, PNG o WEBP. Máx. 5 MB.
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-white py-3">
                            <h5 className="card-title mb-0">Cambiar Contraseña</h5>
                        </div>
                        <div className="card-body">
                            {errorClave && (
                                <div className="alert alert-danger py-2 small">{errorClave}</div>
                            )}
                            {exitoClave && (
                                <div className="alert alert-success py-2 small">{exitoClave}</div>
                            )}

                            <form onSubmit={handleCambiarContrasena}>
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold">Contraseña actual</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Tu contraseña actual"
                                        value={contrasenaActual}
                                        onChange={(e) => setContrasenaActual(e.target.value)}
                                        disabled={guardandoClave}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold">Nueva contraseña</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Mínimo 8 caracteres"
                                        value={nuevaContrasena}
                                        onChange={(e) => setNuevaContrasena(e.target.value)}
                                        disabled={guardandoClave}
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label small fw-semibold">Confirmar nueva contraseña</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Repite la nueva contraseña"
                                        value={confirmarContrasena}
                                        onChange={(e) => setConfirmarContrasena(e.target.value)}
                                        disabled={guardandoClave}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={guardandoClave}
                                >
                                    {guardandoClave ? 'Actualizando...' : 'Actualizar Contraseña'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {usuarioDb.rol === 'SUPERADMIN' && (
                        <div className="card shadow-sm border-danger">
                            <div className="card-body text-center">
                                <h5 className="card-title text-danger mb-3">Gestión Avanzada</h5>
                                <p className="card-text text-muted small mb-4">
                                    Como Superadmin, puedes modificar tus propios roles y privilegios en el sistema.
                                </p>
                                <Link
                                    to={`/usuarios/${usuarioDb.id}/editar`}
                                    className="btn btn-outline-danger w-100"
                                >
                                    Gestionar mis roles
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
