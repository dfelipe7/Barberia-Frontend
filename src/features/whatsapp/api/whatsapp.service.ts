import apiClient from '../../../shared/lib/http/axios';
import type {
  WhatsAppStatus,
  DesconectarResponse,
  WhatsAppPlantillas,
  ActualizarPlantillasDTO,
} from '../types/whatsapp.types';

export const whatsappService = {
  /**
   * Consulta el estado de conexión de WhatsApp Web y obtiene el QR actual en base64 si está pendiente.
   * Endpoint público sin autenticación para garantizar polling estable.
   */
  async getStatus(): Promise<WhatsAppStatus> {
    const response = await apiClient.get<WhatsAppStatus>('/whatsapp/status');
    return response.data;
  },

  /**
   * Desvincula la sesión activa de WhatsApp Web en el backend y genera un nuevo código QR.
   * Requiere rol ADMINISTRADOR o SUPERADMIN.
   */
  async desconectar(): Promise<DesconectarResponse> {
    const response = await apiClient.post<DesconectarResponse>('/whatsapp/desconectar');
    return response.data;
  },

  /**
   * Obtiene las plantillas de mensajes activas para confirmación y recordatorio.
   */
  async getPlantillas(): Promise<WhatsAppPlantillas> {
    const response = await apiClient.get<WhatsAppPlantillas>('/whatsapp/plantillas');
    return response.data;
  },

  /**
   * Guarda las plantillas de mensajes modificadas.
   * Requiere rol ADMINISTRADOR o SUPERADMIN.
   */
  async guardarPlantillas(datos: ActualizarPlantillasDTO): Promise<WhatsAppPlantillas> {
    const response = await apiClient.put<WhatsAppPlantillas>('/whatsapp/plantillas', datos);
    return response.data;
  },

  /**
   * Restablece las plantillas a los textos oficiales originales por defecto.
   * Requiere rol ADMINISTRADOR o SUPERADMIN.
   */
  async resetPlantillas(): Promise<WhatsAppPlantillas> {
    const response = await apiClient.post<WhatsAppPlantillas>('/whatsapp/plantillas/reset');
    return response.data;
  },
};
