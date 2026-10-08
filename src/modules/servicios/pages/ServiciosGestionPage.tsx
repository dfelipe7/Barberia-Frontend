import { useEffect, useState } from 'react';
import { Scissors, Plus, Edit, Camera, Trash2, Lock, Unlock, Search, Clock, User, X, Eye } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';
import Loading from '../../../components/common/Loading';
import ErrorMessage from '../../../components/common/ErrorMessage';

import { serviciosService } from '../services/servicios.service';
import type { Servicio, CrearServicioPayload } from '../types/servicios.types';

import {
    usuariosService,
    type BarberoGestion,
} from '../../usuarios/services/usuarios.service';

const obtenerUrlFoto = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${baseUrl}${url}`;
};

/**
 * PÁGINA DE GESTIÓN ADMINISTRATIVA DE SERVICIOS
 * Exclusiva para SUPERADMIN y ADMINISTRADOR.
 * Utiliza íconos de lucide-react para las acciones y controles.
 */
export default function ServiciosGestionPage() {
    const { roles } = useAuth();
    const esAdmin = roles.includes('SUPERADMIN') || roles.includes('ADMINISTRADOR');

    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [barberosDisponibles, setBarberosDisponibles] = useState<BarberoGestion[]>([]);

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensajeExito, setMensajeExito] = useState('');

    // Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    // Modal de Formulario (Crear / Editar)
    const [mostrarModalForm, setMostrarModalForm] = useState(false);
    const [servicioEditando, setServicioEditando] = useState<Servicio | null>(null);

    // Campos del Formulario
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState<number | ''>(15000);
    const [duracionMinutos, setDuracionMinutos] = useState<number | ''>(30);
    const [barberosSeleccionados, setBarberosSeleccionados] = useState<number[]>([]);
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState('');

    // Modal de Subir Foto
    const [servicioFoto, setServicioFoto] = useState<Servicio | null>(null);
    const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
    const [subiendoFoto, setSubiendoFoto] = useState(false);

    // Modal Ver Ficha de Servicio
    const [servicioDetalles, setServicioDetalles] = useState<Servicio | null>(null);

    // Cargar Servicios
    const cargarServicios = async () => {
        setCargando(true);
        setError('');
        try {
            const datos = await serviciosService.obtenerServiciosGestion({
                nombre: busqueda || undefined,
                estado: filtroEstado || undefined,
            });
            setServicios(datos);
        } catch (err: any) {
            console.error('Error cargando servicios:', err);
            setError('No se pudieron cargar los servicios del catálogo.');
        } finally {
            setCargando(false);
        }
    };

    // Cargar barberos para el multiselect
    const cargarBarberos = async () => {
        try {
            const datos = await usuariosService.obtenerBarberosGestion({ estado: 'ACTIVO' });
            setBarberosDisponibles(datos);
        } catch (err) {
            console.error('Error cargando barberos:', err);
        }
    };

    useEffect(() => {
        if (esAdmin) {
            cargarServicios();
            cargarBarberos();
        }
    }, [busqueda, filtroEstado, esAdmin]);

    // Abrir modal de creación
    const abrirModalCrear = () => {
        setServicioEditando(null);
        setNombre('');
        setDescripcion('');
        setPrecio(15000);
        setDuracionMinutos(30);
        setBarberosSeleccionados([]);
        setErrorForm('');
        setMostrarModalForm(true);
    };

    // Abrir modal de edición
    const abrirModalEditar = (servicio: Servicio) => {
        setServicioEditando(servicio);
        setNombre(servicio.nombre);
        setDescripcion(servicio.descripcion || '');
        setPrecio(servicio.precio);
        setDuracionMinutos(servicio.duracionMinutos);
        setBarberosSeleccionados(
            (servicio.barberos || [])
                .map((b) => b.id)
                .filter((id) => barberosDisponibles.some((bd) => bd.id === id)),
        );
        setErrorForm('');
        setMostrarModalForm(true);
    };

    // Alternar selección de barbero
    const toggleBarberoSeleccionado = (id: number) => {
        setBarberosSeleccionados((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
        );
    };

    // Guardar (Crear o Editar)
    const handleGuardarServicio = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) {
            setErrorForm('El nombre del servicio es obligatorio.');
            return;
        }
        if (precio === '' || precio < 0) {
            setErrorForm('El precio debe ser un número mayor o igual a 0.');
            return;
        }
        if (duracionMinutos === '' || duracionMinutos <= 0) {
            setErrorForm('La duración debe ser mayor a 0 minutos.');
            return;
        }

        try {
            setGuardando(true);
            setErrorForm('');

            const payload: CrearServicioPayload = {
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || undefined,
                precio: Number(precio),
                duracionMinutos: Number(duracionMinutos),
                barberoIds: barberosSeleccionados,
            };

            if (servicioEditando) {
                await serviciosService.actualizarServicio(servicioEditando.id, payload);
                setMensajeExito(`Servicio "${nombre}" actualizado correctamente.`);
            } else {
                await serviciosService.crearServicio(payload);
                setMensajeExito(`Servicio "${nombre}" creado correctamente.`);
            }

            setMostrarModalForm(false);
            cargarServicios();
        } catch (err: any) {
            console.error('Error guardando servicio:', err);
            setErrorForm(err?.response?.data?.message || 'Error al guardar el servicio.');
        } finally {
            setGuardando(false);
        }
    };

    // Cambiar estado (ACTIVO / INACTIVO)
    const handleCambiarEstado = async (servicio: Servicio) => {
        const nuevoEstado = servicio.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar';

        if (!window.confirm(`¿Deseas ${accion} el servicio "${servicio.nombre}"?`)) {
            return;
        }

        try {
            await serviciosService.cambiarEstadoServicio(servicio.id, nuevoEstado);
            setMensajeExito(`Estado del servicio cambiado a ${nuevoEstado}.`);
            cargarServicios();
        } catch (err: any) {
            console.error('Error cambiando estado del servicio:', err);
            setError(err?.response?.data?.message || 'No fue posible cambiar el estado.');
        }
    };

    // Subir foto
    const handleSubirFoto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!servicioFoto || !archivoFoto) return;

        try {
            setSubiendoFoto(true);
            await serviciosService.subirFotoServicio(servicioFoto.id, archivoFoto);
            setMensajeExito('Foto del servicio actualizada con éxito.');
            setServicioFoto(null);
            setArchivoFoto(null);
            cargarServicios();
        } catch (err: any) {
            console.error('Error subiendo foto:', err);
            alert(err?.response?.data?.message || 'Error al subir la foto.');
        } finally {
            setSubiendoFoto(false);
        }
    };

    // Eliminar foto
    const handleEliminarFoto = async (servicio: Servicio) => {
        if (!window.confirm(`¿Deseas eliminar la foto del servicio "${servicio.nombre}"?`)) return;

        try {
            await serviciosService.eliminarFotoServicio(servicio.id);
            setMensajeExito('Foto eliminada correctamente.');
            cargarServicios();
        } catch (err: any) {
            console.error('Error eliminando foto:', err);
            alert('Error al eliminar la foto.');
        }
    };

    if (!esAdmin) {
        return <ErrorMessage message="No tienes permisos para acceder a la gestión de servicios." />;
    }

    return (
        <div className="container-fluid py-4">
            {/* ENCABEZADO Y BOTÓN CREAR */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <Scissors className="text-primary" size={28} /> Gestión del Catálogo de Servicios
                    </h2>
                    <p className="text-muted mb-0">
                        Crea, edita y gestiona los servicios ofrecidos en la barbería y asigna barberos.
                    </p>
                </div>

                <button className="btn btn-primary fw-bold d-flex align-items-center gap-2" onClick={abrirModalCrear}>
                    <Plus size={18} /> Nuevo Servicio
                </button>
            </div>

            {/* MENSAJE DE ÉXITO */}
            {mensajeExito && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {mensajeExito}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setMensajeExito('')}
                    />
                </div>
            )}

            {/* ERROR GENERAL */}
            {error && <ErrorMessage message={error} />}

            {/* BARRA DE BÚSQUEDA Y FILTROS */}
            <div className="row g-3 mb-4 align-items-center bg-light p-3 rounded shadow-sm mx-0 border">
                <div className="col-md-7">
                    <div className="input-group">
                        <span className="input-group-text bg-white text-muted">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar servicio por nombre o descripción..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                        {busqueda && (
                            <button
                                className="btn btn-outline-secondary d-flex align-items-center"
                                type="button"
                                onClick={() => setBusqueda('')}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="col-md-5">
                    <div className="d-flex align-items-center gap-2">
                        <label className="form-label mb-0 text-nowrap fw-semibold text-muted">
                            Estado:
                        </label>
                        <select
                            className="form-select"
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                        >
                            <option value="">Todos los servicios</option>
                            <option value="ACTIVO">Solo Activos</option>
                            <option value="INACTIVO">Solo Inactivos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* TABLA DE SERVICIOS */}
            {cargando ? (
                <Loading />
            ) : servicios.length === 0 ? (
                <div className="text-center py-5 bg-light rounded border">
                    <h5 className="text-muted">No se encontraron servicios</h5>
                    <p className="text-muted small mb-0">Intenta ajustar los filtros de búsqueda.</p>
                </div>
            ) : (
                <div className="table-responsive shadow-sm rounded border">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>Foto</th>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th>Precio</th>
                                <th>Duración</th>
                                <th>Barberos Asignados</th>
                                <th>Estado</th>
                                <th className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {servicios.map((s) => {
                                const urlFoto = obtenerUrlFoto(s.fotoUrl);
                                return (
                                    <tr key={s.id}>
                                        <td>
                                            {urlFoto ? (
                                                <img
                                                    src={urlFoto}
                                                    alt={s.nombre}
                                                    className="rounded border"
                                                    style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div
                                                    className="rounded bg-secondary text-white d-flex align-items-center justify-content-center"
                                                    style={{ width: '48px', height: '48px' }}
                                                >
                                                    <Scissors size={20} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="fw-bold">{s.nombre}</td>
                                        <td className="text-muted small">
                                            {s.descripcion || <em className="text-black-50">Sin descripción</em>}
                                        </td>
                                        <td className="fw-bold text-success">
                                            ${s.precio.toLocaleString('es-CO')} COP
                                        </td>
                                        <td>
                                            <span className="badge bg-info text-dark d-inline-flex align-items-center gap-1">
                                                <Clock size={12} /> {s.duracionMinutos} min
                                            </span>
                                        </td>
                                        <td>
                                            {s.barberos && s.barberos.length > 0 ? (
                                                <div className="d-flex flex-wrap gap-1">
                                                    {s.barberos.map((b) => (
                                                        <span
                                                            key={b.id}
                                                            className="badge bg-secondary font-monospace d-inline-flex align-items-center gap-1"
                                                            title={`${b.nombre} ${b.apellido}`}
                                                        >
                                                            <User size={12} /> {b.nombre} {b.apellido}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted small fst-italic">
                                                    Sin barberos asignados
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {s.estado === 'ACTIVO' ? (
                                                <span className="badge text-bg-success">Activo</span>
                                            ) : (
                                                <span className="badge text-bg-danger">Inactivo</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2 align-items-center justify-content-end">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-secondary"
                                                    title="Ver ficha del servicio"
                                                    onClick={() => setServicioDetalles(s)}
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    title="Editar servicio"
                                                    onClick={() => abrirModalEditar(s)}
                                                >
                                                    <Edit size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-info"
                                                    title="Subir o cambiar foto"
                                                    onClick={() => setServicioFoto(s)}
                                                >
                                                    <Camera size={16} />
                                                </button>

                                                {s.fotoUrl && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        title="Eliminar foto"
                                                        onClick={() => handleEliminarFoto(s)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${
                                                        s.estado === 'ACTIVO'
                                                            ? 'btn-outline-danger'
                                                            : 'btn-outline-success'
                                                    }`}
                                                    title={s.estado === 'ACTIVO' ? 'Desactivar servicio' : 'Activar servicio'}
                                                    onClick={() => handleCambiarEstado(s)}
                                                >
                                                    {s.estado === 'ACTIVO' ? <Lock size={16} /> : <Unlock size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL CREAR / EDITAR */}
            {mostrarModalForm && (
                <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                                    {servicioEditando ? <><Edit size={20} /> Editar Servicio</> : <><Plus size={20} /> Nuevo Servicio</>}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setMostrarModalForm(false)}
                                />
                            </div>
                            <form onSubmit={handleGuardarServicio}>
                                <div className="modal-body">
                                    {errorForm && <ErrorMessage message={errorForm} />}

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Nombre del Servicio *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ej: Corte Clásico y Barbaterapia"
                                            value={nombre}
                                            onChange={(e) => setNombre(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Descripción</label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            placeholder="Detalles sobre lo que incluye el servicio..."
                                            value={descripcion}
                                            onChange={(e) => setDescripcion(e.target.value)}
                                        />
                                    </div>

                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Precio ($ COP) *</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min={0}
                                                step={500}
                                                value={precio}
                                                onChange={(e) => setPrecio(e.target.value ? Number(e.target.value) : '')}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Duración (Minutos) *</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min={5}
                                                step={5}
                                                value={duracionMinutos}
                                                onChange={(e) => setDuracionMinutos(e.target.value ? Number(e.target.value) : '')}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* ASIGNACIÓN DE BARBEROS */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold d-block">
                                            Barberos que prestan este servicio:
                                        </label>
                                        {barberosDisponibles.length === 0 ? (
                                            <span className="text-muted small">No hay barberos activos registrados.</span>
                                        ) : (
                                            <div className="row g-2 max-vh-25 overflow-auto p-2 border rounded bg-light">
                                                {barberosDisponibles.map((b) => {
                                                    const seleccionado = barberosSeleccionados.includes(b.id);
                                                    return (
                                                        <div className="col-md-6" key={b.id}>
                                                            <div
                                                                className={`card p-2 border cursor-pointer ${
                                                                    seleccionado ? 'border-primary bg-primary bg-opacity-10' : ''
                                                                }`}
                                                                style={{ cursor: 'pointer' }}
                                                                onClick={() => toggleBarberoSeleccionado(b.id)}
                                                            >
                                                                <div className="form-check m-0 pointer-events-none d-flex align-items-center gap-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="form-check-input"
                                                                        checked={seleccionado}
                                                                        onChange={() => {}}
                                                                    />
                                                                    <label className="form-check-label fw-semibold ms-1 d-flex align-items-center gap-1">
                                                                        <User size={14} /> {b.nombre} {b.apellido}
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setMostrarModalForm(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary fw-bold"
                                        disabled={guardando}
                                    >
                                        {guardando ? 'Guardando...' : servicioEditando ? 'Actualizar' : 'Crear Servicio'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SUBIR FOTO */}
            {servicioFoto && (
                <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                                    <Camera size={20} /> Cambiar Foto de "{servicioFoto.nombre}"
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setServicioFoto(null)}
                                />
                            </div>
                            <form onSubmit={handleSubirFoto}>
                                <div className="modal-body text-center">
                                    {servicioFoto.fotoUrl && (
                                        <div className="mb-3">
                                            <p className="text-muted small mb-1">Foto actual:</p>
                                            <img
                                                src={obtenerUrlFoto(servicioFoto.fotoUrl) || ''}
                                                alt="Previa"
                                                className="rounded border"
                                                style={{ maxWidth: '160px', maxHeight: '160px', objectFit: 'cover' }}
                                            />
                                        </div>
                                    )}

                                    <div className="mb-3 text-start">
                                        <label className="form-label fw-semibold">Seleccionar Nueva Imagen</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/png, image/jpeg, image/webp"
                                            onChange={(e) => setArchivoFoto(e.target.files?.[0] || null)}
                                            required
                                        />
                                        <span className="text-muted small">Formatos: JPG, PNG, WEBP (Máx 5MB)</span>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setServicioFoto(null)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-success fw-bold"
                                        disabled={subiendoFoto || !archivoFoto}
                                    >
                                        {subiendoFoto ? 'Subiendo...' : 'Subir y Guardar Foto'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL VER FICHA DE SERVICIO */}
            {servicioDetalles && (
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
                                <h5 className="modal-title fw-bold">Ficha del Servicio</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setServicioDetalles(null)}
                                />
                            </div>
                            <div className="modal-body text-start">
                                <div className="text-center mb-4">
                                    {obtenerUrlFoto(servicioDetalles.fotoUrl) ? (
                                        <img
                                            src={obtenerUrlFoto(servicioDetalles.fotoUrl)!}
                                            alt={servicioDetalles.nombre}
                                            className="rounded border mb-3"
                                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className="bg-light rounded-circle d-inline-flex justify-content-center align-items-center mb-3" style={{ width: '80px', height: '80px' }}>
                                            <Scissors size={36} className="text-primary" />
                                        </div>
                                    )}
                                    <h4>{servicioDetalles.nombre}</h4>
                                    <span className={`badge ${servicioDetalles.estado === 'ACTIVO' ? 'text-bg-success' : 'text-bg-danger'}`}>
                                        {servicioDetalles.estado}
                                    </span>
                                </div>
                                <hr />
                                <div className="mb-2">
                                    <strong>Descripción:</strong> <br/> {servicioDetalles.descripcion || 'Sin descripción'}
                                </div>
                                <div className="mb-2">
                                    <strong>Precio:</strong> <br/> ${servicioDetalles.precio.toLocaleString('es-CO')} COP
                                </div>
                                <div className="mb-2">
                                    <strong>Duración estimada:</strong> <br/> {servicioDetalles.duracionMinutos} minutos
                                </div>
                                <div className="mb-2">
                                    <strong>Barberos Capacitados:</strong> <br/>
                                    {servicioDetalles.barberos && servicioDetalles.barberos.length > 0 ? (
                                        <div className="d-flex flex-wrap gap-1 mt-1">
                                            {servicioDetalles.barberos.map((b) => (
                                                <span key={b.id} className="badge bg-secondary font-monospace">
                                                    {b.nombre} {b.apellido}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-muted small fst-italic">Sin barberos asignados</span>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setServicioDetalles(null)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {servicioDetalles && (
                <div className="modal-backdrop fade show" />
            )}
        </div>
    );
}
