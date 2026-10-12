import { useEffect, useState, useRef } from 'react';

import keycloak from './keycloak';
import { AuthContextProvider } from './AuthContext';

interface AuthProviderProps {
    children: React.ReactNode;
}

export default function AuthProvider({
    children,
}: AuthProviderProps) {
    const [initialized, setInitialized] = useState(false);
    const isRun = useRef(false);

    useEffect(() => {
        // Escucha eventos de localStorage enviados desde otras pestañas (soporte multi-pestaña para Brave, Safari, etc.)
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'barberia_logout_event') {
                window.location.reload();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        if (!isRun.current) {
            isRun.current = true;
            // INICIALIZACIÓN DE KEYCLOAK
            // 'check-sso' revisa si el usuario ya tiene sesión en el navegador en background.
            keycloak
                .init({
                    onLoad: 'check-sso',
                    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
                    pkceMethod: 'S256', // Medida de seguridad recomendada para Single Page Apps (React)
                    checkLoginIframe: false, // Desactivado para evitar bucles infinitos por bloqueo de cookies de 3ros
                })
                .catch((error) => console.error('Error iniciando Keycloak:', error))
                .finally(() => setInitialized(true));
        }

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // SIEMPRE renderiza los children sin bloquear el render de la app.
    // El estado 'initialized' se pasa como isInitializing al contexto.
    return (
        <AuthContextProvider isInitializing={!initialized}>
            {children}
        </AuthContextProvider>
    );
}