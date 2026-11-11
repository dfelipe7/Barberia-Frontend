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
 * Realiza las llamadas REST exactas contra el backend NestJS para autenticación interna,
 * gestión de administradores y perfiles de usuario.
 */
export const usuariosService = {
  /**
   * Obtiene el perfil completo del usuario autenticado en la sesión actual.
   *
   * @returns Datos del usuario con sus roles y perfiles vinculados.
   */
  async obtenerMiPerfil(): Promise<UsuarioDTO> {
    const response = await apiClient.get<UsuarioDTO>('/usuarios/me');
    return response.data;
  },

  /**
   * Obtiene la ficha de un usuario específico por su identificador.
   *
   * @param id - Identificador numérico del usuario.
   * @returns Datos del usuario solicitado.
   */
  async obtenerUsuario(id: number): Promise<UsuarioDTO> {
    const response = await apiClient.get<UsuarioDTO>(`/usuarios/${id}`);
    return response.data;
  },

  /**
   * Obtiene la lista de usuarios con privilegios de administración asignados a la sede.
   *
   * @returns Lista de administradores para gestión interna.
   */
  async obtenerAdministradores(): Promise<AdministradorGestionDTO[]> {
    const response = await apiClient.get<AdministradorGestionDTO[]>('/usuarios/administradores');
    return response.data;
  },

  /**
   * Registra y vincula un nuevo administrador a la barbería actual.
   *
   * @param datos - Nombre, email y privilegios del nuevo administrador.
   * @returns El usuario administrador creado.
   */
  async crearAdministrador(datos: CrearAdministradorDTO): Promise<UsuarioDTO> {
    const response = await apiClient.post<UsuarioDTO>('/usuarios/administradores', datos);
    return response.data;
  },

  /**
   * Actualiza los datos personales básicos de un usuario (nombre, teléfono).
   *
   * @param id - Identificador del usuario.
   * @param datos - Campos modificados.
   * @returns El usuario actualizado.
   */
  async actualizarUsuario(id: number, datos: ActualizarUsuarioDTO): Promise<UsuarioDTO> {
    const response = await apiClient.patch<UsuarioDTO>(`/usuarios/${id}`, datos);
    return response.data;
  },

  /**
   * Modifica el estado global de un usuario aplicando control de concurrencia y auditoría.
   *
   * @param id - Identificador del usuario.
   * @param datos - Nuevo estado y motivo del cambio.
   * @returns Mensaje de confirmación del backend.
   */
  async cambiarEstadoUsuario(
    id: number,
    datos: CambiarEstadoUsuarioDTO
  ): Promise<{ mensaje: string }> {
    const response = await apiClient.patch(`/usuarios/${id}/estado`, datos);
    return response.data;
  },

  /**
   * Modifica el estado de acceso de un usuario.
   *
   * @param id - Identificador del usuario.
   * @param datos - DTO con el estado a aplicar.
   * @returns Mensaje de confirmación.
   */
  async cambiarEstado(id: number, datos: CambiarEstadoDTO): Promise<{ mensaje: string }> {
    const response = await apiClient.patch(`/usuarios/${id}/estado`, datos);
    return response.data;
  },

  /**
   * Modifica el estado operativo del rol de administrador de un usuario en la sede.
   *
   * @param id - Identificador del administrador.
   * @param datos - Nuevo estado.
   * @returns Mensaje de confirmación.
   */
  async cambiarEstadoAdministrador(
    id: number,
    datos: CambiarEstadoDTO
  ): Promise<{ mensaje: string }> {
    const response = await apiClient.patch(`/usuarios/administradores/${id}/estado`, datos);
    return response.data;
  },

  /**
   * Configura o actualiza el perfil de barbero de un usuario específico.
   *
   * @param id - Identificador del usuario.
   * @param datos - Parámetros de barbero (comisión, etc.).
   */
  async configurarBarbero(id: number, datos: ConfigurarBarberoDTO): Promise<void> {
    const response = await apiClient.post(`/usuarios/${id}/barbero`, datos);
    return response.data;
  },

  /**
   * Permite al usuario en sesión auto-configurar su propio perfil de barbero.
   *
   * @param datos - Parámetros de configuración.
   */
  async configurarMeComoBarbero(datos: ConfigurarBarberoDTO): Promise<void> {
    const response = await apiClient.post('/usuarios/me/barbero', datos);
    return response.data;
  },
};
