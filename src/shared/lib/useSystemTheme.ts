import { useState, useEffect } from 'react';

export type SystemTheme = 'light' | 'dark';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Hook que detecta el tema preferido del sistema operativo/navegador.
 * Reacciona automáticamente si el usuario cambia el tema mientras la
 * pestaña está abierta.
 *
 * @returns 'light' | 'dark'
 *
 * @example
 * const theme = useSystemTheme();
 * // theme === 'dark'  → fondo oscuro → usar logo-white
 * // theme === 'light' → fondo claro  → usar logo-black
 */
export function useSystemTheme(): SystemTheme {
  const [theme, setTheme] = useState<SystemTheme>(() =>
    window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
  );

  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY);

    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    // Uso addEventListener con { passive: true } para mayor compatibilidad
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  return theme;
}
