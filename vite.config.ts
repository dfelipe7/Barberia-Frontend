import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode !== 'production'

  const keycloakUrl = (env.VITE_KEYCLOAK_URL || 'http://localhost:8080').trim()
  const apiUrl = (env.VITE_API_URL || 'http://localhost:3000').trim()

  const csp = [
    `default-src 'self'`,
    `script-src 'self'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https: ${apiUrl}`,
    [
      `connect-src 'self'`,
      apiUrl,
      keycloakUrl,
      `https://barberia-backend-production.up.railway.app`,
      `https://keycloak-production-4cdb.up.railway.app`,
    ].join(' '),
    [
      `frame-src 'self'`,
      `https://www.google.com`,
      keycloakUrl,
      `https://keycloak-production-4cdb.up.railway.app`,
    ].join(' '),
    [
      `form-action 'self'`,
      keycloakUrl,
      `https://keycloak-production-4cdb.up.railway.app`,
    ].join(' '),
  ].join('; ')

  return {
    plugins: [react()],
    server: isDev
      ? { headers: { 'Content-Security-Policy': csp } }
      : undefined,
  }
})
