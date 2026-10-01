import apiClient from '../../../shared/lib/http/axios';
import type {
  ServicioDTO,
  CrearServicioDTO,
  ActualizarServicioDTO,
  CambiarEstadoServicioDTO,
  FiltroServiciosDTO,
} from './servicios.dto';

export const serviciosService = {
  async obtenerServiciosCatalogo(filtro?: FiltroServiciosDTO): Promise<ServicioDTO[]> {
    const response = await apiClient.get<ServicioDTO[]>('/servicios', { params: filtro });
    return response.data;
  },

  async obtenerServiciosGestion(filtro?: FiltroServiciosDTO): Promise<ServicioDTO[]> {
    const response = await apiClient.get<ServicioDTO[]>('/servicios/gestion', {
      params: filtro,
    });
    return response.data;
  },

  async crearServicio(datos: CrearServicioDTO): Promise<ServicioDTO> {
    const response = await apiClient.post<ServicioDTO>('/servicios', datos);
    return response.data;
  },

  async actualizarServicio(id: number, datos: ActualizarServicioDTO): Promise<ServicioDTO> {
    const response = await apiClient.patch<ServicioDTO>(`/servicios/${id}`, datos);
    return response.data;
  },

  async cambiarEstadoServicio(
    id: number,
    datos: CambiarEstadoServicioDTO
  ): Promise<{ mensaje: string }> {
    const response = await apiClient.patch(`/servicios/${id}/estado`, datos);
    return response.data;
  },

  async subirFotoServicio(id: number, file: File): Promise<ServicioDTO> {
    const formData = new FormData();
    formData.append('foto', file);
    const response = await apiClient.post<ServicioDTO>(`/servicios/${id}/foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async eliminarFotoServicio(id: number): Promise<{ mensaje: string }> {
    const response = await apiClient.delete(`/servicios/${id}/foto`);
    return response.data;
  },
};
