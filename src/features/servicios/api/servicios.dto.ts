export interface BarberoEnServicioDTO {
  id: number;
  nombre: string;
  apellido: string;
  fotoUrl?: string | null;
}

export interface ServicioDTO {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  duracionMinutos: number;
  fotoUrl?: string | null;
  estado: string;
  barberos: BarberoEnServicioDTO[];
}

export interface CrearServicioDTO {
  nombre: string;
  descripcion?: string;
  precio: number;
  duracionMinutos: number;
  fotoUrl?: string;
  barberoIds?: number[];
}

export type ActualizarServicioDTO = Partial<CrearServicioDTO>;

export interface CambiarEstadoServicioDTO {
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface FiltroServiciosDTO {
  nombre?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}
