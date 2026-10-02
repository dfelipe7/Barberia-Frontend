import { useTheme } from '../context/ThemeContext';

export type SystemTheme = 'light' | 'dark';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Hook que detecta el tema activo (claro u oscuro).
 * Lee del ThemeContext si está disponible, o del sistema operativo como fallback.
 *
 * @returns 'light' | 'dark'
 */
export function useSystemTheme(): SystemTheme {
  try {
    const { resolvedTheme } = useTheme();
    return resolvedTheme;
  } catch {
    if (typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches) {
      return 'dark';
    }
    return 'light';
  }
}

