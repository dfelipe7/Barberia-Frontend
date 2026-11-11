import apiClient from '../../../shared/lib/http/axios';
import type {
  ServicioDTO,
  CrearServicioDTO,
  ActualizarServicioDTO,
  CambiarEstadoServicioDTO,
  FiltroServiciosDTO,
} from './servicios.dto';

/**
 * SERVICIO HTTP PURO (Capa API de Servicios):
 * Realiza las llamadas REST directas sobre el recurso de catálogo y gestión de servicios.
 */
export const serviciosService = {
  /**
   * Obtiene la lista pública de servicios activos para el catálogo y flujo de agendamiento.
   *
   * @param filtro - Filtros opcionales de búsqueda por texto o categoría.
   * @returns Promesa con los servicios disponibles para el público.
   */
  async obtenerServiciosCatalogo(filtro?: FiltroServiciosDTO): Promise<ServicioDTO[]> {
    const response = await apiClient.get<ServicioDTO[]>('/servicios', { params: filtro });
    return response.data;
  },

  /**
   * Obtiene los servicios específicos que un barbero particular está capacitado para prestar.
   *
   * @param barberoId - Identificador numérico del barbero.
   * @returns Promesa con los servicios asignados al profesional.
   */
  async obtenerServiciosPorBarbero(barberoId: number): Promise<ServicioDTO[]> {
    const response = await apiClient.get<ServicioDTO[]>(`/servicios/barbero/${barberoId}`);
    return response.data;
  },

  /**
   * Obtiene todos los servicios (activos e inactivos) para la administración y configuración de la barbería.
   *
   * @param filtro - Criterios de filtrado administrativo.
   * @returns Promesa con el inventario completo de servicios de la sede.
   */
  async obtenerServiciosGestion(filtro?: FiltroServiciosDTO): Promise<ServicioDTO[]> {
    const response = await apiClient.get<ServicioDTO[]>('/servicios/gestion', {
      params: filtro,
    });
    return response.data;
  },

  /**
   * Crea un nuevo servicio en la barbería activa con su precio, duración y asignación de barberos.
   *
   * @param datos - Datos del servicio a registrar.
   * @returns El servicio creado persistido en el backend.
   */
  async crearServicio(datos: CrearServicioDTO): Promise<ServicioDTO> {
    const response = await apiClient.post<ServicioDTO>('/servicios', datos);
    return response.data;
  },

  /**
   * Actualiza los datos comerciales de un servicio (nombre, precio, duración, descripción).
   *
   * @param id - Identificador del servicio a editar.
   * @param datos - Campos a actualizar.
   * @returns El servicio actualizado.
   */
  async actualizarServicio(id: number, datos: ActualizarServicioDTO): Promise<ServicioDTO> {
    const response = await apiClient.patch<ServicioDTO>(`/servicios/${id}`, datos);
    return response.data;
  },

  /**
   * Cambia el estado de publicación (`ACTIVO` o `INACTIVO`) de un servicio.
   *
   * @param id - Identificador del servicio.
   * @param datos - DTO con el nuevo estado.
   * @returns Mensaje de confirmación del backend.
   */
  async cambiarEstadoServicio(
    id: number,
    datos: CambiarEstadoServicioDTO
  ): Promise<{ mensaje: string }> {
    const response = await apiClient.patch(`/servicios/${id}/estado`, datos);
    return response.data;
  },

  /**
   * Sube o reemplaza la fotografía ilustrativa de un servicio.
   *
   * @param id - Identificador del servicio.
   * @param file - Archivo de imagen a cargar.
   * @returns El servicio con la nueva URL de imagen.
   */
  async subirFotoServicio(id: number, file: File): Promise<ServicioDTO> {
    const formData = new FormData();
    formData.append('foto', file);
    const response = await apiClient.post<ServicioDTO>(`/servicios/${id}/foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Elimina la fotografía asignada a un servicio restaurando la predeterminada.
   *
   * @param id - Identificador del servicio.
   * @returns Mensaje de confirmación.
   */
  async eliminarFotoServicio(id: number): Promise<{ mensaje: string }> {
    const response = await apiClient.delete(`/servicios/${id}/foto`);
    return response.data;
  },
};
