import type { FiltroProductos } from '../types/productos.types';

export const productosKeys = {
  all: ['productos'] as const,
  gestion: (filtro?: FiltroProductos) => [...productosKeys.all, 'gestion', filtro] as const,
  catalogo: (filtro?: FiltroProductos) => [...productosKeys.all, 'catalogo', filtro] as const,
  detalle: (id: number) => [...productosKeys.all, 'detalle', id] as const,
};

