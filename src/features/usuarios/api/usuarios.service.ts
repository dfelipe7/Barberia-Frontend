import apiClient from '../../../shared/lib/http/axios';
import type {
  UsuarioDTO,
  AdministradorGestionDTO,
  CrearAdministradorDTO,
  ActualizarUsuarioDTO,
  CambiarEstadoDTO,
  CambiarEstadoUsuarioDTO,
  ConfigurarBarberoDTO,
} from './usuarios.dto';

/**
 * SERVICIO HTTP PURO (Capa API de Usuarios):
 * Realiza las llamadas REST exactas contra el backend NestJS/Express.
 */
export const usuariosService = {
  async obtenerMiPerfil(): Promise<UsuarioDTO> {
    const response = await apiClient.get<UsuarioDTO>('/usuarios/me');
    return response.data;
  },

  async obtenerUsuario(id: number): Promise<UsuarioDTO> {
    const response = await apiClient.get<UsuarioDTO>(`/usuarios/${id}`);
    return response.data;
  },

  async obtenerAdministradores(): Promise<AdministradorGestionDTO[]> {
    const response = await apiClient.get<AdministradorGestionDTO[]>('/usuarios/administradores');
    return response.data;
  },

  async crearAdministrador(datos: CrearAdministradorDTO): Promise<UsuarioDTO> {
    const response = await apiClient.post<UsuarioDTO>('/usuarios/administradores', datos);
    return response.data;
  },

  async actualizarUsuario(id: number, datos: ActualizarUsuarioDTO): Promise<UsuarioDTO> {
    const response = await apiClient.patch<UsuarioDTO>(`/usuarios/${id}`, datos);
    return response.data;
  },

  async cambiarEstadoUsuario(
    id: number,
    datos: CambiarEstadoUsuarioDTO
  ): Promise<{ mensaje: string }> {
    const response = await apiClient.patch(`/usuarios/${id}/estado`, datos);
    return response.data;
  },

  async cambiarEstado(id: number, datos: CambiarEstadoDTO): Promise<{ mensaje: string }> {
    const response = await apiClient.patch(`/usuarios/${id}/estado`, datos);
    return response.data;
  },

  async cambiarEstadoAdministrador(
    id: number,
    datos: CambiarEstadoDTO
  ): Promise<{ mensaje: string }> {
    const response = await apiClient.patch(`/usuarios/administradores/${id}/estado`, datos);
    return response.data;
  },

  async configurarBarbero(id: number, datos: ConfigurarBarberoDTO): Promise<void> {
    const response = await apiClient.post(`/usuarios/${id}/barbero`, datos);
    return response.data;
  },

  async configurarMeComoBarbero(datos: ConfigurarBarberoDTO): Promise<void> {
    const response = await apiClient.post('/usuarios/me/barbero', datos);
    return response.data;
  },
};
