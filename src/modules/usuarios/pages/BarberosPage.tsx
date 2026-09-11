
import { useEffect, useState } from 'react';
import {
    Link,
    useLocation,
} from 'react-router-dom';

import { useAuth } from '../../../auth/AuthContext';

import Loading from '../../../components/common/Loading';
import ErrorMessage from '../../../components/common/ErrorMessage';

import {
    usuariosService,
    type BarberoCatalogo,
} from '../services/usuarios.service';

interface EstadoNavegacion {
    mensaje?: string;
}

const obtenerUrlFoto = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${baseUrl}${url}`;
};

/**
 * PÁGINA DEL CATÁLOGO DE BARBEROS
 * 
 * ¿Qué hace esta pantalla?
 * - Muestra la lista pública (o semipública) de barberos disponibles en el sistema.
 * - Su diseño está pensado como una "vitrina" en lugar de una tabla administrativa pesada.
 * - Si el usuario que está viendo la página es SUPERADMIN o ADMINISTRADOR, se le muestra
 *   un botón extra para "Crear Nuevo Barbero".
 */
export default function BarberosPage() {
    const { roles } = useAuth();

    const esSuperAdmin =
        roles.includes('SUPERADMIN');

    const esAdministrador =
        roles.includes('ADMINISTRADOR');

    const puedeCrearBarbero =
        esSuperAdmin || esAdministrador;

    const [barberos, setBarberos] = useState<
        BarberoCatalogo[]
    >([]);

    const [cargando, setCargando] = useState(true);

    const [error, setError] = useState('');

    const location = useLocation();

    const estado =
        location.state as EstadoNavegacion | null;

    const mensajeExito = estado?.mensaje;

    useEffect(() => {
        const cargarBarberos = async () => {
            try {
                const datos =
                    await usuariosService.obtenerBarberos();

                setBarberos(datos);
            } catch (error) {
                console.error(error);

                setError(
                    'No se pudieron cargar los barberos.',
                );
            } finally {
                setCargando(false);
            }
        };

        cargarBarberos();
    }, []);

    if (cargando) {
        return <Loading />;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1>Barberos</h1>

                    <p className="text-muted mb-0">
                        Consulta los barberos activos de la barbería.
                    </p>
                </div>

                {puedeCrearBarbero && (
                    <Link
                        to="/barberos/nuevo"
                        className="btn btn-primary"
                    >
                        + Nuevo barbero
                    </Link>
                )}
            </div>

            {mensajeExito && (
                <div
                    className="alert alert-success"
                    role="alert"
                >
                    {mensajeExito}
                </div>
            )}

            {barberos.length === 0 ? (
                <div className="alert alert-info">
                    No hay barberos activos.
                </div>
            ) : (
                <div className="row g-4">
                    {barberos.map((barbero) => (
                        <div
                            className="col-md-6 col-xl-4"
                            key={barbero.id}
                        >
                            <div className="card shadow-sm h-100 overflow-hidden border-0">
                                <div
                                    className="position-relative"
                                    style={{ height: '220px', backgroundColor: '#1e293b' }}
                                >
                                    {barbero.fotoUrl ? (
                                        <img
                                            src={obtenerUrlFoto(barbero.fotoUrl)!}
                                            alt={`${barbero.nombre} ${barbero.apellido}`}
                                            className="w-100 h-100"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-white bg-dark">
                                            <span className="display-4 fw-bold text-secondary mb-1">
                                                {barbero.nombre.charAt(0)}{barbero.apellido.charAt(0)}
                                            </span>
                                            <span className="badge bg-secondary">Sin foto</span>
                                        </div>
                                    )}
                                    <span className="badge bg-success position-absolute top-0 end-0 m-3 px-2 py-1 shadow-sm">
                                        Disponible
                                    </span>
                                </div>

                                <div className="card-body d-flex flex-column justify-content-between p-4">
                                    <div>
                                        <h5 className="card-title fw-bold mb-1">
                                            {barbero.nombre} {barbero.apellido}
                                        </h5>
                                        <p className="text-muted small mb-3">
                                            Barbero Profesional
                                        </p>
                                        <div className="d-flex align-items-center text-secondary small">
                                            <span><strong>Teléfono:</strong> {barbero.telefono}</span>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                                        <span className="text-muted small">Listo para agendar</span>
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            disabled
                                            title="Próximamente disponible en el módulo de Citas"
                                        >
                                            Reservar Cita
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

