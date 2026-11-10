import apiClient from '../../../shared/lib/http/axios';
import type {
  PerfilNegocioGestionResponse,
  PerfilNegocioPublicoResponse,
  ActualizarPerfilNegocioDto,
  TipoRecursoPerfil,
} from '../types/perfilNegocio.types';

/**
 * Servicio API para interactuar con los endpoints de PerfilNegocioController.
 *
 * Todas las peticiones van protegidas con el contexto del negocio del cliente
 * (mediante la cabecera X-Negocio-Slug o el subdominio).
 */
export const perfilNegocioApi = {
  /**
   * Obtiene la configuración administrativa del perfil de la barbería.
   * Requiere rol SUPERADMIN o ADMINISTRADOR.
   */
  async obtenerPerfilGestion(): Promise<PerfilNegocioGestionResponse> {
    const response = await apiClient.get<PerfilNegocioGestionResponse>('/perfil-negocio/gestion');
    return response.data;
  },

  /**
   * Obtiene el perfil público de la barbería (sin autenticación).
   */
  async obtenerPerfilPublico(): Promise<PerfilNegocioPublicoResponse> {
    const response = await apiClient.get<PerfilNegocioPublicoResponse>('/perfil-negocio');
    return response.data;
  },

  /**
   * Actualiza la información comercial y la ubicación física de la barbería.
   */
  async actualizarPerfil(dto: ActualizarPerfilNegocioDto): Promise<PerfilNegocioGestionResponse> {
    const response = await apiClient.put<PerfilNegocioGestionResponse>('/perfil-negocio', dto);
    return response.data;
  },

  /**
   * Sube un recurso de marca físico (PNG para banner, SVG para logos o favicon).
   */
  async subirRecurso(
    tipo: TipoRecursoPerfil,
    archivo: File
  ): Promise<PerfilNegocioGestionResponse> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const response = await apiClient.post<PerfilNegocioGestionResponse>(
      `/perfil-negocio/${tipo}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Elimina un recurso de marca físico y limpia su referencia en el perfil.
   */
  async eliminarRecurso(tipo: TipoRecursoPerfil): Promise<PerfilNegocioGestionResponse> {
    const response = await apiClient.delete<PerfilNegocioGestionResponse>(`/perfil-negocio/${tipo}`);
    return response.data;
  },
};

