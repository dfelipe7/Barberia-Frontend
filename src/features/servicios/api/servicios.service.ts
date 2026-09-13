import apiClient from '../../../shared/lib/http/axios';
import type { ServicioDTO, CrearServicioDTO } from './servicios.dto';

export const serviciosService = {
  async obtenerServicios(): Promise<ServicioDTO[]> {
    const response = await apiClient.get<ServicioDTO[]>('/servicios');
    return response.data;
  },

  async crearServicio(datos: CrearServicioDTO): Promise<ServicioDTO> {
    const response = await apiClient.post<ServicioDTO>('/servicios', datos);
    return response.data;
  },
};
