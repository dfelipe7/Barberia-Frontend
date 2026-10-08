import api from '../../../services/api';
import type {
    Servicio,
    CrearServicioPayload,
    ActualizarServicioPayload,
    FiltroServicios,
} from '../types/servicios.types';

export const serviciosService = {
    /**
     * Catálogo público: Obtiene únicamente los servicios ACTIVOS (para clientes).
     */
    async obtenerServiciosCatalogo(filtro?: FiltroServicios) {
        const response = await api.get<Servicio[]>('/servicios', { params: filtro });
        return response.data;
    },

    /**
     * Vista de gestión: Obtiene TODOS los servicios (activos e inactivos) con soporte de filtro.
     * Exclusivo para Administradores y Superadmin.
     */
    async obtenerServiciosGestion(filtro?: FiltroServicios) {
        const response = await api.get<Servicio[]>('/servicios/gestion', { params: filtro });
        return response.data;
    },

    /**
     * Obtiene los servicios activos que presta un barbero específico.
     */
    async obtenerServiciosPorBarbero(barberoId: number) {
        const response = await api.get<Servicio[]>(`/servicios/barbero/${barberoId}`);
        return response.data;
    },

    /**
     * Obtiene el detalle de un servicio por su ID.
     */
    async obtenerServicioPorId(id: number) {
        const response = await api.get<Servicio>(`/servicios/${id}`);
        return response.data;
    },

    /**
     * Crea un nuevo servicio en el catálogo.
     */
    async crearServicio(datos: CrearServicioPayload) {
        const response = await api.post<Servicio>('/servicios', datos);
        return response.data;
    },

    /**
     * Actualiza los datos o asignación de barberos de un servicio.
     */
    async actualizarServicio(id: number, datos: ActualizarServicioPayload) {
        const response = await api.patch<Servicio>(`/servicios/${id}`, datos);
        return response.data;
    },

    /**
     * Activa o inactiva un servicio (Borrado lógico / Soft Delete).
     */
    async cambiarEstadoServicio(id: number, estado: 'ACTIVO' | 'INACTIVO') {
        const response = await api.patch(`/servicios/${id}/estado`, { estado });
        return response.data;
    },

    /**
     * Sube o actualiza la foto de un servicio (Multipart form data).
     */
    async subirFotoServicio(id: number, archivo: File) {
        const formData = new FormData();
        formData.append('foto', archivo);

        const response = await api.post<{ mensaje: string; fotoUrl: string; servicio: Servicio }>(
            `/servicios/${id}/foto`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            },
        );
        return response.data;
    },

    /**
     * Elimina la foto de un servicio del disco y la BD.
     */
    async eliminarFotoServicio(id: number) {
        const response = await api.delete(`/servicios/${id}/foto`);
        return response.data;
    },
};
