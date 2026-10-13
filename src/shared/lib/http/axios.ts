import axios from 'axios';

/**
 * Instancia global de Axios configurada para comunicarse con el Backend.
 * Se alimenta de la URL base definida en el archivo .env (VITE_API_URL).
 *
 * PATRÓN PROXY (Interceptor de Peticiones):
 * Intercepta de forma transparente cada request saliente para inyectar
 * el Bearer token JWT de la sesión en los headers sin acoplar a los consumidores.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token_barberia');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      localStorage.removeItem('token_barberia');
      localStorage.removeItem('usuario_barberia');
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/' &&
        window.location.pathname !== '/sin-acceso'
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
