import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../../shared/lib/http/axios';
import { politicasReservaApi } from './politicasReservaApi';
import type { PoliticasReserva } from '../types/politicasReserva.types';

describe('politicasReservaApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('obtenerPoliticas debe llamar a GET /configuracion/politicas', async () => {
    const mockData: PoliticasReserva = {
      reservaCancelacionAntelacionMinutos: 120,
      reservaNoShowToleranciaMinutos: 15,
      reservaMaxCitasDiariasCliente: 3,
    };
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockData });

    const result = await politicasReservaApi.obtenerPoliticas();

    expect(apiClient.get).toHaveBeenCalledWith('/configuracion/politicas');
    expect(result).toEqual(mockData);
  });

  it('actualizarPoliticas debe enviar PUT /configuracion/politicas con los datos', async () => {
    const payload: PoliticasReserva = {
      reservaCancelacionAntelacionMinutos: 60,
      reservaNoShowToleranciaMinutos: 20,
      reservaMaxCitasDiariasCliente: 2,
    };
    vi.spyOn(apiClient, 'put').mockResolvedValueOnce({ data: payload });

    const result = await politicasReservaApi.actualizarPoliticas(payload);

    expect(apiClient.put).toHaveBeenCalledWith('/configuracion/politicas', payload);
    expect(result).toEqual(payload);
  });
});
