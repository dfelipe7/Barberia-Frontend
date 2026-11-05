import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../../shared/lib/http/axios';
import type { ClienteSesionDTO } from './reservas.dto';

const { mockReservasClient } = vi.hoisted(() => ({
  mockReservasClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockReservasClient),
  },
}));

vi.mock('../../../shared/lib/http/axios', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: mockApi,
    obtenerNegocioSlugActivo: vi.fn(() => 'mi-barberia'),
  };
});

import { clientesService, reservasService } from './reservas.service';

describe('reservas.service', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('clientesService', () => {
    it('guardarSesion, obtenerSesion y cerrarSesion aislan por negocio slug', () => {
      const mockSesion = {
        accessToken: 'jwt-123',
        cliente: {
          id: 1,
          nombre: 'Juan',
          apellido: 'Cliente',
          email: 'cliente@test.com',
        },
      };

      clientesService.guardarSesion(mockSesion, 'barberia-centro');
      expect(localStorage.getItem('token_cliente_barberia-centro')).toBe('jwt-123');

      const sesionRecuperada = clientesService.obtenerSesion('barberia-centro') as (ClienteSesionDTO & { negocioSlug?: string }) | null;
      expect(sesionRecuperada?.nombre).toBe('Juan');
      expect(sesionRecuperada?.negocioSlug).toBe('barberia-centro');

      const token = clientesService.obtenerToken('barberia-centro');
      expect(token).toBe('jwt-123');

      clientesService.cerrarSesion('barberia-centro');
      expect(clientesService.obtenerToken('barberia-centro')).toBeNull();
      expect(clientesService.obtenerSesion('barberia-centro')).toBeNull();
    });

    it('obtenerSesion retorna null si no hay token o json corrupto', () => {
      expect(clientesService.obtenerSesion('otra-sede')).toBeNull();

      localStorage.setItem('token_cliente_otra-sede', 'tok');
      localStorage.setItem('cliente_otra-sede', 'invalid-json');
      expect(clientesService.obtenerSesion('otra-sede')).toBeNull();
    });

    it('iniciarSesionGoogle y obtenerPerfil', async () => {
      mockReservasClient.post.mockResolvedValueOnce({
        data: { accessToken: 'tok-google', cliente: { id: 1, nombre: 'Ana', apellido: null, email: 'ana@test.com' } },
      });
      const loginRes = await clientesService.iniciarSesionGoogle('id-tok-123', 'barberia-centro');
      expect(mockReservasClient.post).toHaveBeenCalledWith(
        '/auth/clientes/google',
        { idToken: 'id-tok-123' },
        { headers: { 'X-Negocio-Slug': 'barberia-centro' } }
      );
      expect(loginRes.accessToken).toBe('tok-google');

      mockReservasClient.get.mockResolvedValueOnce({
        data: { id: 1, nombre: 'Ana', apellido: null, email: 'ana@test.com', telefono: null },
      });
      const perfilRes = await clientesService.obtenerPerfil();
      expect(mockReservasClient.get).toHaveBeenCalledWith('/auth/clientes/perfil');
      expect(perfilRes.nombre).toBe('Ana');
    });

    it('actualizarPerfil actualiza y sincroniza sesion local si existe', async () => {
      clientesService.guardarSesion({
        accessToken: 'old-token',
        cliente: { id: 1, nombre: 'Pedro', apellido: 'Perez', email: 'p@test.com' },
      }, 'mi-barberia');

      mockReservasClient.patch.mockResolvedValueOnce({
        data: { id: 1, nombre: 'Pedro Upd', apellido: 'Perez Upd', email: 'upd@test.com', telefono: '3000000000' },
      });

      const upd = await clientesService.actualizarPerfil({ nombre: 'Pedro Upd' });
      expect(upd.nombre).toBe('Pedro Upd');

      const sesionActualizada = clientesService.obtenerSesion('mi-barberia');
      expect(sesionActualizada?.nombre).toBe('Pedro Upd');
    });
  });

  describe('reservasService portal público y cliente', () => {
    it('obtenerBarberosPorServicio y obtenerDisponibilidad', async () => {
      mockReservasClient.get.mockResolvedValueOnce({ data: [{ id: 1, nombre: 'Barbero 1' }] });
      const barberos = await reservasService.obtenerBarberosPorServicio(5);
      expect(mockReservasClient.get).toHaveBeenCalledWith('/servicios/5/barberos');
      expect(barberos).toHaveLength(1);

      mockReservasClient.get.mockResolvedValueOnce({ data: { disponibilidad: [] } });
      await reservasService.obtenerDisponibilidad({ barberoId: 2, servicioId: 3, fecha: '2026-11-05' });
      expect(mockReservasClient.get).toHaveBeenCalledWith(
        '/usuarios/barberos/2/disponibilidad',
        { params: { servicioId: 3, fecha: '2026-11-05' } }
      );
    });

    it('crearReserva guarda tokenGestion en sessionStorage si existe', async () => {
      mockReservasClient.post.mockResolvedValueOnce({
        data: { id: 99, tokenGestion: 'tok-invitado-99' },
      });

      const res = await reservasService.crearReserva({
        barberoId: 1,
        servicioId: 2,
        fecha: '2026-11-05',
        hora: '10:00',
        nombre: 'Invitado',
      });

      expect(res.id).toBe(99);
      expect(sessionStorage.getItem('reserva_invitado_gestion_99')).toBe('tok-invitado-99');
    });

    it('gestión invitado: obtenerReservaInvitado, modificarReservaInvitado, cancelarReservaInvitado', async () => {
      mockReservasClient.get.mockResolvedValueOnce({ data: { id: 10, estado: 'PENDING' } });
      const res = await reservasService.obtenerReservaInvitado(10, 'token-xyz');
      expect(mockReservasClient.get).toHaveBeenCalledWith('/reservas/invitado/10', {
        headers: { 'X-Reservation-Management-Token': 'token-xyz' },
        params: { token: 'token-xyz' },
      });
      expect(res.id).toBe(10);

      mockReservasClient.patch.mockResolvedValueOnce({ data: { id: 10, estado: 'CONFIRMED' } });
      const mod = await reservasService.modificarReservaInvitado(10, 'token-xyz', { hora: '11:00' });
      expect(mod.estado).toBe('CONFIRMED');

      mockReservasClient.patch.mockResolvedValueOnce({ data: { id: 10, estado: 'CANCELLED', mensaje: 'Cancelada' } });
      const can = await reservasService.cancelarReservaInvitado(10, 'token-xyz');
      expect(can.estado).toBe('CANCELLED');
    });

    it('portal cliente registrado: listarMisReservas, obtenerMiReserva, modificarMiReserva, cancelarMiReserva', async () => {
      mockReservasClient.get.mockResolvedValueOnce({ data: { activas: [], pasadas: [] } });
      await reservasService.listarMisReservas();
      expect(mockReservasClient.get).toHaveBeenCalledWith('/reservas/me');

      mockReservasClient.get.mockResolvedValueOnce({ data: { id: 15 } });
      await reservasService.obtenerMiReserva(15);
      expect(mockReservasClient.get).toHaveBeenCalledWith('/reservas/me/15');

      mockReservasClient.patch.mockResolvedValueOnce({ data: { id: 15, estado: 'CONFIRMED' } });
      await reservasService.modificarMiReserva(15, { hora: '12:00' });
      expect(mockReservasClient.patch).toHaveBeenCalledWith('/reservas/me/15', { hora: '12:00' });

      mockReservasClient.patch.mockResolvedValueOnce({ data: { mensaje: 'Cancelada' } });
      await reservasService.cancelarMiReserva(15);
      expect(mockReservasClient.patch).toHaveBeenCalledWith('/reservas/me/15/cancelar');
    });
  });

  describe('reservasService administración', () => {
    it('guardarTokenGestionInvitado, obtenerTokenGestionInvitado y eliminarTokenGestionInvitado', () => {
      reservasService.guardarTokenGestionInvitado(10, 'token-gestion-xyz');
      expect(reservasService.obtenerTokenGestionInvitado(10)).toBe('token-gestion-xyz');

      reservasService.eliminarTokenGestionInvitado(10);
      expect(reservasService.obtenerTokenGestionInvitado(10)).toBeNull();
    });

    it('obtenerAgendaSemanalBarbero llama a /reservas/barbero/me/agenda con params', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { reservas: [] } });

      const res = await reservasService.obtenerAgendaSemanalBarbero('2026-11-01', '2026-11-07');
      expect(apiClient.get).toHaveBeenCalledWith('/reservas/barbero/me/agenda', {
        params: { desde: '2026-11-01', hasta: '2026-11-07' },
      });
      expect(res).toEqual({ reservas: [] });
    });

    it('buscarClientesAdministrativos maneja array y objeto con propiedad clientes', async () => {
      const mockList = [{ id: 1, nombre: 'Ana' }];
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockList });

      const res1 = await reservasService.buscarClientesAdministrativos('Ana');
      expect(res1).toEqual(mockList);

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { clientes: mockList } });
      const res2 = await reservasService.buscarClientesAdministrativos('Ana');
      expect(res2).toEqual(mockList);
    });

    it('crearReservaAdministrativa realiza POST y almacena token si existe', async () => {
      const dto = {
        barberoId: 1,
        servicioId: 2,
        fecha: '2026-11-05',
        hora: '10:00',
        nombre: 'Mario',
        telefono: '3001234567',
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { id: 88, tokenGestion: 'tok-admin-88' },
      });

      const res = await reservasService.crearReservaAdministrativa(dto);
      expect(apiClient.post).toHaveBeenCalledWith('/reservas/admin', dto);
      expect(res.id).toBe(88);
      expect(sessionStorage.getItem('reserva_invitado_gestion_88')).toBe('tok-admin-88');
    });

    it('listarReservasAdministrativas realiza GET a /reservas/admin', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

      await reservasService.listarReservasAdministrativas({ estado: 'CONFIRMED' });
      expect(apiClient.get).toHaveBeenCalledWith('/reservas/admin', {
        params: { estado: 'CONFIRMED' },
      });
    });

    it('obtenerReservaAdministrativa realiza GET a /reservas/admin/:id', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: 5 } });

      const res = await reservasService.obtenerReservaAdministrativa(5);
      expect(apiClient.get).toHaveBeenCalledWith('/reservas/admin/5');
      expect(res.id).toBe(5);
    });

    it('modificarReservaAdministrativa realiza PATCH a /reservas/admin/:id', async () => {
      vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 5, estado: 'CONFIRMED' } });

      const res = await reservasService.modificarReservaAdministrativa(5, { hora: '11:00' });
      expect(apiClient.patch).toHaveBeenCalledWith('/reservas/admin/5', { hora: '11:00' });
      expect(res.estado).toBe('CONFIRMED');
    });

    it('cancelarReservaAdministrativa realiza PATCH a /reservas/admin/:id/cancelar', async () => {
      vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 5, estado: 'CANCELLED', mensaje: 'Ok' } });

      await reservasService.cancelarReservaAdministrativa(5);
      expect(apiClient.patch).toHaveBeenCalledWith('/reservas/admin/5/cancelar');
    });

    it('completarReserva y marcarReservaNoAsistida', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: { id: 10, estado: 'COMPLETED', mensaje: 'Ok' } });

      await reservasService.completarReserva(10);
      expect(apiClient.patch).toHaveBeenCalledWith('/reservas/10/completar');

      await reservasService.marcarReservaNoAsistida(10);
      expect(apiClient.patch).toHaveBeenCalledWith('/reservas/10/no-show');
    });
  });
});
