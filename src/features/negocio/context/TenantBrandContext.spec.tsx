import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  TenantBrandProvider,
  useTenantBrand,
  resolverUrlRecurso,
} from './TenantBrandContext';
import { perfilNegocioApi } from '../services/perfilNegocioApi';
import { redesSocialesApi } from '../services/redesSocialesApi';
import * as axiosHelper from '../../../shared/lib/http/axios';

describe('TenantBrandContext y resolverUrlRecurso', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('resolverUrlRecurso', () => {
    it('debe retornar null para valores vacíos o indefinidos', () => {
      expect(resolverUrlRecurso(null)).toBeNull();
      expect(resolverUrlRecurso(undefined)).toBeNull();
      expect(resolverUrlRecurso('')).toBeNull();
    });

    it('debe mantener intactas las URLs absolutas con http o https', () => {
      const urlHttp = 'http://cdn.barberia.com/logo.svg';
      const urlHttps = 'https://cdn.barberia.com/logo.svg';

      expect(resolverUrlRecurso(urlHttp)).toBe(urlHttp);
      expect(resolverUrlRecurso(urlHttps)).toBe(urlHttps);
    });

    it('debe concatenar la URL base con paths relativos', () => {
      const relativo = '/uploads/banner.png';
      const res = resolverUrlRecurso(relativo);
      expect(res).toContain(relativo);
    });
  });

  describe('TenantBrandProvider y useTenantBrand', () => {
    it('debe proveer valores por defecto cuando no hay slug activo', () => {
      vi.spyOn(axiosHelper, 'obtenerNegocioSlugActivo').mockReturnValue(null);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter initialEntries={['/']}>
          <TenantBrandProvider>{children}</TenantBrandProvider>
        </MemoryRouter>
      );

      const { result } = renderHook(() => useTenantBrand(), { wrapper });

      expect(result.current.slug).toBeNull();
      expect(result.current.configurado).toBe(false);
      expect(result.current.redesSociales).toEqual([]);
    });

    it('debe cargar el perfil público y las redes sociales si existe un slug activo', async () => {
      vi.spyOn(axiosHelper, 'obtenerNegocioSlugActivo').mockReturnValue('barberia-demo');

      const mockPerfil = {
        id: 1,
        negocioId: 10,
        nombreNegocio: 'Demo Barber',
        frasePrincipal: 'Calidad superior',
        bannerUrl: 'https://cdn.example.com/banner.png',
        logoBlancoUrl: null,
        logoNegroUrl: null,
        faviconUrl: null,
        direccion: 'Calle 10 # 5-20',
        ciudad: 'Popayán',
        departamento: 'Cauca',
        referencia: null,
        latitud: 2.44,
        longitud: -76.6,
        mapsUrl: null,
        configurado: true,
        redesSociales: [],
        negocio: {
          id: 10,
          nombre: 'Demo Barber',
          slug: 'barberia-demo',
          temaId: 'cyber-lime',
        },
      };

      const mockRedes = [
        { id: 1, negocioId: 10, red: 'INSTAGRAM' as const, url: 'https://instagram.com/demo', activo: true, orden: 1 },
      ];

      vi.spyOn(perfilNegocioApi, 'obtenerPerfilPublico').mockResolvedValueOnce(mockPerfil as any);
      vi.spyOn(redesSocialesApi, 'listar').mockResolvedValueOnce(mockRedes as any);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter initialEntries={['/barberia-demo']}>
          <TenantBrandProvider>{children}</TenantBrandProvider>
        </MemoryRouter>
      );

      const { result } = renderHook(() => useTenantBrand(), { wrapper });

      await waitFor(() => {
        expect(result.current.nombreNegocio).toBe('Demo Barber');
      });

      expect(result.current.ciudad).toBe('Popayán');
      expect(result.current.redesSociales).toHaveLength(1);
      expect(result.current.configurado).toBe(true);
    });

    it('debe persistir el temaKey del perfil público en localStorage y en dataset.tenantTheme', async () => {
      vi.spyOn(axiosHelper, 'obtenerNegocioSlugActivo').mockReturnValue('barberia-amber');
      localStorage.clear();

      const mockPerfil = {
        id: 2,
        negocioId: 20,
        nombreNegocio: 'Amber Barber',
        frasePrincipal: 'Estilo clásico',
        temaKey: 'sunset-amber',
        configurado: true,
        redesSociales: [],
      };

      vi.spyOn(perfilNegocioApi, 'obtenerPerfilPublico').mockResolvedValueOnce(mockPerfil as any);
      vi.spyOn(redesSocialesApi, 'listar').mockResolvedValueOnce([]);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter initialEntries={['/barberia-amber']}>
          <TenantBrandProvider>{children}</TenantBrandProvider>
        </MemoryRouter>
      );

      renderHook(() => useTenantBrand(), { wrapper });

      await waitFor(() => {
        expect(localStorage.getItem('tema_negocio_barberia-amber')).toBe('sunset-amber');
        expect(document.documentElement.dataset.tenantTheme).toBe('sunset-amber');
      });
    });
  });
});

