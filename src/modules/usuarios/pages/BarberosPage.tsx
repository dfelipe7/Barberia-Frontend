
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
                            <div className="card shadow-sm h-100">
                                <div className="card-body">
                                    <h5 className="card-title">
                                        {barbero.nombre}{' '}
                                        {barbero.apellido}
                                    </h5>

                                    <p className="card-text mb-0">
                                        <strong>
                                            Teléfono:
                                        </strong>{' '}
                                        {barbero.telefono}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

