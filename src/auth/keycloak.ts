import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'barberia',
  clientId: 'barberia-frontend',
});

export default keycloak;