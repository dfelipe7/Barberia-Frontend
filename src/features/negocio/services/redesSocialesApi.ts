import apiClient from '../../../shared/lib/http/axios';
import type {
  RedSocial,
  CrearRedSocialDto,
  ActualizarRedSocialDto,
} from '../types/redesSociales.types';

/**
 * Servicio API para interactuar con los endpoints de Redes Sociales del Negocio (Fase 18).
 * Las peticiones van firmadas automáticamente con X-Negocio-Slug y el Bearer token activo.
 */
export const redesSocialesApi = {
  /**
   * Obtiene la lista de redes sociales del negocio del contexto.
   * Por defecto devuelve solo las activas (público). Si `todas` es true, devuelve activas e inactivas (admin).
   */
  async listar(todas = false): Promise<RedSocial[]> {
    const params = todas ? { todas: 'true' } : undefined;
    const response = await apiClient.get<RedSocial[]>('/perfil-negocio/redes-sociales', { params });
    return response.data;
  },

  /**
   * Reemplazo suave masivo de redes sociales del negocio (SUPERADMIN o ADMINISTRADOR).
   */
  async reemplazar(redes: CrearRedSocialDto[]): Promise<RedSocial[]> {
    const response = await apiClient.put<RedSocial[]>('/perfil-negocio/redes-sociales', { redes });
    return response.data;
  },

  /**
   * Actualiza parcialmente una red social existente.
   */
  async actualizar(id: number, dto: ActualizarRedSocialDto): Promise<RedSocial> {
    const response = await apiClient.patch<RedSocial>(`/perfil-negocio/redes-sociales/${id}`, dto);
    return response.data;
  },

  /**
   * Desactiva (oculta de la web pública) una red social conservando su URL e historial.
   */
  async desactivar(id: number): Promise<RedSocial> {
    const response = await apiClient.delete<RedSocial>(`/perfil-negocio/redes-sociales/${id}`);
    return response.data;
  },

  /**
   * Elimina definitivamente una red social de la base de datos.
   */
  async eliminarDefinitivo(id: number): Promise<RedSocial> {
    const response = await apiClient.delete<RedSocial>(`/perfil-negocio/redes-sociales/${id}`, {
      params: { definitivo: 'true' },
    });
    return response.data;
  },

  /**
   * Reactiva una red social previamente desactivada.
   */
  async activar(id: number): Promise<RedSocial> {
    const response = await apiClient.patch<RedSocial>(`/perfil-negocio/redes-sociales/${id}/activar`);
    return response.data;
  },
};

