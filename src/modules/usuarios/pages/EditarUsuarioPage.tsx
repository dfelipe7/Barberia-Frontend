import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { usuariosService } from '../services/usuarios.service';

import Loading from '../../../components/common/Loading';
import ErrorMessage from '../../../components/common/ErrorMessage';

function EditarUsuarioPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');

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

                setNombre(usuario.nombre);
                setApellido(usuario.apellido);
                setEmail(usuario.email);
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

        if (!id) {
            setErrorFormulario(
                'No se encontró el usuario.',
            );
            return;
        }

        try {
            setGuardando(true);

            await usuariosService.actualizarUsuario(
                Number(id),
                {
                    nombre: nombre.trim(),
                    apellido: apellido.trim(),
                    email: email.trim(),
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