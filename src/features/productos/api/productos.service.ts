import apiClient from '../../../shared/lib/http/axios';
import type {
  ProductoDTO,
  ProductosListadoDTO,
  ProductoRespuestaDTO,
  CrearProductoDTO,
  ActualizarProductoDTO,
  CambiarEstadoProductoDTO,
} from './productos.dto';

/**
 * SERVICIO HTTP PURO (Capa API de Productos):
 * Realiza las llamadas REST directas al backend bajo aislamiento multitenant.
 */
export const productosService = {
  /**
   * Obtiene la lista administrativa de productos (activos e inactivos) del negocio activo.
   */
  async obtenerProductos(): Promise<ProductosListadoDTO> {
    const response = await apiClient.get<ProductosListadoDTO>('/productos');
    return response.data;
  },

  /**
   * Obtiene el detalle administrativo de un producto por su ID.
   */
  async obtenerPorId(id: number): Promise<ProductoDTO> {
    const response = await apiClient.get<ProductoDTO>(`/productos/${id}`);
    return response.data;
  },

  /**
   * Registra un nuevo producto con datos comerciales y fotografía opcional.
   */
  async crearProducto(datos: CrearProductoDTO): Promise<ProductoRespuestaDTO> {
    const formData = new FormData();
    formData.append('nombre', datos.nombre.trim());
    formData.append('precio', String(datos.precio));
    if (datos.descripcion && datos.descripcion.trim().length > 0) {
      formData.append('descripcion', datos.descripcion.trim());
    }
    if (datos.imagen instanceof File) {
      formData.append('imagen', datos.imagen);
    }

    const response = await apiClient.post<ProductoRespuestaDTO>('/productos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Actualiza los datos comerciales de un producto o reemplaza su imagen.
   */
  async actualizarProducto(
    id: number,
    datos: ActualizarProductoDTO
  ): Promise<ProductoRespuestaDTO> {
    const formData = new FormData();
    if (datos.nombre !== undefined) {
      formData.append('nombre', datos.nombre.trim());
    }
    if (datos.precio !== undefined) {
      formData.append('precio', String(datos.precio));
    }
    if (datos.descripcion !== undefined) {
      formData.append('descripcion', datos.descripcion ? datos.descripcion.trim() : '');
    }
    if (datos.imagen instanceof File) {
      formData.append('imagen', datos.imagen);
    }

    const response = await apiClient.patch<ProductoRespuestaDTO>(
      `/productos/${id}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  /**
   * Modifica explícitamente el estado comercial (ACTIVO / INACTIVO) de un producto.
   */
  async cambiarEstadoProducto(
    id: number,
    datos: CambiarEstadoProductoDTO
  ): Promise<ProductoRespuestaDTO> {
    const response = await apiClient.patch<ProductoRespuestaDTO>(
      `/productos/${id}/estado`,
      datos
    );
    return response.data;
  },
};

