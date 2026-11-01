export type EstadoEntidad = 'ACTIVO' | 'INACTIVO';

export interface AdministradorPerfil {
  id: number;
  usuarioId: number;
  estado: EstadoEntidad;
  superadmin?: boolean;
}

export interface BarberoPerfil {
  id: number;
  usuarioId: number;
  telefono: string;
  porcentajeComision: number;
  estado: EstadoEntidad;
  fotoUrl?: string | null;
}

/**
 * Modelo de Dominio de Usuario Completo (BD)
 */
export interface Usuario {
  id: number;
  googleId?: string | null;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  estado: EstadoEntidad;
  administrador?: AdministradorPerfil | null;
  barbero?: BarberoPerfil | null;
}

/**
 * Modelo de Dominio para la vista administrativa
 */
export interface AdministradorGestion {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  estado: EstadoEntidad;
  estadoAdmin?: EstadoEntidad;
  esBarbero: boolean;
  estadoBarbero?: EstadoEntidad;
  esSuperAdmin?: boolean;
}

export interface UsuarioDetalle {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  estado: EstadoEntidad;
  telefono?: string;
  porcentajeComision?: number;
  tipoPerfil: 'Administrador' | 'Barbero' | 'Administrador / Barbero';
}
