import { useAuth } from '../../auth/AuthContext';

export default function Dashboard() {
    const {
        nombre,
        apellido,
        roles,
    } = useAuth();

    return (
        <div>
            <div className="mb-4">
                <h1>Dashboard</h1>

                <p className="text-muted">
                    Bienvenido, {nombre} {apellido}.
                </p>
            </div>

            <div className="row g-4">
                <div className="col-md-6 col-xl-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title">
                                Reservas
                            </h5>

                            <p className="card-text text-muted">
                                Gestiona las reservas de la barbería.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 col-xl-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title">
                                Barberos
                            </h5>

                            <p className="card-text text-muted">
                                Consulta y administra los barberos.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 col-xl-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title">
                                Servicios
                            </h5>

                            <p className="card-text text-muted">
                                Gestiona los servicios disponibles.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 col-xl-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title">
                                Productos
                            </h5>

                            <p className="card-text text-muted">
                                Administra el catálogo de productos.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm mt-4">
                <div className="card-body">
                    <h5 className="card-title">
                        Rol actual
                    </h5>

                    <p className="mb-0">
                        {roles.join(', ')}
                    </p>
                </div>
            </div>
        </div>
    );
}