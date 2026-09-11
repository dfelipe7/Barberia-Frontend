import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { usuariosService } from '../services/usuarios.service';
import { useAuth } from '../../../auth/AuthContext';

import Loading from '../../../components/common/Loading';
import ErrorMessage from '../../../components/common/ErrorMessage';/**
 * PÁGINA PARA EDITAR USUARIO
 * 
 * ¿Qué hace esta pantalla?
 * - Se activa cuando haces clic en "Editar" sobre cualquier usuario en la tabla.
 * - Lee el 'id' de la URL (usando useParams) para saber a quién editar.
 * - Primero hace una petición para traer los datos actuales (nombre, apellido, email).
 * - Al guardar, envía la actualización al Backend (que a su vez actualiza Keycloak y MySQL).
 */
function EditarUsuarioPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { roles, usuarioDb } = useAuth();
    const esSuperadmin = roles.includes('SUPERADMIN');

    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');

    const [esBarbero, setEsBarbero] = useState(false);
    
    const [esAdministradorOriginal, setEsAdministradorOriginal] = useState(false);
    const [esAdministrador, setEsAdministrador] = useState(false);
    
    const [rolBase, setRolBase] = useState('');

    const [telefono, setTelefono] = useState('');
    const [comision, setComision] = useState(50);

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [error, setError] = useState('');
    const [errorFormulario, setErrorFormulario] = useState('');

    useEffect(() => {
        const cargarUsuario = async () => {
            if (!id) {
                setError('No se encontró el usuario.');
                setCargando(false);
                return;
            }

            try {
                const usuario =
                    await usuariosService.obtenerUsuario(
                        Number(id),
                    );

                setRolBase(usuario.rol);
                setNombre(usuario.nombre);
                setApellido(usuario.apellido);
                setEmail(usuario.email);

                const barberoEstado = usuario.barbero ? (usuario.barbero as any).estado : null;
                const esBarberoDb = !!(usuario.barbero && (barberoEstado === 'ACTIVO' || barberoEstado === undefined));
                setEsBarbero(esBarberoDb);
                
                if (usuario.barbero) {
                    setTelefono(usuario.barbero.telefono || '');
                    setComision(Number(usuario.barbero.porcentajeComision) || 50);
                }

                const adminEstado = usuario.administrador ? (usuario.administrador as any).estado : null;
                const esAdminDb = !!(
                    (usuario.administrador && (adminEstado === 'ACTIVO' || adminEstado === undefined)) ||
                    usuario.rol === 'ADMINISTRADOR' ||
                    usuario.rol === 'SUPERADMIN'
                );
                setEsAdministradorOriginal(esAdminDb);
                setEsAdministrador(esAdminDb);

                if (!esSuperadmin && esAdminDb && usuarioDb?.id !== Number(id)) {
                    setError('No tienes permisos para editar a otro administrador.');
                    setCargando(false);
                    return;
                }
                
            } catch (err: any) {
                console.error(err);

                setError(
                    err?.response?.data?.message ||
                    'No fue posible cargar la información del usuario.',
                );
            } finally {
                setCargando(false);
            }
        };

        cargarUsuario();
    }, [id]);

    const handleSubmit = async (
        e: React.FormEvent,
    ) => {
        e.preventDefault();

        setErrorFormulario('');

        if (!nombre.trim()) {
            setErrorFormulario(
                'El nombre es obligatorio.',
            );
            return;
        }

        if (!apellido.trim()) {
            setErrorFormulario(
                'El apellido es obligatorio.',
            );
            return;
        }

        if (!email.trim()) {
            setErrorFormulario(
                'El correo electrónico es obligatorio.',
            );
            return;
        }

        const emailValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailValido.test(email)) {
            setErrorFormulario(
                'Ingrese un correo electrónico válido.',
            );
            return;
        }

        if (esBarbero) {
            if (!telefono.trim()) {
                setErrorFormulario('El teléfono es obligatorio para los barberos.');
                return;
            }
            if (comision < 0 || comision > 100) {
                setErrorFormulario('La comisión debe estar entre 0 y 100.');
                return;
            }
        }

        if (!id) {
            setErrorFormulario(
                'No se encontró el usuario.',
            );
            return;
        }

        if (!esBarbero && !esAdministrador) {
            const confirmar = window.confirm(
                'Estás a punto de quitarle todos los roles a este usuario. Esto bloqueará su cuenta globalmente. ¿Deseas continuar?'
            );
            if (!confirmar) {
                return;
            }
        }

        try {
            setGuardando(true);

            await usuariosService.actualizarUsuario(
                Number(id),
                {
                    nombre: nombre.trim(),
                    apellido: apellido.trim(),
                    email: email.trim(),
                    ...(rolBase !== 'SUPERADMIN' && {
                        esAdministrador,
                    }),
                    esBarbero,
                    ...(esBarbero && {
                        telefono: telefono.trim(),
                        porcentajeComision: comision,
                    }),
                },
            );

            navigate('/usuarios', {
                state: {
                    mensaje:
                        'El usuario fue actualizado correctamente.',
                },
            });
        } catch (err: any) {
            console.error(err);

            setErrorFormulario(
                err?.response?.data?.message ||
                'No fue posible actualizar el usuario.',
            );
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="container-fluid">
                <ErrorMessage message={error} />

                <Link
                    to="/usuarios"
                    className="btn btn-secondary mt-3"
                >
                    ← Volver
                </Link>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Editar usuario</h2>

                    <p className="text-muted mb-0">
                        Modifica la información del usuario.
                    </p>
                </div>

                <Link
                    to="/usuarios"
                    className="btn btn-outline-secondary"
                >
                    ← Volver
                </Link>
            </div>

            <div className="card shadow-sm">
                <div className="card-body">
                    {errorFormulario && (
                        <div className="alert alert-danger">
                            {errorFormulario}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Nombre
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    value={nombre}
                                    onChange={(e) =>
                                        setNombre(
                                            e.target.value,
                                        )
                                    }
                                    disabled={guardando}
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Apellido
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    value={apellido}
                                    onChange={(e) =>
                                        setApellido(
                                            e.target.value,
                                        )
                                    }
                                    disabled={guardando}
                                />
                            </div>

                            <div className="col-md-12 mb-3">
                                <label className="form-label">
                                    Correo electrónico
                                </label>

                                <input
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value,
                                        )
                                    }
                                    disabled={guardando}
                                />
                            </div>

                            <div className="col-md-12 mt-4 mb-3">
                                <div className="card border-primary shadow-sm">
                                    <div className="card-header bg-primary text-white">
                                        <h5 className="mb-0">Roles y Permisos del Usuario</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            {/* ROL DE SUPERADMIN O ADMINISTRADOR */}
                                            {rolBase === 'SUPERADMIN' ? (
                                                <div className="col-md-6 mb-3">
                                                    <div className="d-flex align-items-center p-3 border rounded bg-light border-warning">
                                                        <div className="w-100">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <span className="fw-semibold fs-5 text-dark">Superadministrador</span>
                                                                <span className="badge bg-warning text-dark">Rol Permanente</span>
                                                            </div>
                                                            <div className="small text-muted fs-6 mt-1">
                                                                Cuenta principal del sistema. Este rol no puede ser modificado ni removido.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="col-md-6 mb-3">
                                                    <div className="d-flex align-items-center p-3 border rounded bg-light">
                                                        <div className="form-check form-switch fs-5 mb-0 w-100">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id="esAdministradorCheck"
                                                                checked={esAdministrador}
                                                                onChange={(e) => setEsAdministrador(e.target.checked)}
                                                                disabled={guardando || !esSuperadmin || (usuarioDb?.id === Number(id) && esAdministradorOriginal)}
                                                            />
                                                            <label className="form-check-label ms-2 fw-semibold" htmlFor="esAdministradorCheck">
                                                                Administrador
                                                            </label>
                                                            <div className="small text-muted fs-6 ms-2 mt-1">
                                                                {!esSuperadmin
                                                                    ? 'Solo el Superadministrador puede otorgar o revocar este rol.'
                                                                    : usuarioDb?.id === Number(id) && esAdministradorOriginal
                                                                    ? 'No puedes remover tu propio rol de Administrador.'
                                                                    : 'Otorga acceso total al panel de control y gestión.'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ROL DE BARBERO */}
                                            <div className="col-md-6 mb-3">
                                                <div className="d-flex align-items-center p-3 border rounded bg-light">
                                                    <div className="form-check form-switch fs-5 mb-0 w-100">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id="esBarberoCheck"
                                                            checked={esBarbero}
                                                            onChange={(e) => setEsBarbero(e.target.checked)}
                                                            disabled={guardando || (rolBase === 'BARBERO' && !esAdministrador && usuarioDb?.id === Number(id))}
                                                        />
                                                        <label className="form-check-label ms-2 fw-semibold" htmlFor="esBarberoCheck">
                                                            Barbero
                                                        </label>
                                                        <div className="small text-muted fs-6 ms-2 mt-1">
                                                            {rolBase === 'BARBERO' && !esAdministrador && usuarioDb?.id === Number(id)
                                                                ? 'No puedes remover tu único rol de Barbero.'
                                                                : 'Otorga perfil público y gestión de agenda.'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {esBarbero && (
                                <>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            Teléfono (Barbero)
                                        </label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            value={telefono}
                                            onChange={(e) =>
                                                setTelefono(e.target.value)
                                            }
                                            disabled={guardando}
                                        />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            Porcentaje de comisión: <span className="fw-bold">{comision}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            className="form-range"
                                            value={comision}
                                            onChange={(e) =>
                                                setComision(Number(e.target.value))
                                            }
                                            min="0"
                                            max="100"
                                            step="5"
                                            disabled={guardando}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="d-flex justify-content-end gap-2">
                            <Link
                                to="/usuarios"
                                className="btn btn-secondary"
                            >
                                Cancelar
                            </Link>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={guardando}
                            >
                                {guardando
                                    ? 'Guardando...'
                                    : 'Guardar cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default EditarUsuarioPage;