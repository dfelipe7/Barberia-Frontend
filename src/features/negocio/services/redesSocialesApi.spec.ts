import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../../shared/lib/http/axios';
import { redesSocialesApi } from './redesSocialesApi';
import { normalizarEntradaRed } from '../components/RedesSocialesSection';
import type { CrearRedSocialDto, RedSocial } from '../types/redesSociales.types';

describe('redesSocialesApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('listar debe consultar GET /perfil-negocio/redes-sociales sin parámetros por defecto', async () => {
    const mockData: RedSocial[] = [
      { id: 1, tipo: 'INSTAGRAM', nombre: 'Instagram', url: 'https://instagram.com/test', orden: 1, activo: true },
    ];
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockData });

    const result = await redesSocialesApi.listar();

    expect(apiClient.get).toHaveBeenCalledWith('/perfil-negocio/redes-sociales', { params: undefined });
    expect(result).toEqual(mockData);
  });

  it('listar con todas=true debe enviar el parámetro { todas: "true" }', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: [] });

    await redesSocialesApi.listar(true);

    expect(apiClient.get).toHaveBeenCalledWith('/perfil-negocio/redes-sociales', {
      params: { todas: 'true' },
    });
  });

  it('reemplazar debe enviar PUT con las redes a sincronizar', async () => {
    const redes: CrearRedSocialDto[] = [{ tipo: 'TIKTOK', url: 'https://tiktok.com/@barber' }];
    vi.spyOn(apiClient, 'put').mockResolvedValueOnce({ data: redes });

    const result = await redesSocialesApi.reemplazar(redes);

    expect(apiClient.put).toHaveBeenCalledWith('/perfil-negocio/redes-sociales', { redes });
    expect(result).toEqual(redes);
  });

  it('actualizar debe enviar PATCH al ID de la red social', async () => {
    const dto = { url: 'https://instagram.com/nuevo' };
    vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({ data: { id: 5, ...dto } });

    const result = await redesSocialesApi.actualizar(5, dto);

    expect(apiClient.patch).toHaveBeenCalledWith('/perfil-negocio/redes-sociales/5', dto);
    expect(result.id).toBe(5);
  });

  it('desactivar debe enviar DELETE al ID sin parámetro definitivo', async () => {
    vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({ data: { id: 2, activo: false } });

    const result = await redesSocialesApi.desactivar(2);

    expect(apiClient.delete).toHaveBeenCalledWith('/perfil-negocio/redes-sociales/2');
    expect(result.activo).toBe(false);
  });

  it('eliminarDefinitivo debe enviar DELETE con parámetro definitivo=true', async () => {
    vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({ data: { id: 3 } });

    await redesSocialesApi.eliminarDefinitivo(3);

    expect(apiClient.delete).toHaveBeenCalledWith('/perfil-negocio/redes-sociales/3', {
      params: { definitivo: 'true' },
    });
  });

  it('activar debe enviar PATCH al endpoint de reactivación', async () => {
    vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({ data: { id: 4, activo: true } });

    const result = await redesSocialesApi.activar(4);

    expect(apiClient.patch).toHaveBeenCalledWith('/perfil-negocio/redes-sociales/4/activar');
    expect(result.activo).toBe(true);
  });
});

describe('normalizarEntradaRed', () => {
  it('convierte un número celular de 10 dígitos que inicia en 3 a https://wa.me/57...', () => {
    expect(normalizarEntradaRed('WHATSAPP', '3001234567')).toBe('https://wa.me/573001234567');
  });

  it('normaliza números con espacios o símbolos para WhatsApp', () => {
    expect(normalizarEntradaRed('WHATSAPP', '+57 300 123 4567')).toBe('https://wa.me/573001234567');
    expect(normalizarEntradaRed('WHATSAPP', '573001234567')).toBe('https://wa.me/573001234567');
  });

  it('respeta URLs que ya tienen el protocolo y dominio de WhatsApp', () => {
    expect(normalizarEntradaRed('WHATSAPP', 'https://wa.me/573001234567')).toBe('https://wa.me/573001234567');
    expect(normalizarEntradaRed('WHATSAPP', 'wa.me/573001234567')).toBe('https://wa.me/573001234567');
  });

  it('convierte un usuario @usuario a la URL completa para Instagram y TikTok', () => {
    expect(normalizarEntradaRed('INSTAGRAM', '@barberia_cool')).toBe('https://instagram.com/barberia_cool');
    expect(normalizarEntradaRed('TIKTOK', '@barberia_cool')).toBe('https://tiktok.com/@barberia_cool');
    expect(normalizarEntradaRed('FACEBOOK', 'barberia_cool')).toBe('https://facebook.com/barberia_cool');
  });
});

