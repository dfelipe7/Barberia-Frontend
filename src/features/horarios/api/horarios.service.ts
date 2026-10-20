import apiClient from '../../../shared/lib/http/axios';
import type {
  BloqueoHorarioAccionDTO,
  BloqueoHorarioDTO,
  ActualizarBloqueoHorarioDTO,
  CrearBloqueoHorarioDTO,
  DisponibilidadFechaDTO,
  GuardarHorarioSemanalDTO,
  HorarioSemanalDTO,
} from './horarios.dto';

const ENDPOINT_BARBERO = '/usuarios/me/barbero';
const ENDPOINT_MI_HORARIO = ENDPOINT_BARBERO + '/horario-semanal';
const ENDPOINT_DISPONIBILIDAD = ENDPOINT_BARBERO + '/disponibilidad';
const ENDPOINT_BLOQUEOS = ENDPOINT_BARBERO + '/bloqueos-horario';

export const horariosService = {
  async obtenerMiHorario(): Promise<HorarioSemanalDTO> {
    const response = await apiClient.get<HorarioSemanalDTO>(ENDPOINT_MI_HORARIO);
    return response.data;
  },

  async guardarMiHorario(datos: GuardarHorarioSemanalDTO): Promise<HorarioSemanalDTO> {
    const response = await apiClient.put<HorarioSemanalDTO>(ENDPOINT_MI_HORARIO, datos);
    return response.data;
  },

  async consultarMiDisponibilidad(fecha: string): Promise<DisponibilidadFechaDTO> {
    const response = await apiClient.get<DisponibilidadFechaDTO>(ENDPOINT_DISPONIBILIDAD, {
      params: { fecha },
    });
    return response.data;
  },

  async obtenerBloqueos(): Promise<BloqueoHorarioDTO[]> {
    const response = await apiClient.get<BloqueoHorarioDTO[]>(ENDPOINT_BLOQUEOS);
    return response.data;
  },

  async crearBloqueo(datos: CrearBloqueoHorarioDTO): Promise<BloqueoHorarioAccionDTO> {
    const response = await apiClient.post<BloqueoHorarioAccionDTO>(ENDPOINT_BLOQUEOS, datos);
    return response.data;
  },

  async actualizarBloqueo(
    id: number,
    datos: ActualizarBloqueoHorarioDTO,
  ): Promise<BloqueoHorarioAccionDTO> {
    const response = await apiClient.patch<BloqueoHorarioAccionDTO>(
      ENDPOINT_BLOQUEOS + '/' + id,
      datos,
    );
    return response.data;
  },

  async cancelarBloqueo(id: number): Promise<BloqueoHorarioAccionDTO> {
    const response = await apiClient.delete<BloqueoHorarioAccionDTO>(
      ENDPOINT_BLOQUEOS + '/' + id,
    );
    return response.data;
  },

  async reactivarBloqueo(id: number): Promise<BloqueoHorarioAccionDTO> {
    const response = await apiClient.patch<BloqueoHorarioAccionDTO>(
      ENDPOINT_BLOQUEOS + '/' + id + '/reactivar',
    );
    return response.data;
  },
};
