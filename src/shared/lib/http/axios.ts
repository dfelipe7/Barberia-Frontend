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
export const RUTAS_RESERVADAS = new Set([
  '',
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
  'reserva',
  'plataforma',
  'explorar',
  'c',
  'api',
]);

/**
 * Resuelve dinámicamente el slug de la barbería activa:
 * 1. Del primer segmento del pathname de la URL (ej: /barberia-demo-2/login -> 'barberia-demo-2').
 * 2. O del valor guardado en localStorage ('negocio_slug').
 * 3. Si el valor almacenado coincide con una ruta reservada (ej: 'plataforma'), se purga automáticamente.
 */
export function obtenerNegocioSlugActivo(): string | null {
  try {
    // 1. Cada pestaña lee EXCLUSIVAMENTE su propia URL (pathname local e independiente)
    const primerSegmento = window.location.pathname.replace(/^\/+/, '').split('/')[0]?.toLowerCase().trim();
    if (primerSegmento && !RUTAS_RESERVADAS.has(primerSegmento)) {
      try {
        sessionStorage.setItem('tab_negocio_slug', primerSegmento);
      } catch {}
      return primerSegmento;
    }

    // 2. Si es una ruta interna sin slug, consultar la memoria aislada de ESTA pestaña (sessionStorage)
    try {
      const tabSlug = sessionStorage.getItem('tab_negocio_slug')?.toLowerCase().trim();
      if (tabSlug && !RUTAS_RESERVADAS.has(tabSlug)) {
        return tabSlug;
      }
    } catch {}

    // 3. Fallback de respaldo solo si la pestaña nunca ha visitado una sede con prefijo
    const sesionSlug = localStorage.getItem('negocio_sesion_slug')?.toLowerCase().trim();
    if (sesionSlug && !RUTAS_RESERVADAS.has(sesionSlug)) {
      return sesionSlug;
    }

    return null;
  } catch {
    return null;
  }
}

apiClient.interceptors.request.use(
  (config) => {
    const slugRuta = obtenerNegocioSlugActivo();
    const sesionSlug = localStorage.getItem('negocio_sesion_slug');

    // Multi-Tenant Isolation Estricto: Si la ruta tiene sede, SOLO usar el token de esa sede
    let token: string | null = null;
    if (slugRuta) {
      token = localStorage.getItem(`token_barberia_${slugRuta}`);
    } else {
      token = localStorage.getItem('token_barberia');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    const slugParaHeader = slugRuta || sesionSlug;
    if (slugParaHeader) {
      config.headers['X-Negocio-Slug'] = slugParaHeader;
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
      if (slug) {
        localStorage.removeItem(`token_barberia_${slug}`);
        localStorage.removeItem(`usuario_barberia_${slug}`);
      }
      localStorage.removeItem('token_barberia');
      localStorage.removeItem('usuario_barberia');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
