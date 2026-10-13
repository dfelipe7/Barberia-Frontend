import { useEffect, useState } from 'react';
import { AuthContextProvider } from './AuthContext';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Escucha eventos de logout entre pestañas
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'barberia_logout_event') {
        window.location.reload();
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