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
export type DiaSemanaApi =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export const DIAS_SEMANA: ReadonlyArray<{ codigo: DiaSemana; nombre: string }> = [
  { codigo: 'LUNES', nombre: 'Lunes' },
  { codigo: 'MARTES', nombre: 'Martes' },
  { codigo: 'MIERCOLES', nombre: 'Miércoles' },
  { codigo: 'JUEVES', nombre: 'Jueves' },
  { codigo: 'VIERNES', nombre: 'Viernes' },
  { codigo: 'SABADO', nombre: 'Sábado' },
  { codigo: 'DOMINGO', nombre: 'Domingo' },
];

export const DIA_A_API: Record<DiaSemana, DiaSemanaApi> = {
  LUNES: 'MONDAY',
  MARTES: 'TUESDAY',
  MIERCOLES: 'WEDNESDAY',
  JUEVES: 'THURSDAY',
  VIERNES: 'FRIDAY',
  SABADO: 'SATURDAY',
  DOMINGO: 'SUNDAY',
};

export const API_A_DIA: Record<DiaSemanaApi, DiaSemana> = {
  MONDAY: 'LUNES',
  TUESDAY: 'MARTES',
  WEDNESDAY: 'MIERCOLES',
  THURSDAY: 'JUEVES',
  FRIDAY: 'VIERNES',
  SATURDAY: 'SABADO',
  SUNDAY: 'DOMINGO',
};

export const HORAS_INICIO_FRANJA = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
] as const;

export interface FranjaHorarioDTO {
  dayOfWeek: DiaSemanaApi;
  startTime: string;
  endTime: string;
}

export interface HorarioSemanalDTO {
  barberoId: number;
  franjas: FranjaHorarioDTO[];
}

export interface GuardarHorarioSemanalDTO {
  franjas: FranjaHorarioDTO[];
}

export type EstadoFranjaDTO =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'BLOCKED'
  | 'GENERAL_CLOSURE'
  | 'OUTSIDE_SCHEDULE';

export interface FranjaDisponibilidadDTO {
  startTime: string;
  endTime: string;
  status: EstadoFranjaDTO;
}

export interface DisponibilidadFechaDTO {
  fecha: string;
  timeZone: string;
  barberoId: number;
  servicioId: number | null;
  slots: FranjaDisponibilidadDTO[];
}

export type EstadoBloqueoHorarioDTO = 'ACTIVE' | 'REACTIVATED' | 'CANCELLED';

export interface BloqueoHorarioDTO {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  notes: string | null;
  status: EstadoBloqueoHorarioDTO;
  createdAt: string;
  updatedAt: string;
  reactivatedAt: string | null;
}

export interface CrearBloqueoHorarioDTO {
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  notes?: string;
}

export interface BloqueoHorarioAccionDTO {
  mensaje: string;
  block: BloqueoHorarioDTO;
}
