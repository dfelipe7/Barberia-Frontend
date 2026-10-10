import { useEffect, useState, useRef } from 'react';

import keycloak from './keycloak';
import { AuthContextProvider } from './AuthContext';
import KyriosSpinner from '../shared/ui/KyriosSpinner';

interface AuthProviderProps {
    children: React.ReactNode;
}

export default function AuthProvider({
    children,
}: AuthProviderProps) {
    const [loading, setLoading] = useState(true);
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
            const iniciarKeycloak = async () => {
                try {
                    // INICIALIZACIÓN DE KEYCLOAK
                    // 'check-sso' revisa si el usuario ya tiene sesión en el navegador.
                    await keycloak.init({
                        onLoad: 'check-sso',
                        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
                        pkceMethod: 'S256', // Medida de seguridad recomendada para Single Page Apps (React)
                        checkLoginIframe: false, // Desactivado para evitar bucles infinitos por bloqueo de cookies de 3ros
                    });
                } catch (error) {
                    console.error('Error iniciando Keycloak:', error);
                } finally {
                    setLoading(false);
                }
            };

            iniciarKeycloak();
        }

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-surface-app">
                <KyriosSpinner size="lg" mensaje="Iniciando sesión..." variant="block" />
            </div>
        );
    }

    return (
        <AuthContextProvider>
            {children}
        </AuthContextProvider>
    );
}