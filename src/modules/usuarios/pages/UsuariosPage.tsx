import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../auth/AuthContext';

import Loading from '../../../components/common/Loading';
import ErrorMessage from '../../../components/common/ErrorMessage';

import {
    usuariosService,
    type AdministradorGestion,
    type BarberoGestion,
} from '../services/usuarios.service';

type Pestaña = 'administradores' | 'barberos';

export default function UsuariosPage() {
    const { roles } = useAuth();

    const location = useLocation();
    const navigate = useNavigate();

    const esSuperAdmin =
        roles.includes('SUPERADMIN');

    const esAdministrador =
        roles.includes('ADMINISTRADOR');

    const [pestañaActiva, setPestañaActiva] =
        useState<Pestaña>(
            esSuperAdmin
                ? 'administradores'
                : 'barberos',
        );

    const [administradores, setAdministradores] =
        useState<AdministradorGestion[]>([]);

    const [barberos, setBarberos] =
        useState<BarberoGestion[]>([]);

    const [
        cargandoAdministradores,
        setCargandoAdministradores,
    ] = useState(false);

    const [
        cargandoBarberos,
        setCargandoBarberos,
    ] = useState(false);

    const [
        cambiandoEstado,
        setCambiandoEstado,
    ] = useState<number | null>(null);

    const [
        actualizandoComision,
        setActualizandoComision,
    ] = useState(false);

    const [
        barberoSeleccionado,
        setBarberoSeleccionado,
    ] = useState<BarberoGestion | null>(null);

    const [
        porcentajeSeleccionado,
        setPorcentajeSeleccionado,
    ] = useState(0);

    const [
        errorAdministradores,
        setErrorAdministradores,
    ] = useState('');

    const [
        errorBarberos,
        setErrorBarberos,
    ] = useState('');

    const [
        errorEstado,
        setErrorEstado,
    ] = useState('');

    const [
        errorComision,
        setErrorComision,
    ] = useState('');

    const [
        modalConfigurarBarberoAbierto,
        setModalConfigurarBarberoAbierto,
    ] = useState(false);

    const [
        adminAConfigurar,
        setAdminAConfigurar,
    ] = useState<AdministradorGestion | null>(null);

    const [telefonoBarbero, setTelefonoBarbero] = useState('');
    const [comisionBarbero, setComisionBarbero] = useState(50);
    const [configurandoBarbero, setConfigurandoBarbero] = useState(false);
    const [errorConfigurarBarbero, setErrorConfigurarBarbero] = useState('');

    const [usuarioDetalles, setUsuarioDetalles] = useState<AdministradorGestion | BarberoGestion | null>(null);

    /*
     * ==========================================================
     * CONFIGURAR BARBERO
     * ==========================================================
     */

    const abrirModalConfigurarBarbero = (admin: AdministradorGestion | null) => {
        setAdminAConfigurar(admin);
        setTelefonoBarbero('');
        setComisionBarbero(50);
        setErrorConfigurarBarbero('');
        setModalConfigurarBarberoAbierto(true);
    };

    const cerrarModalConfigurarBarbero = () => {
        if (configurandoBarbero) return;
        setModalConfigurarBarberoAbierto(false);
        setAdminAConfigurar(null);
    };

    const guardarConfiguracionBarbero = async () => {
        if (!telefonoBarbero.trim()) {
            setErrorConfigurarBarbero('El teléfono es obligatorio');
            return;
        }

        try {
            setConfigurandoBarbero(true);
            setErrorConfigurarBarbero('');

            const datos = {
                telefono: telefonoBarbero,
                porcentajeComision: comisionBarbero
            };

            if (adminAConfigurar) {
                await usuariosService.configurarBarbero(adminAConfigurar.id, datos);
                window.alert('Perfil de barbero asignado correctamente.');
            } else {
                await usuariosService.configurarMeComoBarbero(datos);
                window.alert('¡Te has convertido en barbero exitosamente! Por favor inicia sesión nuevamente si es necesario.');
                window.location.reload();
                return;
            }

            cerrarModalConfigurarBarbero();
        } catch (error: any) {
            setErrorConfigurarBarbero(
                error?.response?.data?.message || 'Error al asignar el perfil de barbero'
            );
        } finally {
            setConfigurandoBarbero(false);
        }
    };

    /*
     * ==========================================================
     * CARGAR ADMINISTRADORES
     * ==========================================================
     */

    useEffect(() => {
        if (
            pestañaActiva !== 'administradores' ||
            !esSuperAdmin
        ) {
            return;
        }

        const cargarAdministradores = async () => {
            setCargandoAdministradores(true);
            setErrorAdministradores('');

            try {
                const datos =
                    await usuariosService.obtenerAdministradores();

                setAdministradores(datos);
            } catch (error) {
                console.error(
                    'Error cargando administradores:',
                    error,
                );

                setErrorAdministradores(
                    'No se pudieron cargar los administradores.',
                );
            } finally {
                setCargandoAdministradores(false);
            }
        };

        cargarAdministradores();
    }, [
        pestañaActiva,
        esSuperAdmin,
    ]);

    /*
     * ==========================================================
     * CARGAR BARBEROS
     * ==========================================================
     */

    useEffect(() => {
        if (
            pestañaActiva !== 'barberos' ||
            (!esSuperAdmin && !esAdministrador)
        ) {
            return;
        }

        const cargarBarberos = async () => {
            setCargandoBarberos(true);
            setErrorBarberos('');

            try {
                const datos =
                    await usuariosService.obtenerBarberosGestion();

                setBarberos(datos);
            } catch (error) {
                console.error(
                    'Error cargando barberos:',
                    error,
                );

                setErrorBarberos(
                    'No se pudieron cargar los barberos.',
                );
            } finally {
                setCargandoBarberos(false);
            }
        };

        cargarBarberos();
    }, [
        pestañaActiva,
        esSuperAdmin,
        esAdministrador,
    ]);

    /*
     * ==========================================================
     * CAMBIAR ESTADO DE BARBERO
     * ==========================================================
     */

    const cambiarEstadoBarbero = async (
        barbero: BarberoGestion,
    ) => {
        const nuevoEstado =
            barbero.estado === 'ACTIVO'
                ? 'INACTIVO'
                : 'ACTIVO';

        const accion =
            nuevoEstado === 'ACTIVO'
                ? 'activar'
                : 'desactivar';

        const confirmar = window.confirm(
            `¿Está seguro de que desea ${accion} al barbero ${barbero.nombre} ${barbero.apellido}?`,
        );

        if (!confirmar) {
            return;
        }

        try {
            setCambiandoEstado(barbero.id);
            setErrorEstado('');

            await usuariosService.cambiarEstadoBarbero(
                barbero.id,
                {
                    estado: nuevoEstado,
                },
            );

            setBarberos(
                (barberosActuales) =>
                    barberosActuales.map(
                        (item) =>
                            item.id === barbero.id
                                ? {
                                    ...item,
                                    estado: nuevoEstado,
                                }
                                : item,
                    ),
            );
        } catch (error: any) {
            console.error(
                'Error cambiando estado:',
                error,
            );

            setErrorEstado(
                error?.response?.data?.message ||
                'No fue posible cambiar el estado del barbero.',
            );
        } finally {
            setCambiandoEstado(null);
        }
    };

    /*
     * ==========================================================
     * CAMBIAR ESTADO DE ADMINISTRADOR
     * ==========================================================
     */

    const cambiarEstadoAdministrador = async (
        administrador: AdministradorGestion,
    ) => {
        const nuevoEstado =
            administrador.estado === 'ACTIVO'
                ? 'INACTIVO'
                : 'ACTIVO';

        const accion =
            nuevoEstado === 'ACTIVO'
                ? 'activar'
                : 'desactivar';

        const confirmar = window.confirm(
            `¿Está seguro de que desea ${accion} al administrador ${administrador.nombre} ${administrador.apellido}?`,
        );

        if (!confirmar) {
            return;
        }

        try {
            setCambiandoEstado(administrador.id);
            setErrorEstado('');

            await usuariosService.cambiarEstado(
                administrador.id,
                {
                    estado: nuevoEstado,
                },
            );

            setAdministradores(
                (administradoresActuales) =>
                    administradoresActuales.map(
                        (item) =>
                            item.id === administrador.id
                                ? {
                                    ...item,
                                    estado: nuevoEstado,
                                }
                                : item,
                    ),
            );
        } catch (error: any) {
            console.error(
                'Error cambiando estado:',
                error,
            );

            setErrorEstado(
                error?.response?.data?.message ||
                'No fue posible cambiar el estado del administrador.',
            );
        } finally {
            setCambiandoEstado(null);
        }
    };

    /*
     * ==========================================================
     * ABRIR MODAL DE COMISIÓN
     * ==========================================================
     */

    const abrirModalComision = (
        barbero: BarberoGestion,
    ) => {
        setBarberoSeleccionado(barbero);
        setPorcentajeSeleccionado(
            barbero.porcentajeComision,
        );
        setErrorComision('');
    };

    /*
     * ==========================================================
     * CERRAR MODAL DE COMISIÓN
     * ==========================================================
     */

    const cerrarModalComision = () => {
        if (actualizandoComision) {
            return;
        }

        setBarberoSeleccionado(null);
        setErrorComision('');
    };

    /*
     * ==========================================================
     * ACTUALIZAR COMISIÓN
     * ==========================================================
     */

    const guardarComision = async () => {
        if (!barberoSeleccionado) {
            return;
        }

        if (
            porcentajeSeleccionado < 0 ||
            porcentajeSeleccionado > 100
        ) {
            setErrorComision(
                'La comisión debe estar entre 0% y 100%.',
            );
            return;
        }

        try {
            setActualizandoComision(true);
            setErrorComision('');

            await usuariosService.actualizarComision(
                barberoSeleccionado.id,
                {
                    porcentajeComision:
                        porcentajeSeleccionado,
                },
            );

            setBarberos(
                (barberosActuales) =>
                    barberosActuales.map(
                        (item) =>
                            item.id ===
                                barberoSeleccionado.id
                                ? {
                                    ...item,
                                    porcentajeComision:
                                        porcentajeSeleccionado,
                                }
                                : item,
                    ),
            );

            cerrarModalComision();
        } catch (error: any) {
            console.error(
                'Error actualizando comisión:',
                error,
            );

            setErrorComision(
                error?.response?.data?.message ||
                'No fue posible actualizar la comisión.',
            );
        } finally {
            setActualizandoComision(false);
        }
    };

    /*
     * ==========================================================
     * MENSAJE DE ÉXITO
     * ==========================================================
     */

    const mensaje =
        location.state?.mensaje;

    return (
        <div>
            <div className="mb-4">
                <h1>Gestión de usuarios</h1>

                <p className="text-muted mb-0">
                    Administra los usuarios y perfiles de la
                    barbería.
                </p>
            </div>

            {/* ================================================== */}
            {/* MENSAJE DE OPERACIÓN EXITOSA */}
            {/* ================================================== */}

            {mensaje && (
                <div
                    className="alert alert-success alert-dismissible fade show"
                    role="alert"
                >
                    {mensaje}

                    <button
                        type="button"
                        className="btn-close"
                        aria-label="Cerrar"
                        onClick={() => {
                            navigate(
                                location.pathname,
                                {
                                    replace: true,
                                    state: {},
                                },
                            );
                        }}
                    />
                </div>
            )}

            {/* ================================================== */}
            {/* ERROR AL CAMBIAR ESTADO */}
            {/* ================================================== */}

            {errorEstado && (
                <ErrorMessage
                    message={errorEstado}
                />
            )}

            {/* ================================================== */}
            {/* PESTAÑAS */}
            {/* ================================================== */}

            <ul className="nav nav-tabs mb-4">
                {esSuperAdmin && (
                    <li className="nav-item">
                        <button
                            type="button"
                            className={`nav-link ${pestañaActiva ===
                                    'administradores'
                                    ? 'active'
                                    : ''
                                }`}
                            onClick={() =>
                                setPestañaActiva(
                                    'administradores',
                                )
                            }
                        >
                            Administradores
                        </button>
                    </li>
                )}

                {(esSuperAdmin ||
                    esAdministrador) && (
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link ${pestañaActiva ===
                                        'barberos'
                                        ? 'active'
                                        : ''
                                    }`}
                                onClick={() =>
                                    setPestañaActiva(
                                        'barberos',
                                    )
                                }
                            >
                                Barberos
                            </button>
                        </li>
                    )}
            </ul>

            {/* ================================================== */}
            {/* ADMINISTRADORES */}
            {/* ================================================== */}

            {pestañaActiva ===
                'administradores' &&
                esSuperAdmin && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h3>
                                    Administradores
                                </h3>

                                <p className="text-muted mb-0">
                                    Gestiona los administradores
                                    del sistema.
                                </p>
                            </div>

                            <div className="d-flex gap-2">
                                {!roles.includes('BARBERO') && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={() => abrirModalConfigurarBarbero(null)}
                                    >
                                        Quiero ser barbero
                                    </button>
                                )}
                                <Link
                                    to="/administradores/nuevo"
                                    className="btn btn-primary"
                                >
                                    + Nuevo administrador
                                </Link>
                            </div>
                        </div>

                        {cargandoAdministradores && (
                            <Loading />
                        )}

                        {errorAdministradores && (
                            <ErrorMessage
                                message={
                                    errorAdministradores
                                }
                            />
                        )}

                        {!cargandoAdministradores &&
                            !errorAdministradores &&
                            administradores.length ===
                            0 && (
                                <div className="alert alert-info">
                                    No hay administradores
                                    registrados.
                                </div>
                            )}

                        {!cargandoAdministradores &&
                            !errorAdministradores &&
                            administradores.length >
                            0 && (
                                <div className="card shadow-sm">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead>
                                                <tr>
                                                    <th>
                                                        Nombre
                                                    </th>

                                                    <th>
                                                        Correo
                                                    </th>

                                                    <th>
                                                        Estado
                                                    </th>

                                                    <th>
                                                        Acciones
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {administradores.map(
                                                    (
                                                        administrador,
                                                    ) => (
                                                        <tr
                                                            key={
                                                                administrador.id
                                                            }
                                                        >
                                                            <td>
                                                                {
                                                                    administrador.nombre
                                                                }{' '}
                                                                {
                                                                    administrador.apellido
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    administrador.email
                                                                }
                                                            </td>

                                                            <td>
                                                                <span
                                                                    className={`badge ${administrador.estado ===
                                                                            'ACTIVO'
                                                                            ? 'text-bg-success'
                                                                            : 'text-bg-secondary'
                                                                        }`}
                                                                >
                                                                    {
                                                                        administrador.estado
                                                                    }
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <div className="d-flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline-secondary"
                                                                        onClick={() => setUsuarioDetalles(administrador)}
                                                                    >
                                                                        Ver
                                                                    </button>

                                                                    <Link
                                                                        to={`/usuarios/${administrador.id}/editar`}
                                                                        className="btn btn-sm btn-outline-primary"
                                                                    >
                                                                        Editar
                                                                    </Link>

                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline-info"
                                                                        onClick={() => abrirModalConfigurarBarbero(administrador)}
                                                                    >
                                                                        Hacer barbero
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className={`btn btn-sm ${administrador.estado ===
                                                                                'ACTIVO'
                                                                                ? 'btn-outline-danger'
                                                                                : 'btn-outline-success'
                                                                            }`}
                                                                        disabled={
                                                                            cambiandoEstado ===
                                                                            administrador.id
                                                                        }
                                                                        onClick={() =>
                                                                            cambiarEstadoAdministrador(
                                                                                administrador,
                                                                            )
                                                                        }
                                                                    >
                                                                        {cambiandoEstado ===
                                                                            administrador.id
                                                                            ? 'Procesando...'
                                                                            : administrador.estado ===
                                                                                'ACTIVO'
                                                                                ? 'Desactivar'
                                                                                : 'Activar'}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                    </div>
                )}

            {/* ================================================== */}
            {/* BARBEROS */}
            {/* ================================================== */}

            {pestañaActiva === 'barberos' &&
                (esSuperAdmin ||
                    esAdministrador) && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h3>Barberos</h3>

                                <p className="text-muted mb-0">
                                    Gestiona los barberos de la
                                    barbería.
                                </p>
                            </div>

                            <Link
                                to="/barberos/nuevo"
                                className="btn btn-primary"
                            >
                                + Nuevo barbero
                            </Link>
                        </div>

                        {cargandoBarberos && (
                            <Loading />
                        )}

                        {errorBarberos && (
                            <ErrorMessage
                                message={errorBarberos}
                            />
                        )}

                        {!cargandoBarberos &&
                            !errorBarberos &&
                            barberos.length === 0 && (
                                <div className="alert alert-info">
                                    No hay barberos registrados.
                                </div>
                            )}

                        {!cargandoBarberos &&
                            !errorBarberos &&
                            barberos.length > 0 && (
                                <div className="card shadow-sm">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead>
                                                <tr>
                                                    <th>
                                                        Nombre
                                                    </th>

                                                    <th>
                                                        Correo
                                                    </th>

                                                    <th>
                                                        Teléfono
                                                    </th>

                                                    <th>
                                                        Comisión
                                                    </th>

                                                    <th>
                                                        Estado
                                                    </th>

                                                    <th>
                                                        Acciones
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {barberos.map(
                                                    (
                                                        barbero,
                                                    ) => (
                                                        <tr
                                                            key={
                                                                barbero.id
                                                            }
                                                        >
                                                            <td>
                                                                {
                                                                    barbero.nombre
                                                                }{' '}
                                                                {
                                                                    barbero.apellido
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    barbero.email
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    barbero.telefono
                                                                }
                                                            </td>

                                                            <td>
                                                                <span className="fw-semibold">
                                                                    {
                                                                        barbero.porcentajeComision
                                                                    }
                                                                    %
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <span
                                                                    className={`badge ${barbero.estado ===
                                                                            'ACTIVO'
                                                                            ? 'text-bg-success'
                                                                            : 'text-bg-secondary'
                                                                        }`}
                                                                >
                                                                    {
                                                                        barbero.estado
                                                                    }
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <div className="d-flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline-secondary"
                                                                        onClick={() => setUsuarioDetalles(barbero)}
                                                                    >
                                                                        Ver
                                                                    </button>

                                                                    <Link
                                                                        to={`/usuarios/${barbero.id}/editar`}
                                                                        className="btn btn-sm btn-outline-primary"
                                                                    >
                                                                        Editar
                                                                    </Link>

                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline-dark"
                                                                        onClick={() =>
                                                                            abrirModalComision(
                                                                                barbero,
                                                                            )
                                                                        }
                                                                    >
                                                                        Comisión
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className={`btn btn-sm ${barbero.estado ===
                                                                                'ACTIVO'
                                                                                ? 'btn-outline-danger'
                                                                                : 'btn-outline-success'
                                                                            }`}
                                                                        disabled={
                                                                            cambiandoEstado ===
                                                                            barbero.id
                                                                        }
                                                                        onClick={() =>
                                                                            cambiarEstadoBarbero(
                                                                                barbero,
                                                                            )
                                                                        }
                                                                    >
                                                                        {cambiandoEstado ===
                                                                            barbero.id
                                                                            ? 'Procesando...'
                                                                            : barbero.estado ===
                                                                                'ACTIVO'
                                                                                ? 'Desactivar'
                                                                                : 'Activar'}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                    </div>
                )}

            {/* ================================================== */}
            {/* MODAL DE COMISIÓN */}
            {/* ================================================== */}

            {barberoSeleccionado && (
                <div
                    className="modal fade show"
                    style={{
                        display: 'block',
                        backgroundColor:
                            'rgba(0, 0, 0, 0.5)',
                    }}
                    tabIndex={-1}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        role="document"
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <div>
                                    <h5 className="modal-title mb-1">
                                        Configurar comisión
                                    </h5>

                                    <small className="text-muted">
                                        {
                                            barberoSeleccionado.nombre
                                        }{' '}
                                        {
                                            barberoSeleccionado.apellido
                                        }
                                    </small>
                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Cerrar"
                                    disabled={
                                        actualizandoComision
                                    }
                                    onClick={
                                        cerrarModalComision
                                    }
                                />
                            </div>

                            <div className="modal-body">
                                {errorComision && (
                                    <div className="alert alert-danger">
                                        {errorComision}
                                    </div>
                                )}

                                <div className="text-center mb-4">
                                    <div
                                        className="display-3 fw-bold"
                                    >
                                        {
                                            porcentajeSeleccionado
                                        }
                                        %
                                    </div>

                                    <div className="text-muted">
                                        Porcentaje de comisión
                                    </div>
                                </div>

                                <div className="px-2">
                                    <input
                                        type="range"
                                        className="form-range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={
                                            porcentajeSeleccionado
                                        }
                                        disabled={
                                            actualizandoComision
                                        }
                                        onChange={(e) =>
                                            setPorcentajeSeleccionado(
                                                Number(
                                                    e.target
                                                        .value,
                                                ),
                                            )
                                        }
                                    />

                                    <div className="d-flex justify-content-between text-muted small">
                                        <span>0%</span>
                                        <span>25%</span>
                                        <span>50%</span>
                                        <span>75%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    disabled={
                                        actualizandoComision
                                    }
                                    onClick={
                                        cerrarModalComision
                                    }
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={
                                        actualizandoComision
                                    }
                                    onClick={
                                        guardarComision
                                    }
                                >
                                    {actualizandoComision
                                        ? 'Guardando...'
                                        : 'Guardar comisión'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fondo del modal */}
            {barberoSeleccionado && (
                <div className="modal-backdrop fade show" />
            )}

            {/* ================================================== */}
            {/* MODAL PARA CONFIGURAR BARBERO */}
            {/* ================================================== */}

            {modalConfigurarBarberoAbierto && (
                <div
                    className="modal fade show"
                    style={{
                        display: 'block',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    tabIndex={-1}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {adminAConfigurar
                                        ? `Hacer barbero a ${adminAConfigurar.nombre}`
                                        : 'Convertirme en barbero'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={cerrarModalConfigurarBarbero}
                                    disabled={configurandoBarbero}
                                />
                            </div>
                            <div className="modal-body">
                                {errorConfigurarBarbero && (
                                    <div className="alert alert-danger">{errorConfigurarBarbero}</div>
                                )}
                                <div className="mb-3">
                                    <label className="form-label">Teléfono</label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        value={telefonoBarbero}
                                        onChange={(e) => setTelefonoBarbero(e.target.value)}
                                        disabled={configurandoBarbero}
                                        placeholder="Ej. +573001234567"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Comisión Inicial ({comisionBarbero}%)</label>
                                    <input
                                        type="range"
                                        className="form-range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={comisionBarbero}
                                        onChange={(e) => setComisionBarbero(Number(e.target.value))}
                                        disabled={configurandoBarbero}
                                    />
                                    <div className="d-flex justify-content-between text-muted small">
                                        <span>0%</span>
                                        <span>50%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={cerrarModalConfigurarBarbero}
                                    disabled={configurandoBarbero}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={guardarConfiguracionBarbero}
                                    disabled={configurandoBarbero}
                                >
                                    {configurandoBarbero ? 'Guardando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fondo del modal configurar barbero */}
            {modalConfigurarBarberoAbierto && (
                <div className="modal-backdrop fade show" />
            )}

            {/* ================================================== */}
            {/* MODAL VER DETALLES */}
            {/* ================================================== */}

            {usuarioDetalles && (
                <div
                    className="modal fade show"
                    style={{
                        display: 'block',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    tabIndex={-1}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Ficha de Usuario</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setUsuarioDetalles(null)}
                                />
                            </div>
                            <div className="modal-body text-start">
                                <div className="text-center mb-4">
                                    <div className="bg-light rounded-circle d-inline-flex justify-content-center align-items-center mb-3" style={{ width: '80px', height: '80px' }}>
                                        <span className="fs-1 text-primary">
                                            {usuarioDetalles.nombre.charAt(0)}{usuarioDetalles.apellido.charAt(0)}
                                        </span>
                                    </div>
                                    <h4>{usuarioDetalles.nombre} {usuarioDetalles.apellido}</h4>
                                    <span className={`badge ${usuarioDetalles.estado === 'ACTIVO' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                                        {usuarioDetalles.estado}
                                    </span>
                                </div>
                                <hr />
                                <div className="mb-2">
                                    <strong>Correo Electrónico:</strong> <br/> {usuarioDetalles.email}
                                </div>
                                {'telefono' in usuarioDetalles && (
                                    <div className="mb-2">
                                        <strong>Teléfono:</strong> <br/> {usuarioDetalles.telefono}
                                    </div>
                                )}
                                {'porcentajeComision' in usuarioDetalles && (
                                    <div className="mb-2">
                                        <strong>Comisión de Barbero:</strong> <br/> {usuarioDetalles.porcentajeComision}%
                                    </div>
                                )}
                                <div className="mb-2">
                                    <strong>Tipo de Perfil:</strong> <br/> 
                                    {'porcentajeComision' in usuarioDetalles ? 'Barbero' : 'Administrador'}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setUsuarioDetalles(null)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {usuarioDetalles && (
                <div className="modal-backdrop fade show" />
            )}
        </div>
    );
}

