import axios from 'axios';
import keycloak from '../../../auth/keycloak';

/**
 * Instancia global de Axios configurada para comunicarse con el Backend.
 * Se alimenta de la URL base definida en el archivo .env (VITE_API_URL).
 *
 * PATRÓN PROXY (Interceptor de Peticiones):
 * Intercepta de forma transparente cada request saliente para verificar
 * la expiración del token JWT de Keycloak, refrescarlo si restan menos de 30s,
 * e inyectar el Bearer token en los headers sin acoplar a los consumidores.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use(
  async (config) => {
    if (keycloak.authenticated) {
      try {
        await keycloak.updateToken(30);
        config.headers.Authorization = `Bearer ${keycloak.token}`;
      } catch (error) {
        console.error(
          'No se pudo actualizar el token de Keycloak (la sesión probablemente expiró):',
          error,
        );
        keycloak.clearToken();
        keycloak.login();
      }
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
    }

    if (error.response && error.response.status === 401) {
      console.warn('Sesión expirada detectada (401). Redirigiendo a login...');
      keycloak.clearToken();
      keycloak.login();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
