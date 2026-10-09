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
 * limpiando el estado local para ser 100% compatible con Brave, Safari, Firefox y Chrome.
 */
export const cerrarSesionGlobal = (redirectUri?: string) => {
  try {
    localStorage.setItem('barberia_logout_timestamp', Date.now().toString());
    localStorage.setItem('barberia_logged_out', 'true');

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('barberia_auth_channel');
      channel.postMessage('LOGOUT');
      channel.close();
    }
  } catch (err) {
    console.error('Error notificando cierre de sesión multi-pestaña:', err);
  }

  keycloak.logout({
    redirectUri: redirectUri || window.location.origin,
  });
};

export default keycloak;