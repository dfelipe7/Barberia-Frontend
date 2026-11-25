import apiClient from '../../../shared/lib/http/axios';
import type { PoliticasReserva } from '../types/politicasReserva.types';

export const politicasReservaApi = {
  /**
   * Obtiene las políticas operativas de la barbería activa.
   */
  async obtenerPoliticas(): Promise<PoliticasReserva> {
    const response = await apiClient.get<PoliticasReserva>('/configuracion/politicas');
    return response.data;
  },

  /**
   * Actualiza las políticas operativas de la barbería activa.
   */
  async actualizarPoliticas(dto: PoliticasReserva): Promise<PoliticasReserva> {
    const response = await apiClient.put<PoliticasReserva>('/configuracion/politicas', dto);
    return response.data;
  },
};
