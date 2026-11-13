import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productosService } from './productos.service';
import { productosKeys } from './productos.keys';
import type { Producto, FiltroProductos, EstadoProducto } from '../types/productos.types';
import type {
  CrearProductoDTO,
  ActualizarProductoDTO,
  ProductoCatalogoDTO,
} from './productos.dto';

/**
 * Hook de consulta React Query para el catálogo público de productos comerciales (clientes).
 */
export function useProductosCatalogo() {
  return useQuery<ProductoCatalogoDTO[], Error>({
    queryKey: productosKeys.catalogo(),
    queryFn: async () => {
      const respuesta = await productosService.obtenerCatalogo();
      return (respuesta.productos || []).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: Number(p.precio),
        imagenUrl: p.imagenUrl,
      }));
    },
    staleTime: 60_000,
  });
}

/**
 * Hook de consulta React Query para la gestión administrativa de productos.
 * Permite filtrar por nombre y estado en memoria para respuesta instantánea.
 */
export function useProductosGestion(filtro?: FiltroProductos) {
  return useQuery<Producto[], Error>({
    queryKey: productosKeys.gestion(filtro),
    queryFn: async () => {
      const respuesta = await productosService.obtenerProductos();
      let productos = (respuesta.productos || []).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: Number(p.precio),
        imagenUrl: p.imagenUrl,
        estado: p.estado,
        creadoEn: p.creadoEn,
        actualizadoEn: p.actualizadoEn,
      }));

      if (filtro?.nombre?.trim()) {
        const query = filtro.nombre.trim().toLowerCase();
        productos = productos.filter(
          (p) =>
            p.nombre.toLowerCase().includes(query) ||
            p.descripcion?.toLowerCase().includes(query)
        );
      }

      if (filtro?.estado) {
        productos = productos.filter((p) => p.estado === filtro.estado);
      }

      return productos;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

/**
 * Hook de mutación React Query para registrar un nuevo producto.
 */
export function useCrearProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: CrearProductoDTO) => productosService.crearProducto(datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productosKeys.all });
    },
  });
}

/**
 * Hook de mutación React Query para actualizar datos o imagen de un producto.
 */
export function useActualizarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ActualizarProductoDTO }) =>
      productosService.actualizarProducto(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productosKeys.all });
    },
  });
}

/**
 * Hook de mutación React Query para cambiar el estado (ACTIVO / INACTIVO) de un producto.
 */
export function useCambiarEstadoProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoProducto }) =>
      productosService.cambiarEstadoProducto(id, { estado }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productosKeys.all });
    },
  });
}

