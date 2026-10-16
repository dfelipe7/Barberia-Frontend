import apiClient from '../../../shared/lib/http/axios';
import type {
  CrearPeriodoNoDisponibilidadDTO,
  CrearBloqueoHorarioDTO,
  DisponibilidadFechaDTO,
  GuardarHorarioSemanalDTO,
  HorarioSemanalDTO,
  BloqueoHorarioDTO,
  PeriodoNoDisponibilidadDTO,
} from './horarios.dto';

// Mantener estas rutas concentradas aquí para ajustarlas al contrato definitivo del backend.
const ENDPOINT_MI_HORARIO = '/horarios/me';
const ENDPOINT_NO_DISPONIBILIDAD = ENDPOINT_MI_HORARIO + '/no-disponibilidad';
const ENDPOINT_DISPONIBILIDAD = ENDPOINT_MI_HORARIO + '/disponibilidad';
const ENDPOINT_BLOQUEOS = ENDPOINT_MI_HORARIO + '/bloqueos';

export const horariosService = {
  async obtenerMiHorario(): Promise<HorarioSemanalDTO> {
    const response = await apiClient.get<HorarioSemanalDTO>(ENDPOINT_MI_HORARIO);
    return response.data;
  },

  async guardarMiHorario(datos: GuardarHorarioSemanalDTO): Promise<void> {
    await apiClient.put(ENDPOINT_MI_HORARIO, datos);
  },

  async obtenerPeriodosNoDisponibilidad(): Promise<PeriodoNoDisponibilidadDTO[]> {
    const response = await apiClient.get<PeriodoNoDisponibilidadDTO[]>(
      ENDPOINT_NO_DISPONIBILIDAD
    );
    return response.data;
  },

  async crearPeriodoNoDisponibilidad(
    datos: CrearPeriodoNoDisponibilidadDTO
  ): Promise<PeriodoNoDisponibilidadDTO> {
    const response = await apiClient.post<PeriodoNoDisponibilidadDTO>(
      ENDPOINT_NO_DISPONIBILIDAD,
      datos
    );
    return response.data;
  },

  async consultarMiDisponibilidad(fecha: string): Promise<DisponibilidadFechaDTO> {
    const response = await apiClient.get<DisponibilidadFechaDTO>(
      ENDPOINT_DISPONIBILIDAD,
      { params: { fecha } }
    );
    return response.data;
  },

  async obtenerBloqueos(): Promise<BloqueoHorarioDTO[]> {
    const response = await apiClient.get<BloqueoHorarioDTO[]>(ENDPOINT_BLOQUEOS);
    return response.data;
  },

  async crearBloqueo(datos: CrearBloqueoHorarioDTO): Promise<BloqueoHorarioDTO> {
    const response = await apiClient.post<BloqueoHorarioDTO>(ENDPOINT_BLOQUEOS, datos);
    return response.data;
  },

  async reactivarBloqueo(id: number | string): Promise<void> {
    await apiClient.delete(`${ENDPOINT_BLOQUEOS}/${id}`);
  },
};
