import { useEffect, useState } from 'react';
import { AuthContextProvider } from './AuthContext';
import { obtenerNegocioSlugActivo } from '../shared/lib/http/axios';

/**
 * Propiedades del proveedor `AuthProvider`.
 */
export interface AuthProviderProps {
  /** Componentes secundarios o árbol de la aplicación envuelto en el contexto. */
  children: React.ReactNode;
}

/**
 * Proveedor de nivel superior para la sincronización del ciclo de vida de la sesión.
 *
 * @remarks
 * **Sincronización Inter-Pestaña Aislada:**
 * Monitorea eventos `StorageEvent` en el canal `'barberia_logout_event'`. Cuando un usuario
 * cierra sesión en una pestaña específica, notifica únicamente a las pestañas abiertas
 * que correspondan al mismo slug de la barbería (`data.slug === currentSlug`), recargando
 * su estado de forma limpia sin perturbar pestañas que tengan abierta otra sede o la plataforma global.
 *
 * @param props - Propiedades conteniendo los elementos hijos.
 * @returns El árbol de componentes protegido con el `AuthContextProvider`.
 */
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
