/**
 * Convierte una ruta relativa de foto (la que devuelve el backend) en una URL absoluta.
 * Si la ruta ya es absoluta (empieza con http), la devuelve tal cual.
 */
export const obtenerUrlFoto = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}${url}`;
};
