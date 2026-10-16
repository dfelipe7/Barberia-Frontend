export interface FiltroDisponibilidadReservaDTO {
  servicioId: number;
  barberoId: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface DiaDisponibilidadReservaDTO {
  fecha: string;
  horariosDisponibles: string[];
}

/** Respuesta provisional del calendario de reserva, pendiente del contrato del backend. */
export interface DisponibilidadReservaDTO {
  dias: DiaDisponibilidadReservaDTO[];
}

export interface CrearReservaDTO {
  servicioId: number;
  barberoId: number;
  fecha: string;
  hora: string;
}

/** Respuesta mínima esperada al crear una reserva. */
export interface ReservaCreadaDTO {
  id: number | string;
  mensaje?: string;
}
