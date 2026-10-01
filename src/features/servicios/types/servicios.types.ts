export type EstadoEntidad = 'ACTIVO' | 'INACTIVO';

export interface BarberoEnServicio {
  id: number;
  nombre: string;
  apellido: string;
  fotoUrl?: string | null;
}

export interface Servicio {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  duracionMinutos: number;
  fotoUrl?: string | null;
  estado: EstadoEntidad;
  barberos: BarberoEnServicio[];
}

export interface FiltroServicios {
  nombre?: string;
  estado?: EstadoEntidad;
}
