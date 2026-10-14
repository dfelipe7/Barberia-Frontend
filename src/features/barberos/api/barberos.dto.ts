export interface BarberoCatalogoDTO {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  fotoUrl?: string | null;
}

export interface BarberoGestionDTO {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  porcentajeComision: number;
  estado: 'ACTIVO' | 'INACTIVO';
  estadoAdmin?: 'ACTIVO' | 'INACTIVO';
  estadoGlobal: 'ACTIVO' | 'INACTIVO';
  esAdministrador: boolean;
  fotoUrl?: string | null; 
}

export interface CrearBarberoDTO {
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  porcentajeComision: number;
}

export interface ActualizarComisionDTO {
  porcentajeComision: number;
}

export interface CambiarEstadoBarberoDTO {
  estado: 'ACTIVO' | 'INACTIVO';
}
