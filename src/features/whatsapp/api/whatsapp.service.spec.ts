import { describe, it, expect, vi, beforeEach } from 'vitest';
import { whatsappService } from './whatsapp.service';
import apiClient from '../../../shared/lib/http/axios';
import type { WhatsAppPlantillas, WhatsAppStatus, DesconectarResponse } from '../types/whatsapp.types';

vi.mock('../../../shared/lib/http/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('whatsappService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getStatus consulta /whatsapp/status', async () => {
    const mockStatus: WhatsAppStatus = { conectado: true, qr: null };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockStatus });
    const res = await whatsappService.getStatus();
    expect(apiClient.get).toHaveBeenCalledWith('/whatsapp/status');
    expect(res.conectado).toBe(true);
  });

  it('iniciar y pausar realizan POST respectivos', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { mensaje: 'Ok' } });

    await whatsappService.iniciar();
    expect(apiClient.post).toHaveBeenCalledWith('/whatsapp/iniciar');

    await whatsappService.pausar();
    expect(apiClient.post).toHaveBeenCalledWith('/whatsapp/pausar');
  });

  it('desconectar realiza POST a /whatsapp/desconectar', async () => {
    const mockDesconectar: DesconectarResponse = { mensaje: 'Sesión desvinculada' };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockDesconectar });
    const res = await whatsappService.desconectar();
    expect(apiClient.post).toHaveBeenCalledWith('/whatsapp/desconectar');
    expect(res.mensaje).toBe('Sesión desvinculada');
  });

  it('getPlantillas, guardarPlantillas y resetPlantillas', async () => {
    const mockPlantillas: WhatsAppPlantillas = { confirmacion: 'Hola', recordatorio: 'Recordatorio', minutosAnticipacion: 60 };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockPlantillas });
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: mockPlantillas });
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockPlantillas });

    const getRes = await whatsappService.getPlantillas();
    expect(getRes).toEqual(mockPlantillas);

    const putRes = await whatsappService.guardarPlantillas(mockPlantillas);
    expect(apiClient.put).toHaveBeenCalledWith('/whatsapp/plantillas', mockPlantillas);
    expect(putRes).toEqual(mockPlantillas);

    const resetRes = await whatsappService.resetPlantillas();
    expect(apiClient.post).toHaveBeenCalledWith('/whatsapp/plantillas/reset');
    expect(resetRes).toEqual(mockPlantillas);
  });
});
