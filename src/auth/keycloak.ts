import Keycloak from 'keycloak-js';

/**
 * CONEXIÓN CRUDA CON KEYCLOAK
 * 
 * Este pequeño archivo es simplemente el puente entre nuestra app de React y el servidor de Keycloak.
 * Toma las credenciales secretas que guardamos en el archivo .env (URL, Realm y Client ID)
 * y crea una instancia lista para ser usada por toda la aplicación.
 */
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

export default keycloak;