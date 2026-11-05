export interface UsuarioDTO {
  id: number;
  googleId?: string | null;
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
    fotoUrl?: string | null;
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
  esSuperAdmin?: boolean;
}

export interface CrearAdministradorDTO {
  email: string;
  nombre: string;
  apellido?: string;
}

export interface ActualizarUsuarioDTO {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  porcentajeComision?: number;
  esAdministrador?: boolean;
  esBarbero?: boolean;
}

export interface CambiarEstadoDTO {
  estado: 'ACTIVO' | 'INACTIVO';
  tipo?: 'administrador' | 'barbero' | 'ambos';
}

export interface CambiarEstadoUsuarioDTO {
  estado: 'ACTIVO' | 'INACTIVO';
  tipo: 'administrador' | 'barbero' | 'ambos';
}

export interface ConfigurarBarberoDTO {
  telefono: string;
  porcentajeComision: number;
}
