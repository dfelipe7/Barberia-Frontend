import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usuariosService } from './usuarios.service';
import apiClient from '../../../shared/lib/http/axios';

vi.mock('../../../shared/lib/http/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('usuariosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('obtenerMiPerfil realiza GET a /usuarios/me', async () => {
    const mockUser = { id: 1, email: 'me@barberia.com' };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockUser });

    const res = await usuariosService.obtenerMiPerfil();
    expect(apiClient.get).toHaveBeenCalledWith('/usuarios/me');
    expect(res).toEqual(mockUser);
  });

  it('obtenerUsuario realiza GET a /usuarios/:id', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: 9 } });

    const res = await usuariosService.obtenerUsuario(9);
    expect(apiClient.get).toHaveBeenCalledWith('/usuarios/9');
    expect(res.id).toBe(9);
  });

  it('obtenerAdministradores realiza GET a /usuarios/administradores', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [{ id: 1 }] });

    const res = await usuariosService.obtenerAdministradores();
    expect(apiClient.get).toHaveBeenCalledWith('/usuarios/administradores');
    expect(res).toHaveLength(1);
  });

  it('crearAdministrador realiza POST a /usuarios/administradores', async () => {
    const dto = { nombre: 'Admin', apellido: 'Nuevo', email: 'admin@test.com' };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 2, ...dto } });

    const res = await usuariosService.crearAdministrador(dto);
    expect(apiClient.post).toHaveBeenCalledWith('/usuarios/administradores', dto);
    expect(res.id).toBe(2);
  });

  it('actualizarUsuario realiza PATCH a /usuarios/:id', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 2, nombre: 'Admin Upd' } });

    const res = await usuariosService.actualizarUsuario(2, { nombre: 'Admin Upd' });
    expect(apiClient.patch).toHaveBeenCalledWith('/usuarios/2', { nombre: 'Admin Upd' });
    expect(res.nombre).toBe('Admin Upd');
  });

  it('cambiarEstadoUsuario y cambiarEstado', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { mensaje: 'Ok' } });

    await usuariosService.cambiarEstadoUsuario(4, { estado: 'INACTIVO', tipo: 'administrador' });
    expect(apiClient.patch).toHaveBeenCalledWith('/usuarios/4/estado', { estado: 'INACTIVO', tipo: 'administrador' });

    await usuariosService.cambiarEstado(4, { estado: 'ACTIVO' });
    expect(apiClient.patch).toHaveBeenCalledWith('/usuarios/4/estado', { estado: 'ACTIVO' });
  });

  it('cambiarEstadoAdministrador realiza PATCH a /usuarios/administradores/:id/estado', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { mensaje: 'Admin OK' } });

    await usuariosService.cambiarEstadoAdministrador(3, { estado: 'ACTIVO' });
    expect(apiClient.patch).toHaveBeenCalledWith('/usuarios/administradores/3/estado', {
      estado: 'ACTIVO',
    });
  });

  it('configurarBarbero y configurarMeComoBarbero', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: undefined });

    const datos = { telefono: '3001234567', porcentajeComision: 45 };
    await usuariosService.configurarBarbero(12, datos);
    expect(apiClient.post).toHaveBeenCalledWith('/usuarios/12/barbero', datos);

    await usuariosService.configurarMeComoBarbero(datos);
    expect(apiClient.post).toHaveBeenCalledWith('/usuarios/me/barbero', datos);
  });
});

