import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../../shared/lib/http/axios';
import { perfilNegocioApi } from './perfilNegocioApi';
import type { ActualizarPerfilNegocioDto } from '../types/perfilNegocio.types';

describe('perfilNegocioApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('obtenerPerfilGestion debe llamar a GET /perfil-negocio/gestion', async () => {
    const mockData = { id: 1, nombreNegocio: 'Barbería Test' };
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockData });

    const result = await perfilNegocioApi.obtenerPerfilGestion();

    expect(apiClient.get).toHaveBeenCalledWith('/perfil-negocio/gestion');
    expect(result).toEqual(mockData);
  });

  it('obtenerPerfilPublico debe llamar a GET /perfil-negocio', async () => {
    const mockData = { nombreNegocio: 'Barbería Pública', slug: 'demo' };
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockData });

    const result = await perfilNegocioApi.obtenerPerfilPublico();

    expect(apiClient.get).toHaveBeenCalledWith('/perfil-negocio');
    expect(result).toEqual(mockData);
  });

  it('actualizarPerfil debe enviar PUT /perfil-negocio con el DTO', async () => {
    const dto: ActualizarPerfilNegocioDto = { frasePrincipal: 'Nuevo Nombre', direccion: 'Calle 100' };
    const mockResponse = { configurado: true, ...dto };
    vi.spyOn(apiClient, 'put').mockResolvedValueOnce({ data: mockResponse });

    const result = await perfilNegocioApi.actualizarPerfil(dto);

    expect(apiClient.put).toHaveBeenCalledWith('/perfil-negocio', dto);
    expect(result).toEqual(mockResponse);
  });

  it('subirRecurso debe enviar POST /perfil-negocio/:tipo con FormData', async () => {
    const file = new File(['dummy'], 'logo.svg', { type: 'image/svg+xml' });
    const mockResponse = { id: 1, logoBlancoUrl: '/uploads/logo.svg' };
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: mockResponse });

    const result = await perfilNegocioApi.subirRecurso('logo-blanco', file);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/perfil-negocio/logo-blanco',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('eliminarRecurso debe enviar DELETE /perfil-negocio/:tipo', async () => {
    const mockResponse = { id: 1, bannerUrl: null };
    vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({ data: mockResponse });

    const result = await perfilNegocioApi.eliminarRecurso('banner');

    expect(apiClient.delete).toHaveBeenCalledWith('/perfil-negocio/banner');
    expect(result).toEqual(mockResponse);
  });
});

