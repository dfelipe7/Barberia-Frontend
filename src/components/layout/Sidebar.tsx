import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function Sidebar() {
    const { roles } = useAuth();

    const esSuperAdmin = roles.includes('SUPERADMIN');
    const esAdministrador = roles.includes('ADMINISTRADOR');
    const esBarbero = roles.includes('BARBERO');

    const enlaceClase = ({ isActive }: { isActive: boolean }) =>
        `nav-link ${isActive
            ? 'active bg-primary text-white'
            : 'text-white'
        }`;

    return (
        <aside
            className="bg-dark text-white"
            style={{
                width: '240px',
                minHeight: 'calc(100vh - 56px)',
            }}
        >
            <div className="p-3">
                <h5 className="mb-4">
                    Menú principal
                </h5>

                <nav className="nav flex-column gap-1">
                    <NavLink
                        to="/"
                        end
                        className={enlaceClase}
                    >
                        Dashboard
                    </NavLink>

                    {(esSuperAdmin ||
                        esAdministrador ||
                        esBarbero) && (
                            <NavLink
                                to="/barberos"
                                className={enlaceClase}
                            >
                                Barberos
                            </NavLink>
                        )}

                    {(esSuperAdmin ||
                        esAdministrador) && (
                            <NavLink
                                to="/usuarios"
                                className={enlaceClase}
                            >
                                Usuarios
                            </NavLink>
                        )}
                        
                    <NavLink
                        to="/mi-perfil"
                        className={enlaceClase}
                    >
                        Mi Perfil
                    </NavLink>

                    {(esSuperAdmin ||
                        esAdministrador) && (
                            <NavLink
                                to="/servicios"
                                className={enlaceClase}
                            >
                                Servicios
                            </NavLink>
                        )}

                    {(esSuperAdmin ||
                        esAdministrador) && (
                            <NavLink
                                to="/productos"
                                className={enlaceClase}
                            >
                                Productos
                            </NavLink>
                        )}

                    {(esSuperAdmin ||
                        esAdministrador ||
                        esBarbero) && (
                            <NavLink
                                to="/reservas"
                                className={enlaceClase}
                            >
                                Reservas
                            </NavLink>
                        )}

                    {(esSuperAdmin ||
                        esAdministrador ||
                        esBarbero) && (
                            <NavLink
                                to="/horarios"
                                className={enlaceClase}
                            >
                                Horarios
                            </NavLink>
                        )}

                    {(esSuperAdmin ||
                        esAdministrador) && (
                            <NavLink
                                to="/descuentos"
                                className={enlaceClase}
                            >
                                Descuentos
                            </NavLink>
                        )}
                </nav>
            </div>
        </aside>
    );
}