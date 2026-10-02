import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type Theme = 'light' | 'dark';

interface ThemeContextType {
  /** Preferencia del usuario: 'light', 'dark', o 'system' (seguir SO) */
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  /** Tema resuelto (nunca 'system'): útil para condicionales */
  resolvedTheme: Theme;
  isDark: boolean;
}

const DARK_QUERY = '(prefers-color-scheme: dark)';
const STORAGE_KEY = 'app-theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function resolvePreference(preference: ThemePreference): Theme {
  return preference === 'system' ? getSystemTheme() : preference;
}

function getSavedPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
  return (saved === 'light' || saved === 'dark' || saved === 'system') ? saved : 'system';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemePreference>(getSavedPreference);
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() => resolvePreference(getSavedPreference()));

  const applyResolved = useCallback((resolved: Theme) => {
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-bs-theme', resolved);
    setResolvedTheme(resolved);
  }, []);

  useEffect(() => {
    applyResolved(resolvePreference(theme));
  }, [theme, applyResolved]);

  // Escuchar cambios del sistema cuando el usuario eligió 'system'
  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY);
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        applyResolved(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [theme, applyResolved]);

  const setTheme = useCallback((newTheme: ThemePreference) => {
    try {
      if (newTheme === 'system') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, newTheme);
      }
    } catch {
      // ignore localstorage errors
    }
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, resolvedTheme, isDark: resolvedTheme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
}
