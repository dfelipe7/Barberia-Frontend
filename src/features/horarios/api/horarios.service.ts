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

/**
 * SERVICIO HTTP PURO (Capa API de Horarios y Disponibilidad):
 * Gestiona la configuración de jornadas semanales, intervalos de almuerzo y bloqueos
 * de agenda del barbero autenticado.
 */
export const horariosService = {
  /**
   * Obtiene la plantilla de horario semanal configurada para el barbero en sesión.
   *
   * @returns Configuración semanal de turnos y almuerzos por día.
   */
  async obtenerMiHorario(): Promise<HorarioSemanalDTO> {
    const response = await apiClient.get<HorarioSemanalDTO>(ENDPOINT_MI_HORARIO);
    return response.data;
  },

  /**
   * Guarda o actualiza la jornada semanal y descansos del barbero autenticado.
   *
   * @param datos - Matriz de días con horas de inicio, fin y estado laboral.
   * @returns El horario semanal guardado.
   */
  async guardarMiHorario(datos: GuardarHorarioSemanalDTO): Promise<HorarioSemanalDTO> {
    const response = await apiClient.put<HorarioSemanalDTO>(ENDPOINT_MI_HORARIO, datos);
    return response.data;
  },

  /**
   * Consulta las franjas horarias y slots de disponibilidad del barbero en una fecha específica.
   *
   * @param fecha - Fecha en formato `YYYY-MM-DD`.
   * @returns Mapa de slots libres, ocupados o bloqueados.
   */
  async consultarMiDisponibilidad(fecha: string): Promise<DisponibilidadFechaDTO> {
    const response = await apiClient.get<DisponibilidadFechaDTO>(ENDPOINT_DISPONIBILIDAD, {
      params: { fecha },
    });
    return response.data;
  },

  /**
   * Obtiene la lista de bloqueos o excepciones de horario (vacaciones, permisos, emergencias) del barbero.
   *
   * @returns Lista de bloqueos programados.
   */
  async obtenerBloqueos(): Promise<BloqueoHorarioDTO[]> {
    const response = await apiClient.get<BloqueoHorarioDTO[]>(ENDPOINT_BLOQUEOS);
    return response.data;
  },

  /**
   * Registra un nuevo bloqueo de tiempo impidiendo citas en ese intervalo.
   *
   * @param datos - Fecha, horas de inicio/fin y motivo del bloqueo.
   * @returns Confirmación de creación del bloqueo.
   */
  async crearBloqueo(datos: CrearBloqueoHorarioDTO): Promise<BloqueoHorarioAccionDTO> {
    const response = await apiClient.post<BloqueoHorarioAccionDTO>(ENDPOINT_BLOQUEOS, datos);
    return response.data;
  },

  /**
   * Modifica el rango horario o motivo de un bloqueo existente.
   *
   * @param id - Identificador del bloqueo.
   * @param datos - Campos a modificar.
   * @returns Confirmación de actualización.
   */
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

  /**
   * Cancela un bloqueo de horario liberando las franjas para reservas.
   *
   * @param id - Identificador del bloqueo a retirar.
   * @returns Confirmación de cancelación.
   */
  async cancelarBloqueo(id: number): Promise<BloqueoHorarioAccionDTO> {
    const response = await apiClient.delete<BloqueoHorarioAccionDTO>(
      ENDPOINT_BLOQUEOS + '/' + id,
    );
    return response.data;
  },

  /**
   * Reactiva un bloqueo previamente cancelado.
   *
   * @param id - Identificador del bloqueo.
   * @returns Confirmación de reactivación.
   */
  async reactivarBloqueo(id: number): Promise<BloqueoHorarioAccionDTO> {
    const response = await apiClient.patch<BloqueoHorarioAccionDTO>(
      ENDPOINT_BLOQUEOS + '/' + id + '/reactivar',
    );
    return response.data;
  },
};
