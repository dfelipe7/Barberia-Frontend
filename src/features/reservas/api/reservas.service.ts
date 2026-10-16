import apiClient from '../../../shared/lib/http/axios';
import type {
  CrearReservaDTO,
  DisponibilidadReservaDTO,
  FiltroDisponibilidadReservaDTO,
  ReservaCreadaDTO,
} from './reservas.dto';

// Ajustar esta ruta y la forma de respuesta cuando el backend publique el contrato.
const ENDPOINT_DISPONIBILIDAD_RESERVA = '/reservas/disponibilidad';
const ENDPOINT_CREAR_RESERVA = '/reservas';

export const reservasService = {
  async obtenerDisponibilidad(
    filtro: FiltroDisponibilidadReservaDTO
  ): Promise<DisponibilidadReservaDTO> {
    const response = await apiClient.get<DisponibilidadReservaDTO>(
      ENDPOINT_DISPONIBILIDAD_RESERVA,
      { params: filtro }
    );
    return response.data;
  },

  async crearReserva(datos: CrearReservaDTO): Promise<ReservaCreadaDTO> {
    const response = await apiClient.post<ReservaCreadaDTO>(ENDPOINT_CREAR_RESERVA, datos);
    return response.data;
  },
};
