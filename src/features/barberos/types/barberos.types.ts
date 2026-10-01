export type EstadoEntidad = 'ACTIVO' | 'INACTIVO';

export interface BarberoCatalogo {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  fotoUrl?: string | null;
}

export interface BarberoGestion {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  porcentajeComision: number;
  estado: EstadoEntidad;
  estadoAdmin?: EstadoEntidad;
  estadoGlobal: EstadoEntidad;
  esAdministrador: boolean;
  fotoUrl?: string | null;
}
