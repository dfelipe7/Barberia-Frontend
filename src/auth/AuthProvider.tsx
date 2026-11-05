import { useEffect, useState } from 'react';
import { AuthContextProvider } from './AuthContext';
import { obtenerNegocioSlugActivo } from '../shared/lib/http/axios';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Escucha eventos de logout entre pestañas únicamente para la misma sede
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'barberia_logout_event' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          const currentSlug = obtenerNegocioSlugActivo();
          // Solo recargar si esta pestaña pertenece a la misma barbería donde se cerró sesión
          if (data?.slug && currentSlug && data.slug.toLowerCase().trim() === currentSlug.toLowerCase().trim()) {
            window.location.reload();
          }
        } catch {
          // Si no es un JSON estructurado por sede, no recargar pestañas ajenas
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    setInitialized(true);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <AuthContextProvider isInitializing={!initialized}>
      {children}
    </AuthContextProvider>
  );
}
