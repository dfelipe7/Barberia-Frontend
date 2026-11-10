import { describe, it, expect, beforeEach, vi } from 'vitest';
import apiClient, { RUTAS_RESERVADAS, obtenerNegocioSlugActivo } from './axios';

describe('Utilidades de Axios y Resolución Multitenant (axios.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('RUTAS_RESERVADAS', () => {
    it('debe contener las rutas del sistema que nunca son nombres de barbería', () => {
      const reservadasEsperadas = ['login', 'dashboard', 'reservas', 'barberos', 'servicios', 'plataforma'];
      reservadasEsperadas.forEach((ruta) => {
        expect(RUTAS_RESERVADAS.has(ruta)).toBe(true);
      });
    });

    it('no debe marcar slugs legítimos de barberías como reservados', () => {
      expect(RUTAS_RESERVADAS.has('kyrios-studio')).toBe(false);
      expect(RUTAS_RESERVADAS.has('barberia-centro')).toBe(false);
      expect(RUTAS_RESERVADAS.has('don-juan-vip')).toBe(false);
    });
  });

  describe('obtenerNegocioSlugActivo', () => {
    it('debe extraer el slug del primer segmento de la URL si no es ruta reservada', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/barberia-elite/servicios' },
        writable: true,
      });

      const slug = obtenerNegocioSlugActivo();
      expect(slug).toBe('barberia-elite');
      expect(sessionStorage.getItem('tab_negocio_slug')).toBe('barberia-elite');
    });

    it('no debe considerar rutas reservadas como slug y consultar sessionStorage', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/login' },
        writable: true,
      });

      sessionStorage.setItem('tab_negocio_slug', 'barberia-persisted');
      const slug = obtenerNegocioSlugActivo();
      expect(slug).toBe('barberia-persisted');
    });

    it('debe consultar localStorage como último fallback si no hay ruta ni tabSlug', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard' },
        writable: true,
      });

      localStorage.setItem('negocio_sesion_slug', 'barberia-fallback');
      const slug = obtenerNegocioSlugActivo();
      expect(slug).toBe('barberia-fallback');
    });

    it('debe retornar null si ninguna fuente proporciona un slug válido', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/login' },
        writable: true,
      });

      expect(obtenerNegocioSlugActivo()).toBeNull();
    });
  });

  describe('interceptores de apiClient', () => {
    it('request interceptor inyecta token de sede y header X-Negocio-Slug', () => {
      const requestInterceptor = (apiClient.interceptors.request as any).handlers[0]?.fulfilled;
      if (!requestInterceptor) return;

      localStorage.setItem('token_barberia_barberia-elite', 'token-elite-123');
      Object.defineProperty(window, 'location', {
        value: { pathname: '/barberia-elite' },
        writable: true,
      });

      const config = { headers: {} as Record<string, string> };
      const modified = requestInterceptor(config);
      expect(modified.headers.Authorization).toBe('Bearer token-elite-123');
      expect(modified.headers['X-Negocio-Slug']).toBe('barberia-elite');
    });

    it('request interceptor usa token global si no hay sede en la ruta', () => {
      const requestInterceptor = (apiClient.interceptors.request as any).handlers[0]?.fulfilled;
      if (!requestInterceptor) return;

      localStorage.setItem('token_barberia', 'token-global');
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard' },
        writable: true,
      });

      const config = { headers: {} as Record<string, string> };
      const modified = requestInterceptor(config);
      expect(modified.headers.Authorization).toBe('Bearer token-global');
    });

    it('response interceptor normaliza errores en userMessage y limpia sesión en 401', async () => {
      const responseErrorInterceptor = (apiClient.interceptors.response as any).handlers[0]?.rejected;
      if (!responseErrorInterceptor) return;

      const errorValidation = {
        response: {
          status: 400,
          data: { message: ['Nombre requerido', 'Email inválido'] },
        },
      };

      await expect(responseErrorInterceptor(errorValidation)).rejects.toMatchObject({
        userMessage: 'Nombre requerido Email inválido',
      });

      // Error con objeto y propiedad message string o array
      const errorObjMsgString = {
        response: {
          status: 400,
          data: { message: { message: 'Mensaje directo' } },
        },
      };
      await expect(responseErrorInterceptor(errorObjMsgString)).rejects.toMatchObject({
        userMessage: 'Mensaje directo',
      });

      const errorObjMsgArray = {
        response: {
          status: 400,
          data: { message: { message: ['Fallo 1', 'Fallo 2'] } },
        },
      };
      await expect(responseErrorInterceptor(errorObjMsgArray)).rejects.toMatchObject({
        userMessage: 'Fallo 1 Fallo 2',
      });

      // Error con objeto
      const errorObj = {
        response: {
          status: 400,
          data: { message: { error: 'Mensaje anidado' } },
        },
      };
      await expect(responseErrorInterceptor(errorObj)).rejects.toMatchObject({
        userMessage: 'Mensaje anidado',
      });

      // 401 error
      Object.defineProperty(window, 'location', {
        value: { pathname: '/barberia-elite' },
        writable: true,
      });
      localStorage.setItem('token_barberia_barberia-elite', 'expired');
      const error401 = {
        response: {
          status: 401,
          data: { mensaje: 'Sesión expirada' },
        },
      };

      await expect(responseErrorInterceptor(error401)).rejects.toMatchObject({
        userMessage: 'Sesión expirada',
      });
      expect(localStorage.getItem('token_barberia_barberia-elite')).toBeNull();
    });

    it('request error interceptor rechaza el error', async () => {
      const requestErrorInterceptor = (apiClient.interceptors.request as any).handlers[0]?.rejected;
      if (requestErrorInterceptor) {
        await expect(requestErrorInterceptor(new Error('Req error'))).rejects.toThrow('Req error');
      }
    });
  });
});
