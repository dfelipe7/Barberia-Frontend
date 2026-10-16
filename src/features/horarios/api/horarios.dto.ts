export const CODIGOS_DIA = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
] as const;

export type DiaSemana = (typeof CODIGOS_DIA)[number];

export const DIAS_SEMANA: ReadonlyArray<{ codigo: DiaSemana; nombre: string }> = [
  { codigo: 'LUNES', nombre: 'Lunes' },
  { codigo: 'MARTES', nombre: 'Martes' },
  { codigo: 'MIERCOLES', nombre: 'Miércoles' },
  { codigo: 'JUEVES', nombre: 'Jueves' },
  { codigo: 'VIERNES', nombre: 'Viernes' },
  { codigo: 'SABADO', nombre: 'Sábado' },
  { codigo: 'DOMINGO', nombre: 'Domingo' },
];

/**
 * Contrato esperado para el horario semanal del barbero autenticado.
 * Ajustar este DTO cuando el backend publique su contrato definitivo.
 */
export interface HorarioDiaDTO {
  diaSemana: DiaSemana;
  activo: boolean;
  horaInicio: string | null;
  horaFin: string | null;
}

export interface HorarioSemanalDTO {
  dias: HorarioDiaDTO[];
}

export interface GuardarHorarioSemanalDTO {
  dias: HorarioDiaDTO[];
}

export interface PeriodoNoDisponibilidadDTO {
  id: number | string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

export type CrearPeriodoNoDisponibilidadDTO = Omit<PeriodoNoDisponibilidadDTO, 'id'>;

export interface DisponibilidadFechaDTO {
  fecha: string;
  horariosDisponibles: string[];
}

/** Contrato esperado para los bloqueos temporales que el barbero puede reactivar. */
export interface BloqueoHorarioDTO {
  id: number | string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

export type CrearBloqueoHorarioDTO = Omit<BloqueoHorarioDTO, 'id'>;
