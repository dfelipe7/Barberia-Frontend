import type { EstadoProducto } from '../types/productos.types';

export interface ProductoDTO {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagenUrl?: string | null;
  estado: EstadoProducto;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface ProductoCatalogoDTO {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagenUrl?: string | null;
}

export interface ProductosCatalogoDTO {
  mensaje?: string;
  productos: ProductoCatalogoDTO[];
}

export interface ProductosListadoDTO {
  mensaje?: string;
  productos: ProductoDTO[];
}

export interface ProductoRespuestaDTO {
  mensaje: string;
  producto: ProductoDTO;
}

export interface CrearProductoDTO {
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen?: File | null;
}

export interface ActualizarProductoDTO {
  nombre?: string;
  descripcion?: string | null;
  precio?: number;
  imagen?: File | null;
}

export interface CambiarEstadoProductoDTO {
  estado: EstadoProducto;
}

export interface FiltroProductosDTO {
  nombre?: string;
  estado?: EstadoProducto;
}

