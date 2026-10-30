import axios from 'axios';

/**
 * Instancia global de Axios configurada para comunicarse con el Backend.
 * Se alimenta de la URL base definida en el archivo .env (VITE_API_URL).
 *
 * PATRÓN PROXY (Interceptor de Peticiones):
 * Intercepta de forma transparente cada request saliente para inyectar
 * el Bearer token JWT de la sesión y el tenant activo (X-Negocio-Slug).
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

/**
 * Rutas internas y palabras reservadas del sistema que NUNCA deben
 * ser interpretadas como slug de negocio.
 */
const RUTAS_RESERVADAS = new Set([
  'login',
  'sin-acceso',
  'dashboard',
  'mi-perfil',
  'horarios',
  'reservas',
  'usuarios',
  'barberos',
  'servicios',
  'whatsapp',
  'administradores',
  'configuracion',
  'cliente',
  'catalogo',
  'reservar',
]);

/**
 * Resuelve dinámicamente el slug de la barbería activa:
 * 1. Del primer segmento del pathname de la URL (ej: /barberia-demo-2/login -> 'barberia-demo-2').
 * 2. O del valor guardado en localStorage ('negocio_slug').
 */
export function obtenerNegocioSlugActivo(): string | null {
  try {
    const primerSegmento = window.location.pathname.replace(/^\/+/, '').split('/')[0]?.toLowerCase().trim();
    if (primerSegmento && !RUTAS_RESERVADAS.has(primerSegmento)) {
      localStorage.setItem('negocio_slug', primerSegmento);
      return primerSegmento;
    }
    return localStorage.getItem('negocio_slug') || null;
  } catch {
    return null;
  }
}

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token_barberia');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Inyecta dinámicamente la barbería activa para la arquitectura multitenant
    const slug = obtenerNegocioSlugActivo();
    if (slug) {
      config.headers['X-Negocio-Slug'] = slug;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normaliza el campo de mensaje del backend (NestJS ValidationPipe devuelve
    // message como array; otras rutas lo devuelven como string en message o mensaje).
    const rawMensaje =
      error?.response?.data?.message ?? error?.response?.data?.mensaje;
    if (Array.isArray(rawMensaje)) {
      error.userMessage = rawMensaje.join(' ');
    } else if (typeof rawMensaje === 'string') {
      error.userMessage = rawMensaje;
    } else if (typeof rawMensaje === 'object' && rawMensaje !== null) {
      if (typeof rawMensaje.message === 'string') {
        error.userMessage = rawMensaje.message;
      } else if (Array.isArray(rawMensaje.message)) {
        error.userMessage = rawMensaje.message.join(' ');
      } else if (typeof rawMensaje.error === 'string') {
        error.userMessage = rawMensaje.error;
      }
    }

    if (error.response && error.response.status === 401) {
      console.warn('Sesión no autorizada o expirada (401).');
      const slug = obtenerNegocioSlugActivo();
      localStorage.removeItem('token_barberia');
      localStorage.removeItem('usuario_barberia');
      const loginUrl = slug ? `/${slug}/login` : '/login';
      if (
        window.location.pathname !== loginUrl &&
        window.location.pathname !== '/' &&
        window.location.pathname !== '/sin-acceso'
      ) {
        window.location.href = loginUrl;
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
