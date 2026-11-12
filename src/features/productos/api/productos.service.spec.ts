import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productosService } from './productos.service';
import apiClient from '../../../shared/lib/http/axios';

vi.mock('../../../shared/lib/http/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('productosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('obtenerProductos realiza GET a /productos', async () => {
    const mockRespuesta = {
      productos: [
        {
          id: 1,
          nombre: 'Cera Mate',
          precio: 35000,
          estado: 'ACTIVO' as const,
        },
      ],
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRespuesta });

    const res = await productosService.obtenerProductos();
    expect(apiClient.get).toHaveBeenCalledWith('/productos');
    expect(res).toEqual(mockRespuesta);
  });

  it('obtenerPorId realiza GET a /productos/:id', async () => {
    const mockProducto = {
      id: 5,
      nombre: 'Aceite Barba',
      precio: 25000,
      estado: 'ACTIVO' as const,
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockProducto });

    const res = await productosService.obtenerPorId(5);
    expect(apiClient.get).toHaveBeenCalledWith('/productos/5');
    expect(res).toEqual(mockProducto);
  });

  it('crearProducto envía FormData con multipart/form-data a POST /productos', async () => {
    const mockRespuesta = {
      mensaje: 'Producto registrado correctamente',
      producto: {
        id: 1,
        nombre: 'Cera Fijadora',
        precio: 35000,
        estado: 'ACTIVO' as const,
      },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRespuesta });

    const res = await productosService.crearProducto({
      nombre: 'Cera Fijadora',
      precio: 35000,
      descripcion: 'Fijación fuerte',
    });

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    const [url, formData, config] = vi.mocked(apiClient.post).mock.calls[0];
    expect(url).toBe('/productos');
    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get('nombre')).toBe('Cera Fijadora');
    expect((formData as FormData).get('precio')).toBe('35000');
    expect((formData as FormData).get('descripcion')).toBe('Fijación fuerte');
    expect(config?.headers?.['Content-Type']).toBe('multipart/form-data');
    expect(res).toEqual(mockRespuesta);
  });

  it('actualizarProducto envía FormData a PATCH /productos/:id', async () => {
    const mockRespuesta = {
      mensaje: 'Producto actualizado correctamente',
      producto: {
        id: 1,
        nombre: 'Cera Fijadora Pro',
        precio: 40000,
        estado: 'ACTIVO' as const,
      },
    };
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: mockRespuesta });

    const res = await productosService.actualizarProducto(1, {
      nombre: 'Cera Fijadora Pro',
      precio: 40000,
    });

    expect(apiClient.patch).toHaveBeenCalledTimes(1);
    const [url, formData, config] = vi.mocked(apiClient.patch).mock.calls[0];
    expect(url).toBe('/productos/1');
    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get('nombre')).toBe('Cera Fijadora Pro');
    expect((formData as FormData).get('precio')).toBe('40000');
    expect(config?.headers?.['Content-Type']).toBe('multipart/form-data');
    expect(res).toEqual(mockRespuesta);
  });

  it('cambiarEstadoProducto realiza PATCH a /productos/:id/estado con JSON', async () => {
    const mockRespuesta = {
      mensaje: 'Estado del producto actualizado correctamente',
      producto: {
        id: 1,
        nombre: 'Cera',
        precio: 35000,
        estado: 'INACTIVO' as const,
      },
    };
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: mockRespuesta });

    const res = await productosService.cambiarEstadoProducto(1, {
      estado: 'INACTIVO',
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/productos/1/estado', {
      estado: 'INACTIVO',
    });
    expect(res).toEqual(mockRespuesta);
  });
});

