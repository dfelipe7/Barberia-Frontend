export type EstadoProducto = 'ACTIVO' | 'INACTIVO';

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagenUrl?: string | null;
  estado: EstadoProducto;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface FiltroProductos {
  nombre?: string;
  estado?: EstadoProducto;
}

