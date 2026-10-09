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

export const cerrarSesion = () => {
    try {
        localStorage.setItem('barberia_logout_event', Date.now().toString());
    } catch (e) {
        console.error('Error al notificar cierre de sesión a otras pestañas:', e);
    }
    keycloak.logout({
        redirectUri: window.location.origin,
    });
};

export default keycloak;