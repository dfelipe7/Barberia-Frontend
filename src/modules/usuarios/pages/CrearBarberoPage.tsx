
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import ErrorMessage from '../../../components/common/ErrorMessage';
import { usuariosService } from '../services/usuarios.service';

interface FormularioBarbero {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    password: string;
    porcentajeComision: string;
}
/**
 * PÁGINA PARA CREAR BARBERO
 * 
 * ¿Qué hace esta pantalla?
 * - Es casi idéntica a la de crear administrador, pero pide dos campos extra:
 *   'Teléfono' y 'Porcentaje de Comisión'.
 * - Estos datos viajan al backend, se registra la identidad en Keycloak y
 *   los datos extra (teléfono, comisión) se guardan en la tabla Barberos de MySQL.
 */
export default function CrearBarberoPage() {
    const navigate = useNavigate();

    const [formulario, setFormulario] =
        useState<FormularioBarbero>({
            nombre: '',
            apellido: '',
            email: '',
            telefono: '',
            password: '',
            porcentajeComision: '',
        });

    const [errores, setErrores] = useState<
        Partial<Record<keyof FormularioBarbero, string>>
    >({});

    const [cargando, setCargando] = useState(false);

    const [errorServidor, setErrorServidor] =
        useState('');

    const actualizarCampo = (
        campo: keyof FormularioBarbero,
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
            Record<keyof FormularioBarbero, string>
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

        if (!formulario.telefono.trim()) {
            nuevosErrores.telefono =
                'El teléfono es obligatorio.';
        }

        if (!formulario.password) {
            nuevosErrores.password =
                'La contraseña es obligatoria.';
        } else if (formulario.password.length < 8) {
            nuevosErrores.password =
                'La contraseña debe tener mínimo 8 caracteres.';
        }

        if (!formulario.porcentajeComision) {
            nuevosErrores.porcentajeComision =
                'La comisión es obligatoria.';
        } else {
            const comision = Number(
                formulario.porcentajeComision,
            );

            if (
                Number.isNaN(comision) ||
                comision < 0 ||
                comision > 100
            ) {
                nuevosErrores.porcentajeComision =
                    'La comisión debe estar entre 0 y 100.';
            }
        }

        setErrores(nuevosErrores);

        return Object.keys(nuevosErrores).length === 0;
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

        return 'No se pudo crear el barbero. Inténtelo nuevamente.';
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
            await usuariosService.crearBarbero({
                nombre: formulario.nombre.trim(),
                apellido: formulario.apellido.trim(),
                email: formulario.email.trim(),
                telefono: formulario.telefono.trim(),
                password: formulario.password,
                porcentajeComision: Number(
                    formulario.porcentajeComision,
                ),
            });

            navigate('/barberos', {
                state: {
                    mensaje:
                        'El barbero fue creado correctamente.',
                },
            });
        } catch (error) {
            console.error(
                'Error creando barbero:',
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
                <h1>Crear barbero</h1>

                <p className="text-muted mb-0">
                    Registra un nuevo barbero en la barbería.
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

                            <div className="col-md-6">
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

                            <div className="col-md-6">
                                <label
                                    htmlFor="telefono"
                                    className="form-label"
                                >
                                    Teléfono
                                </label>

                                <input
                                    type="tel"
                                    id="telefono"
                                    className={`form-control ${errores.telefono
                                            ? 'is-invalid'
                                            : ''
                                        }`}
                                    value={formulario.telefono}
                                    onChange={(event) =>
                                        actualizarCampo(
                                            'telefono',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Ingrese el teléfono"
                                    required
                                />

                                {errores.telefono && (
                                    <div className="invalid-feedback">
                                        {errores.telefono}
                                    </div>
                                )}
                            </div>

                            <div className="col-md-6">
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

                            <div className="col-md-6">
                                <label
                                    htmlFor="comision"
                                    className="form-label"
                                >
                                    Porcentaje de comisión
                                </label>

                                <div className="input-group">
                                    <input
                                        type="number"
                                        id="comision"
                                        className={`form-control ${errores.porcentajeComision
                                                ? 'is-invalid'
                                                : ''
                                            }`}
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={
                                            formulario.porcentajeComision
                                        }
                                        onChange={(event) =>
                                            actualizarCampo(
                                                'porcentajeComision',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Ej. 30"
                                        required
                                    />

                                    <span className="input-group-text">
                                        %
                                    </span>

                                    {errores.porcentajeComision && (
                                        <div className="invalid-feedback">
                                            {
                                                errores.porcentajeComision
                                            }
                                        </div>
                                    )}
                                </div>
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
                                    'Crear barbero'
                                )}
                            </button>

                            <Link
                                to="/barberos"
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
