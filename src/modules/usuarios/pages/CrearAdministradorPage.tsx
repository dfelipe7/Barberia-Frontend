
import { useState } from 'react';
import {
    Link,
    useNavigate,
} from 'react-router-dom';

import ErrorMessage from '../../../components/common/ErrorMessage';
import { usuariosService } from '../services/usuarios.service';

interface FormularioAdministrador {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
}
/**
 * PÁGINA PARA CREAR ADMINISTRADOR
 * 
 * ¿Qué hace esta pantalla?
 * - Presenta un formulario para registrar a un nuevo usuario con rol de ADMINISTRADOR.
 * - Este nuevo usuario se guardará automáticamente en Keycloak (para la seguridad)
 *   y en nuestra base de datos local de forma sincronizada.
 * - Valida campos como el correo y la longitud de la contraseña antes de enviar.
 */
export default function CrearAdministradorPage() {
    const navigate = useNavigate();

    const [formulario, setFormulario] =
        useState<FormularioAdministrador>({
            nombre: '',
            apellido: '',
            email: '',
            password: '',
        });

    const [errores, setErrores] = useState<
        Partial<
            Record<
                keyof FormularioAdministrador,
                string
            >
        >
    >({});

    const [cargando, setCargando] =
        useState(false);

    const [errorServidor, setErrorServidor] =
        useState('');

    const actualizarCampo = (
        campo: keyof FormularioAdministrador,
        valor: string,
    ) => {
        setFormulario((actual) => ({
            ...actual,
            [campo]: valor,
        }));

        setErrores((actuales) => ({
            ...actuales,
            [campo]: undefined,
        }));

        setErrorServidor('');
    };

    const validarFormulario = () => {
        const nuevosErrores: Partial<
            Record<
                keyof FormularioAdministrador,
                string
            >
        > = {};

        if (!formulario.nombre.trim()) {
            nuevosErrores.nombre =
                'El nombre es obligatorio.';
        }

        if (!formulario.apellido.trim()) {
            nuevosErrores.apellido =
                'El apellido es obligatorio.';
        }

        if (!formulario.email.trim()) {
            nuevosErrores.email =
                'El correo electrónico es obligatorio.';
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                formulario.email,
            )
        ) {
            nuevosErrores.email =
                'Ingrese un correo electrónico válido.';
        }

        if (!formulario.password) {
            nuevosErrores.password =
                'La contraseña es obligatoria.';
        } else if (
            formulario.password.length < 8
        ) {
            nuevosErrores.password =
                'La contraseña debe tener mínimo 8 caracteres.';
        }

        setErrores(nuevosErrores);

        return (
            Object.keys(nuevosErrores).length === 0
        );
    };

    const obtenerMensajeError = (error: any) => {
        const mensaje =
            error?.response?.data?.message;

        if (Array.isArray(mensaje)) {
            return mensaje.join(' ');
        }

        if (typeof mensaje === 'string') {
            return mensaje;
        }

        return 'No se pudo crear el administrador. Inténtelo nuevamente.';
    };

    const manejarEnvio = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setErrorServidor('');

        const formularioValido =
            validarFormulario();

        if (!formularioValido) {
            return;
        }

        setCargando(true);

        try {
            await usuariosService.crearAdministrador({
                nombre: formulario.nombre.trim(),
                apellido: formulario.apellido.trim(),
                email: formulario.email.trim(),
                password: formulario.password,
            });

            navigate('/usuarios', {
                state: {
                    mensaje:
                        'El administrador fue creado correctamente.',
                },
            });
        } catch (error) {
            console.error(
                'Error creando administrador:',
                error,
            );

            setErrorServidor(
                obtenerMensajeError(error),
            );
        } finally {
            setCargando(false);
        }
    };

    return (
        <div>
            <div className="mb-4">
                <h1>Crear administrador</h1>

                <p className="text-muted mb-0">
                    Registra un nuevo administrador del
                    sistema.
                </p>
            </div>

            {errorServidor && (
                <div className="mb-4">
                    <ErrorMessage
                        message={errorServidor}
                    />
                </div>
            )}

            <div className="card shadow-sm">
                <div className="card-body">
                    <form onSubmit={manejarEnvio}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label
                                    htmlFor="nombre"
                                    className="form-label"
                                >
                                    Nombre
                                </label>

                                <input
                                    type="text"
                                    id="nombre"
                                    className={`form-control ${errores.nombre
                                            ? 'is-invalid'
                                            : ''
                                        }`}
                                    value={formulario.nombre}
                                    onChange={(event) =>
                                        actualizarCampo(
                                            'nombre',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Ingrese el nombre"
                                    required
                                />

                                {errores.nombre && (
                                    <div className="invalid-feedback">
                                        {errores.nombre}
                                    </div>
                                )}
                            </div>

                            <div className="col-md-6">
                                <label
                                    htmlFor="apellido"
                                    className="form-label"
                                >
                                    Apellido
                                </label>

                                <input
                                    type="text"
                                    id="apellido"
                                    className={`form-control ${errores.apellido
                                            ? 'is-invalid'
                                            : ''
                                        }`}
                                    value={formulario.apellido}
                                    onChange={(event) =>
                                        actualizarCampo(
                                            'apellido',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Ingrese el apellido"
                                    required
                                />

                                {errores.apellido && (
                                    <div className="invalid-feedback">
                                        {errores.apellido}
                                    </div>
                                )}
                            </div>

                            <div className="col-12">
                                <label
                                    htmlFor="email"
                                    className="form-label"
                                >
                                    Correo electrónico
                                </label>

                                <input
                                    type="email"
                                    id="email"
                                    className={`form-control ${errores.email
                                            ? 'is-invalid'
                                            : ''
                                        }`}
                                    value={formulario.email}
                                    onChange={(event) =>
                                        actualizarCampo(
                                            'email',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="correo@ejemplo.com"
                                    required
                                />

                                {errores.email && (
                                    <div className="invalid-feedback">
                                        {errores.email}
                                    </div>
                                )}
                            </div>

                            <div className="col-12">
                                <label
                                    htmlFor="password"
                                    className="form-label"
                                >
                                    Contraseña
                                </label>

                                <input
                                    type="password"
                                    id="password"
                                    className={`form-control ${errores.password
                                            ? 'is-invalid'
                                            : ''
                                        }`}
                                    value={formulario.password}
                                    onChange={(event) =>
                                        actualizarCampo(
                                            'password',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Mínimo 8 caracteres"
                                    minLength={8}
                                    required
                                />

                                {errores.password && (
                                    <div className="invalid-feedback">
                                        {errores.password}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 d-flex gap-2">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={cargando}
                            >
                                {cargando ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                            aria-hidden="true"
                                        />

                                        Creando...
                                    </>
                                ) : (
                                    'Crear administrador'
                                )}
                            </button>

                            <Link
                                to="/usuarios"
                                className="btn btn-secondary"
                            >
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

