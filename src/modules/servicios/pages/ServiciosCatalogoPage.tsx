import { useEffect, useState } from 'react';
import { Scissors, Search, X, Clock, User, Calendar, ChevronRight, Check, CheckCircle2 } from 'lucide-react';
import Loading from '../../../components/common/Loading';
import ErrorMessage from '../../../components/common/ErrorMessage';
import { serviciosService } from '../services/servicios.service';
import type { Servicio, BarberoEnServicio } from '../types/servicios.types';

const obtenerUrlFoto = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${baseUrl}${url}`;
};

/**
 * PÁGINA PÚBLICA DEL CATÁLOGO DE SERVICIOS
 * Diseñada para clientes y visitantes. Muestra los servicios activos disponibles
 * con fotos, precio, duración y el flujo interactivo de selección de barbero capacitado.
 */
export default function ServiciosCatalogoPage() {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');

    // Estado para el modal de agendamiento desde Servicio
    const [servicioAgendando, setServicioAgendando] = useState<Servicio | null>(null);
    const [barberoSeleccionado, setBarberoSeleccionado] = useState<BarberoEnServicio | null>(null);

    const cargarCatalogo = async () => {
        setCargando(true);
        setError('');
        try {
            const datos = await serviciosService.obtenerServiciosCatalogo({
                nombre: busqueda || undefined,
            });
            setServicios(datos);
        } catch (err: any) {
            console.error('Error cargando catálogo:', err);
            setError('No fue posible cargar el catálogo de servicios.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarCatalogo();
    }, [busqueda]);

    const iniciarAgendamiento = (servicio: Servicio) => {
        setServicioAgendando(servicio);
        setBarberoSeleccionado(null);
    };

    const cerrarAgendamiento = () => {
        setServicioAgendando(null);
        setBarberoSeleccionado(null);
    };

    return (
        <div className="container py-4">
            {/* ENCABEZADO */}
            <div className="text-center mb-5">
                <h1 className="fw-bold display-5 mb-2 d-flex align-items-center justify-content-center gap-3">
                    <Scissors className="text-primary" size={40} /> Catálogo de Servicios
                </h1>
                <p className="text-muted lead">
                    Descubre nuestra variedad de cortes, perfilados y tratamientos de barbería.
                </p>
            </div>

            {/* BÚSQUEDA */}
            <div className="row justify-content-center mb-5">
                <div className="col-md-8 col-lg-6">
                    <div className="input-group input-group-lg shadow-sm">
                        <span className="input-group-text bg-white border-end-0 text-muted">
                            <Search size={20} />
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Buscar servicio (ej: Corte, Barba, Tintura)..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                        {busqueda && (
                            <button
                                className="btn btn-outline-secondary d-flex align-items-center"
                                type="button"
                                onClick={() => setBusqueda('')}
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* CONTENIDO / TARJETAS DE SERVICIOS */}
            {cargando ? (
                <Loading />
            ) : error ? (
                <ErrorMessage message={error} />
            ) : servicios.length === 0 ? (
                <div className="text-center py-5 bg-light rounded border">
                    <h4 className="text-muted">No encontramos servicios disponibles</h4>
                    <p className="text-muted small mb-0">Intenta buscar con otra palabra clave.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {servicios.map((servicio) => {
                        const urlFoto = obtenerUrlFoto(servicio.fotoUrl);

                        return (
                            <div className="col-md-6 col-lg-4" key={servicio.id}>
                                <div className="card h-100 shadow-sm border-0 rounded-3 overflow-hidden hover-shadow">
                                    {/* FOTO DEL SERVICIO */}
                                    <div
                                        className="position-relative bg-dark d-flex align-items-center justify-content-center overflow-hidden"
                                        style={{ height: '200px' }}
                                    >
                                        {urlFoto ? (
                                            <img
                                                src={urlFoto}
                                                alt={servicio.nombre}
                                                className="w-100 h-100"
                                                style={{ objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <Scissors size={64} className="text-secondary opacity-50" />
                                        )}
                                        <span className="position-absolute top-0 end-0 bg-primary text-white fw-bold px-3 py-1 rounded-bl shadow-sm m-2 d-inline-flex align-items-center gap-1">
                                            <Clock size={14} /> {servicio.duracionMinutos} min
                                        </span>
                                    </div>

                                    {/* CUERPO DE LA TARJETA */}
                                    <div className="card-body d-flex flex-column p-4">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h4 className="card-title fw-bold text-dark m-0">
                                                {servicio.nombre}
                                            </h4>
                                        </div>

                                        <p className="card-text text-muted small flex-grow-1 mb-3">
                                            {servicio.descripcion || 'Servicio profesional de barbería con los mejores acabados.'}
                                        </p>

                                        {/* BARBEROS DISPONIBLES QUE REALIZAN ESTE SERVICIO */}
                                        <div className="border-top pt-3 mt-auto">
                                            <span className="text-muted small fw-semibold d-block mb-2">
                                                Barberos capacitados:
                                            </span>
                                            {servicio.barberos && servicio.barberos.length > 0 ? (
                                                <div className="d-flex flex-wrap gap-2">
                                                    {servicio.barberos.map((b) => {
                                                        const fotoBarbero = obtenerUrlFoto(b.fotoUrl);
                                                        return (
                                                            <div
                                                                key={b.id}
                                                                className="d-flex align-items-center bg-light border rounded-pill px-2 py-1 gap-1"
                                                                title={`${b.nombre} ${b.apellido}`}
                                                            >
                                                                {fotoBarbero ? (
                                                                    <img
                                                                        src={fotoBarbero}
                                                                        alt={b.nombre}
                                                                        className="rounded-circle"
                                                                        style={{ width: '22px', height: '22px', objectFit: 'cover' }}
                                                                    />
                                                                ) : (
                                                                    <span className="badge bg-secondary rounded-circle d-inline-flex align-items-center justify-content-center p-0" style={{ width: '22px', height: '22px' }}>
                                                                        <User size={12} />
                                                                    </span>
                                                                )}
                                                                <span className="small fw-semibold text-dark">
                                                                    {b.nombre}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <span className="text-muted small fst-italic">
                                                    Disponible con nuestro equipo
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* PIE DE TARJETA CON PRECIO Y BOTÓN */}
                                    <div className="card-footer bg-white border-0 p-4 pt-0 d-flex align-items-center justify-content-between">
                                        <div>
                                            <span className="text-muted small d-block">Precio</span>
                                            <span className="h4 fw-extrabold text-success mb-0">
                                                ${servicio.precio.toLocaleString('es-CO')}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-primary fw-bold px-3 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2"
                                            onClick={() => iniciarAgendamiento(servicio)}
                                        >
                                            <Calendar size={18} /> Agendar Cita
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ========================================================== */}
            {/* MODAL AGENDAMIENTO DESDE SERVICIO (SELECCIÓN DE BARBERO) */}
            {/* ========================================================== */}
            {servicioAgendando && (
                <div
                    className="modal fade show d-block"
                    tabIndex={-1}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-3">
                            <div className="modal-header bg-primary text-white p-4">
                                <div>
                                    <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-1">
                                        <Calendar size={22} /> Agendar Cita: {servicioAgendando.nombre}
                                    </h5>
                                    <p className="mb-0 small text-white-50">
                                        Paso 1: Elige el barbero profesional capacitado para realizar este servicio
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={cerrarAgendamiento}
                                />
                            </div>

                            <div className="modal-body p-4">
                                {/* PASO 1: SELECCIONAR BARBERO QUE REALIZA EL SERVICIO */}
                                {!barberoSeleccionado ? (
                                    <div>
                                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
                                            <User size={18} className="text-primary" /> Barberos capacitados para {servicioAgendando.nombre}:
                                        </h6>

                                        {!servicioAgendando.barberos || servicioAgendando.barberos.length === 0 ? (
                                            <div className="alert alert-info border mb-0">
                                                Este servicio se agendará asignando al próximo barbero disponible de turno.
                                            </div>
                                        ) : (
                                            <div className="row g-3">
                                                {servicioAgendando.barberos.map((b) => {
                                                    const fotoBarbero = obtenerUrlFoto(b.fotoUrl);
                                                    return (
                                                        <div className="col-md-6" key={b.id}>
                                                            <div
                                                                className="card h-100 border p-3 shadow-sm rounded-3 cursor-pointer hover-border-primary"
                                                                style={{ cursor: 'pointer' }}
                                                                onClick={() => setBarberoSeleccionado(b)}
                                                            >
                                                                <div className="d-flex align-items-center gap-3">
                                                                    {fotoBarbero ? (
                                                                        <img
                                                                            src={fotoBarbero}
                                                                            alt={b.nombre}
                                                                            className="rounded-circle border"
                                                                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                                        />
                                                                    ) : (
                                                                        <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '50px', height: '50px' }}>
                                                                            {b.nombre.charAt(0)}{b.apellido.charAt(0)}
                                                                        </div>
                                                                    )}

                                                                    <div className="flex-grow-1">
                                                                        <strong className="d-block text-dark fs-6">{b.nombre} {b.apellido}</strong>
                                                                        <span className="text-success small fw-semibold d-inline-flex align-items-center gap-1">
                                                                            <CheckCircle2 size={13} /> Disponible
                                                                        </span>
                                                                    </div>

                                                                    <span className="text-primary fw-semibold small d-inline-flex align-items-center gap-1">
                                                                        Elegir <ChevronRight size={16} />
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* PASO 2: RESUMEN DE SELECCIÓN Y PREVIEW */
                                    <div>
                                        <div className="alert alert-success d-flex align-items-center gap-2 mb-4 shadow-sm">
                                            <Check size={20} />
                                            <span><strong>¡Barbero Seleccionado con éxito!</strong> Revisa el resumen de tu cita:</span>
                                        </div>

                                        <div className="card border-0 bg-light p-4 rounded-3 mb-4 shadow-sm">
                                            <h5 className="fw-bold mb-3 text-dark border-bottom pb-2">Resumen de la Cita</h5>
                                            
                                            <div className="row g-3">
                                                <div className="col-sm-6">
                                                    <span className="text-muted small d-block">Servicio Elegido</span>
                                                    <strong className="fs-6 text-dark">{servicioAgendando.nombre}</strong>
                                                </div>
                                                <div className="col-sm-6">
                                                    <span className="text-muted small d-block">Barbero Profesional</span>
                                                    <strong className="fs-6 text-dark">{barberoSeleccionado.nombre} {barberoSeleccionado.apellido}</strong>
                                                </div>
                                                <div className="col-sm-6">
                                                    <span className="text-muted small d-block">Duración Estimada</span>
                                                    <strong className="fs-6 text-dark">{servicioAgendando.duracionMinutos} minutos</strong>
                                                </div>
                                                <div className="col-sm-6">
                                                    <span className="text-muted small d-block">Precio del Servicio</span>
                                                    <strong className="fs-6 text-success">${servicioAgendando.precio.toLocaleString('es-CO')}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="alert alert-info border mb-0 d-flex align-items-start gap-3">
                                            <Calendar size={24} className="text-info flex-shrink-0 mt-1" />
                                            <div>
                                                <h6 className="fw-bold mb-1">Próximo paso: Fecha y Hora de la Cita</h6>
                                                <p className="small text-muted mb-0">
                                                    Con el servicio <strong>{servicioAgendando.nombre}</strong> ({servicioAgendando.duracionMinutos} min) y el barbero <strong>{barberoSeleccionado.nombre} {barberoSeleccionado.apellido}</strong> seleccionados, el siguiente paso en el próximo Sprint será desplegar el calendario interactivo de días y horarios libres.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer bg-light p-3 justify-content-between">
                                {barberoSeleccionado ? (
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setBarberoSeleccionado(null)}
                                    >
                                        ← Elegir otro barbero
                                    </button>
                                ) : (
                                    <span className="text-muted small">Haz clic en un barbero para seleccionarlo</span>
                                )}

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={cerrarAgendamiento}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
