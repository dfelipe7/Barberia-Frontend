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
        const procesarLogoutMultiPestana = () => {
            try {
                keycloak.clearToken();
            } catch {
                // Ignore if token is already cleared
            }
            sessionStorage.clear();
            localStorage.setItem('barberia_logged_out', 'true');
            window.location.href = window.location.origin;
        };

        // 1. Canal BroadcastChannel para navegadores modernos
        const authChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('barberia_auth_channel') : null;

        if (authChannel) {
            authChannel.onmessage = (event) => {
                if (event.data === 'LOGOUT') {
                    procesarLogoutMultiPestana();
                }
            };
        }

        // 2. Listener de Storage Events (respaldo universal para todas las pestañas)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'barberia_logout_timestamp') {
                procesarLogoutMultiPestana();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        if (isRun.current) return;
        isRun.current = true;

        const iniciarKeycloak = async () => {
            try {
                // Si venimos de un evento de logout de otra pestaña, asegurarnos de que la sesión no reaparezca
                if (localStorage.getItem('barberia_logged_out') === 'true') {
                    localStorage.removeItem('barberia_logged_out');
                    try {
                        keycloak.clearToken();
                    } catch {
                        // Ignore
                    }
                    sessionStorage.clear();
                }

                // INICIALIZACIÓN DE KEYCLOAK
                await keycloak.init({
                    onLoad: 'check-sso',
                    pkceMethod: 'S256',
                    checkLoginIframe: false, // Desactivado para compatibilidad total con Brave y Safari (evita bucles de recargas)
                });

                keycloak.onAuthLogout = () => {
                    procesarLogoutMultiPestana();
                };
            } catch (error) {
                console.error('Error iniciando Keycloak:', error);
            } finally {
                setLoading(false);
            }
        };

        iniciarKeycloak();

        return () => {
            authChannel?.close();
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