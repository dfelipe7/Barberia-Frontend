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

/**
 * CIERRE DE SESIÓN GLOBAL Y MULTI-PESTAÑA
 * Notifica de inmediato a todas las demás pestañas abiertas para que cierren sesión sincrónicamente (en 0s)
 * evitando depender de los iframes de terceros que bloquea el escudo de privacidad de Brave / Safari.
 */
export const cerrarSesionGlobal = (redirectUri?: string) => {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('barberia_auth_channel');
      channel.postMessage('LOGOUT');
      channel.close();
    }
    localStorage.setItem('barberia_logout_timestamp', Date.now().toString());
  } catch (err) {
    console.error('Error notificando cierre de sesión multi-pestaña:', err);
  }

  keycloak.logout({
    redirectUri: redirectUri || window.location.origin,
  });
};

export default keycloak;