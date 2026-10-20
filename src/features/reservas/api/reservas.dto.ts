export interface FiltroDisponibilidadReservaDTO {
  servicioId: number;
  barberoId: number;
  fecha: string;
}

/** Barbero activo de un servicio; su id es Barbero.id y sirve para disponibilidad. */
export interface BarberoDisponibleReservaDTO {
  id: number;
  nombre: string;
  apellido: string;
  fotoUrl?: string | null;
}

export interface FranjaDisponibleReservaDTO {
  startTime: string;
  endTime: string;
  available: boolean;
}

/** Respuesta pública de GET /usuarios/barberos/:barberoId/disponibilidad. */
export interface DisponibilidadReservaDTO {
  fecha: string;
  timeZone: string;
  barberoId: number;
  servicioId: number | null;
  slots: FranjaDisponibleReservaDTO[];
}

export interface CrearReservaDTO {
  servicioId: number;
  barberoId: number;
  fecha: string;
  hora: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
}

export interface BarberoReservaDTO {
  id: number;
  nombre: string;
  apellido: string;
}

export interface ServicioReservaCreadaDTO {
  id: number;
  nombre: string;
  precio: number;
  duracionMinutos: number;
}

export interface ReservaCreadaDTO {
  mensaje: string;
  id: number;
  estado: EstadoReservaDTO;
  fecha: string;
  hora: string;
  horaFin: string;
  barbero: BarberoReservaDTO;
  servicio: ServicioReservaCreadaDTO;
  tokenGestion?: string;
}

export interface ReservaClienteDTO {
  id: number;
  estado: EstadoReservaDTO;
  fecha: string;
  hora: string;
  horaFin: string;
  precio: number;
  barbero: BarberoReservaDTO;
  servicio: { id: number; nombre: string };
}

export interface MisReservasDTO {
  mensaje?: string;
  reservas: ReservaClienteDTO[];
}


export interface ActualizarReservaDTO {
  barberoId?: number;
  fecha?: string;
  hora?: string;
}

export interface ReservaAccionDTO {
  mensaje: string;
  id: number;
  estado: EstadoReservaDTO;
}

export interface ReservaModificadaDTO extends ReservaAccionDTO {
  fecha: string;
  hora: string;
  horaFin: string;
  precio: number;
  barbero: BarberoReservaDTO;
  servicio: ServicioReservaCreadaDTO;
}

export interface ReservaAdministrativaDTO {
  id: number;
  fecha: string;
  hora: string;
  horaFin: string;
  estado: EstadoReservaDTO;
  precio: number;
  createdAt: string;
  barbero: BarberoReservaDTO;
  cliente: {
    id: number;
    nombre: string;
    apellido?: string | null;
    telefono?: string | null;
    email?: string | null;
    esRegistrado: boolean;
  };
  servicio: ServicioReservaCreadaDTO;
}

export interface FiltroReservasAdministrativasDTO {
  fecha?: string;
  desde?: string;
  hasta?: string;
  barberoId?: number;
  estado?: EstadoReservaDTO;
  clienteId?: number;
}

export type EstadoReservaDTO =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface CitaAgendaBarberoDTO {
  id: number;
  estado: EstadoReservaDTO;
  fecha: string;
  hora: string;
  horaFin: string;
  precio: number;
  servicio: { id: number; nombre: string; duracionMinutos: number };
  cliente: {
    nombre: string;
    apellido?: string | null;
    telefono?: string | null;
  };
}

export interface AgendaSemanalBarberoDTO {
  desde: string;
  hasta: string;
  reservas: CitaAgendaBarberoDTO[];
}

export interface ClienteAdministrativoDTO {
  id: number;
  nombre: string;
  apellido?: string | null;
  telefono?: string | null;
  email?: string | null;
  esRegistrado?: boolean;
}

export interface ClientesAdministrativosResponseDTO {
  clientes: ClienteAdministrativoDTO[];
}

export interface CrearReservaAdministrativaDTO extends CrearReservaDTO {
  clienteId?: number;
  email?: string;
}

export interface ClienteSesionDTO {
  id: number;
  nombre: string;
  apellido: string | null;
  email: string | null;
}

export interface ClienteSesionResponseDTO {
  accessToken: string;
  cliente: ClienteSesionDTO;
}
