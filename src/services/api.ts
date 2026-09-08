import axios from 'axios';
import keycloak from '../auth/keycloak';

/**
 * Instancia global de Axios configurada para comunicarse con el Backend.
 * Se alimenta de la URL base definida en el archivo .env (VITE_API_URL).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

/**
 * INTERCEPTOR DE PETICIONES (El guardia de seguridad del Frontend)
 * 
 * ¿Qué hace esto?
 * Antes de que CUALQUIER petición salga del frontend hacia el backend,
 * Axios pausa la petición y la pasa por esta función.
 */
api.interceptors.request.use(
  async (config) => {
    // 1. Verificamos si el usuario ya inició sesión en Keycloak.
    if (keycloak.authenticated) {
      try {
        // 2. Comprobamos si el token está a punto de caducar (en los próximos 30 segundos).
        // Si es así, Keycloak automáticamente pide uno nuevo en segundo plano (Refresh Token) 
        // para que la sesión del usuario nunca se cierre abruptamente.
        await keycloak.updateToken(30);

        // 3. Inyectamos el token de seguridad en la cabecera 'Authorization' de la petición.
        // Gracias a esto, el Backend (NestJS) sabe quiénes somos y si tenemos permisos.
        config.headers.Authorization = `Bearer ${keycloak.token}`;
      } catch (error) {
        console.error(
          'No se pudo actualizar el token de Keycloak (la sesión probablemente expiró):',
          error,
        );
      }
    }

    // 4. Dejamos que la petición continúe su viaje hacia el backend.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;