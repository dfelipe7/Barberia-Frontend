import axios from 'axios';
import keycloak from '../auth/keycloak';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
  async (config) => {
    if (keycloak.authenticated) {
      try {
        await keycloak.updateToken(30);

        config.headers.Authorization = `Bearer ${keycloak.token}`;
      } catch (error) {
        console.error(
          'No se pudo actualizar el token de Keycloak:',
          error,
        );
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;