import apiClient from '../../../shared/lib/http/axios';
import type {
  BarberoCatalogoDTO,
  BarberoGestionDTO,
  CrearBarberoDTO,
  ActualizarComisionDTO,
  CambiarEstadoBarberoDTO,
} from './barberos.dto';

export const barberosService = {
  async obtenerBarberos(): Promise<BarberoCatalogoDTO[]> {
    const response = await apiClient.get<BarberoCatalogoDTO[]>('/usuarios/barberos');
    return response.data;
  },

  async obtenerBarberosGestion(filtro?: {
    estado?: 'ACTIVO' | 'INACTIVO';
    nombre?: string;
  }): Promise<BarberoGestionDTO[]> {
    const response = await apiClient.get<BarberoGestionDTO[]>('/usuarios/barberos/gestion', {
      params: filtro,
    });
    return response.data;
  },

  async crearBarbero(datos: CrearBarberoDTO): Promise<void> {
    const response = await apiClient.post('/usuarios/barberos', datos);
    return response.data;
  },

  async cambiarEstadoBarbero(
    id: number,
    datos: CambiarEstadoBarberoDTO
  ): Promise<{ mensaje: string }> {
    const response = await apiClient.patch(`/usuarios/barberos/${id}/estado`, datos);
    return response.data;
  },

  async cambiarEstadoGlobalBarbero(
    id: number,
    datos: CambiarEstadoBarberoDTO
  ): Promise<{ mensaje: string }> {
    const response = await apiClient.patch(`/usuarios/${id}/estado`, {
      ...datos,
      tipo: 'barbero',
    });
    return response.data;
  },

  async actualizarComision(
    id: number,
    datos: ActualizarComisionDTO
  ): Promise<{ mensaje: string }> {
    const response = await apiClient.patch(`/usuarios/barberos/${id}/comision`, datos);
    return response.data;
  },

  async subirFotoPropia(file: File): Promise<{ fotoUrl: string; mensaje: string }> {
    const formData = new FormData();
    formData.append('foto', file);
    const response = await apiClient.post('/usuarios/barberos/foto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async eliminarFotoPropia(): Promise<{ mensaje: string }> {
    const response = await apiClient.delete('/usuarios/barberos/foto');
    return response.data;
  },
  
  async subirFotoAdmin(id: number, file: File): Promise<{ fotoUrl: string; mensaje: string }> {
    const formData = new FormData();
    formData.append('foto', file);
    const response = await apiClient.post(`/usuarios/barberos/${id}/foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
