export interface BarberoCatalogoDTO {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
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
}

export interface CrearBarberoDTO {
  email: string;
  password: string;
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
