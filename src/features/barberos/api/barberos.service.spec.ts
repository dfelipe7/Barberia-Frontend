import { describe, it, expect, vi, beforeEach } from 'vitest';
import { barberosService } from './barberos.service';
import apiClient from '../../../shared/lib/http/axios';

vi.mock('../../../shared/lib/http/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('barberosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('obtenerBarberos realiza GET a /usuarios/barberos', async () => {
    const mockData = [{ id: 1, nombre: 'Carlos', apellido: 'Perez' }];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const result = await barberosService.obtenerBarberos();
    expect(apiClient.get).toHaveBeenCalledWith('/usuarios/barberos');
    expect(result).toEqual(mockData);
  });

  it('obtenerBarberosGestion pasa filtro como params', async () => {
    const filtro = { estado: 'ACTIVO' as const, nombre: 'Juan' };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

    await barberosService.obtenerBarberosGestion(filtro);
    expect(apiClient.get).toHaveBeenCalledWith('/usuarios/barberos/gestion', {
      params: filtro,
    });
  });

  it('crearBarbero realiza POST a /usuarios/barberos', async () => {
    const datos = {
      nombre: 'Nuevo',
      apellido: 'Barbero',
      email: 'barbero@test.com',
      telefono: '3001234567',
      porcentajeComision: 40,
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: undefined });

    await barberosService.crearBarbero(datos);
    expect(apiClient.post).toHaveBeenCalledWith('/usuarios/barberos', datos);
  });

  it('cambiarEstadoBarbero realiza PATCH a /usuarios/barberos/:id/estado', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { mensaje: 'OK' } });

    const res = await barberosService.cambiarEstadoBarbero(5, { estado: 'INACTIVO' });
    expect(apiClient.patch).toHaveBeenCalledWith('/usuarios/barberos/5/estado', {
      estado: 'INACTIVO',
    });
    expect(res).toEqual({ mensaje: 'OK' });
  });

  it('cambiarEstadoGlobalBarbero realiza PATCH a /usuarios/:id/estado con tipo barbero', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { mensaje: 'Global OK' } });

    const res = await barberosService.cambiarEstadoGlobalBarbero(7, { estado: 'ACTIVO' });
    expect(apiClient.patch).toHaveBeenCalledWith('/usuarios/7/estado', {
      estado: 'ACTIVO',
      tipo: 'barbero',
    });
    expect(res).toEqual({ mensaje: 'Global OK' });
  });

  it('actualizarComision realiza PATCH a /usuarios/barberos/:id/comision', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { mensaje: 'Comision OK' } });

    const res = await barberosService.actualizarComision(3, { porcentajeComision: 50 });
    expect(apiClient.patch).toHaveBeenCalledWith('/usuarios/barberos/3/comision', {
      porcentajeComision: 50,
    });
    expect(res).toEqual({ mensaje: 'Comision OK' });
  });

  it('subirFotoPropia envía FormData con header multipart', async () => {
    const mockFile = new File(['dummy content'], 'avatar.png', { type: 'image/png' });
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { fotoUrl: '/uploads/avatar.png', mensaje: 'Foto subida' },
    });

    const res = await barberosService.subirFotoPropia(mockFile);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/usuarios/barberos/foto',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    expect(res.fotoUrl).toBe('/uploads/avatar.png');
  });

  it('eliminarFotoPropia realiza DELETE a /usuarios/barberos/foto', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { mensaje: 'Foto eliminada' } });

    const res = await barberosService.eliminarFotoPropia();
    expect(apiClient.delete).toHaveBeenCalledWith('/usuarios/barberos/foto');
    expect(res).toEqual({ mensaje: 'Foto eliminada' });
  });

  it('subirFotoAdmin realiza POST a /usuarios/barberos/:id/foto', async () => {
    const mockFile = new File(['dummy'], 'barber.png', { type: 'image/png' });
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { fotoUrl: '/uploads/b8.png', mensaje: 'Ok' },
    });

    const res = await barberosService.subirFotoAdmin(8, mockFile);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/usuarios/barberos/8/foto',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    expect(res.fotoUrl).toBe('/uploads/b8.png');
  });
});

