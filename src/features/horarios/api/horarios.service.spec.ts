import { describe, it, expect, vi, beforeEach } from 'vitest';
import { horariosService } from './horarios.service';
import apiClient from '../../../shared/lib/http/axios';
import type { HorarioSemanalDTO, GuardarHorarioSemanalDTO, CrearBloqueoHorarioDTO, ActualizarBloqueoHorarioDTO } from './horarios.dto';

vi.mock('../../../shared/lib/http/axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('horariosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('obtenerMiHorario y guardarMiHorario', async () => {
    const mockHorario: HorarioSemanalDTO = { barberoId: 1, franjas: [] };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockHorario });
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockHorario });

    const resGet = await horariosService.obtenerMiHorario();
    expect(apiClient.get).toHaveBeenCalledWith('/usuarios/me/barbero/horario-semanal');
    expect(resGet).toEqual(mockHorario);

    const guardarDto: GuardarHorarioSemanalDTO = { franjas: [] };
    const resPut = await horariosService.guardarMiHorario(guardarDto);
    expect(apiClient.put).toHaveBeenCalledWith('/usuarios/me/barbero/horario-semanal', guardarDto);
    expect(resPut).toEqual(mockHorario);
  });

  it('consultarMiDisponibilidad realiza GET con fecha', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { slots: [] } });

    await horariosService.consultarMiDisponibilidad('2026-11-05');
    expect(apiClient.get).toHaveBeenCalledWith('/usuarios/me/barbero/disponibilidad', {
      params: { fecha: '2026-11-05' },
    });
  });

  it('bloqueos: obtenerBloqueos, crearBloqueo, actualizarBloqueo, cancelarBloqueo, reactivarBloqueo', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { mensaje: 'Creado' } });
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { mensaje: 'Actualizado' } });
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { mensaje: 'Eliminado' } });

    await horariosService.obtenerBloqueos();
    expect(apiClient.get).toHaveBeenCalledWith('/usuarios/me/barbero/bloqueos-horario');

    const crearDto: CrearBloqueoHorarioDTO = { date: '2026-11-05', startTime: '08:00', endTime: '12:00' };
    await horariosService.crearBloqueo(crearDto);
    expect(apiClient.post).toHaveBeenCalledWith('/usuarios/me/barbero/bloqueos-horario', crearDto);

    const updDto: ActualizarBloqueoHorarioDTO = { date: '2026-11-05', startTime: '08:00', endTime: '13:00', reason: null, notes: null };
    await horariosService.actualizarBloqueo(1, updDto);
    expect(apiClient.patch).toHaveBeenCalledWith('/usuarios/me/barbero/bloqueos-horario/1', updDto);

    await horariosService.cancelarBloqueo(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/usuarios/me/barbero/bloqueos-horario/1');

    await horariosService.reactivarBloqueo(1);
    expect(apiClient.patch).toHaveBeenCalledWith('/usuarios/me/barbero/bloqueos-horario/1/reactivar');
  });
});
