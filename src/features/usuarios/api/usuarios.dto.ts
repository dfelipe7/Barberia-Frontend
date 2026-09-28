export interface UsuarioDTO {
  id: number;
  keycloakId: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  estado: 'ACTIVO' | 'INACTIVO';
  administrador?: {
    id: number;
    usuarioId: number;
    estado: 'ACTIVO' | 'INACTIVO';
  } | null;
  barbero?: {
    id: number;
    usuarioId: number;
    telefono: string;
    porcentajeComision: number;
    estado: 'ACTIVO' | 'INACTIVO';
  } | null;
}

export interface AdministradorGestionDTO {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  estado: 'ACTIVO' | 'INACTIVO';
  estadoAdmin?: 'ACTIVO' | 'INACTIVO';
  esBarbero: boolean;
  estadoBarbero?: 'ACTIVO' | 'INACTIVO';
}

export interface CrearAdministradorDTO {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
}

export interface ActualizarUsuarioDTO {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  porcentajeComision?: number;
  esAdministrador?: boolean;
  esBarbero?: boolean;
}

export interface CambiarEstadoDTO {
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface ConfigurarBarberoDTO {
  telefono: string;
  porcentajeComision: number;
}
