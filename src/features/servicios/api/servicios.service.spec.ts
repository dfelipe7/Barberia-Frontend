import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serviciosService } from './servicios.service';
import apiClient from '../../../shared/lib/http/axios';

vi.mock('../../../shared/lib/http/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('serviciosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('obtenerServiciosCatalogo realiza GET a /servicios', async () => {
    const mockServicios = [{ id: 1, nombre: 'Corte' }];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockServicios });

    const res = await serviciosService.obtenerServiciosCatalogo({ nombre: 'corte' });
    expect(apiClient.get).toHaveBeenCalledWith('/servicios', {
      params: { nombre: 'corte' },
    });
    expect(res).toEqual(mockServicios);
  });

  it('obtenerServiciosPorBarbero realiza GET con el id del barbero', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

    await serviciosService.obtenerServiciosPorBarbero(4);
    expect(apiClient.get).toHaveBeenCalledWith('/servicios/barbero/4');
  });

  it('obtenerServiciosGestion realiza GET a /servicios/gestion', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

    await serviciosService.obtenerServiciosGestion();
    expect(apiClient.get).toHaveBeenCalledWith('/servicios/gestion', { params: undefined });
  });

  it('crearServicio realiza POST a /servicios', async () => {
    const payload = {
      nombre: 'Barba',
      precio: 10000,
      duracionMinutos: 20,
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 2, ...payload } });

    const res = await serviciosService.crearServicio(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/servicios', payload);
    expect(res.id).toBe(2);
  });

  it('actualizarServicio realiza PATCH a /servicios/:id', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 2, nombre: 'Barba Pro' } });

    const res = await serviciosService.actualizarServicio(2, { nombre: 'Barba Pro' });
    expect(apiClient.patch).toHaveBeenCalledWith('/servicios/2', { nombre: 'Barba Pro' });
    expect(res.nombre).toBe('Barba Pro');
  });

  it('cambiarEstadoServicio realiza PATCH a /servicios/:id/estado', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { mensaje: 'Estado cambiado' } });

    const res = await serviciosService.cambiarEstadoServicio(3, { estado: 'INACTIVO' });
    expect(apiClient.patch).toHaveBeenCalledWith('/servicios/3/estado', {
      estado: 'INACTIVO',
    });
    expect(res.mensaje).toBe('Estado cambiado');
  });

  it('subirFotoServicio envía FormData con header multipart', async () => {
    const file = new File(['test'], 'servicio.png', { type: 'image/png' });
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 1, fotoUrl: '/servicios/1.png' } });

    const res = await serviciosService.subirFotoServicio(1, file);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/servicios/1/foto',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    expect(res.fotoUrl).toBe('/servicios/1.png');
  });

  it('eliminarFotoServicio realiza DELETE a /servicios/:id/foto', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { mensaje: 'Foto borrada' } });

    const res = await serviciosService.eliminarFotoServicio(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/servicios/1/foto');
    expect(res.mensaje).toBe('Foto borrada');
  });
});

