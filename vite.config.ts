import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode !== 'production'

  // ─── Orígenes de desarrollo (SIEMPRE presentes en dev, ignoran .env) ───
  const DEV_API = 'http://localhost:3000'
  const DEV_KEYCLOAK = 'http://localhost:8080'

  // ─── Orígenes de producción ───
  const PROD_API = 'https://barberia-backend-production.up.railway.app'
  const PROD_KEYCLOAK = 'https://keycloak-production-4cdb.up.railway.app'

  // En dev: localhost + prod (para poder probar contra prod si hace falta)
  // En prod: solo producción
  const apiOrigins = isDev ? `${DEV_API} ${PROD_API}` : PROD_API
  const keycloakOrigins = isDev ? `${DEV_KEYCLOAK} ${PROD_KEYCLOAK}` : PROD_KEYCLOAK

  const cspDirectives = [
    `default-src 'self'`,
    `script-src 'self'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https:${isDev ? ` ${DEV_API}` : ''}`,
    `connect-src 'self' ${apiOrigins} ${keycloakOrigins}`,
    `frame-src 'self' https://www.google.com ${keycloakOrigins}`,
    `form-action 'self' ${keycloakOrigins}`,
    `frame-ancestors 'self'`,
  ]

  const csp = cspDirectives.join('; ')

  return {
    plugins: [react()],
    server: isDev
      ? {
          headers: {
            'Content-Security-Policy': csp,
          },
        }
      : undefined,
  }
})