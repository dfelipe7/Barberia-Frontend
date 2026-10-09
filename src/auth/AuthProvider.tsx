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
                keycloak.token = undefined;
                keycloak.refreshToken = undefined;
                keycloak.idToken = undefined;
                keycloak.tokenParsed = undefined;
                keycloak.authenticated = false;
            } catch {
                // Ignore
            }
            sessionStorage.clear();
            localStorage.clear();
            localStorage.setItem('barberia_logged_out', 'true');

            // Limpieza de cookies locales
            try {
                document.cookie.split(';').forEach((c) => {
                    document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
                });
            } catch {
                // Ignore
            }

            window.location.href = window.location.origin;
        };

        // 1. Canal BroadcastChannel para navegadores modernos (Brave, Chrome, Edge, Firefox)
        const authChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('barberia_auth_channel') : null;

        if (authChannel) {
            authChannel.onmessage = (event) => {
                if (event.data === 'LOGOUT') {
                    procesarLogoutMultiPestana();
                }
            };
        }

        // 2. Listener de Storage Events (respaldo universal para sincronización entre pestañas)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'barberia_logout_timestamp' || e.key === 'barberia_logged_out') {
                procesarLogoutMultiPestana();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        if (isRun.current) return;
        isRun.current = true;

        const iniciarKeycloak = async () => {
            try {
                // Si la sesión fue cerrada desde otra pestaña, forzamos el estado desautenticado de inmediato
                if (localStorage.getItem('barberia_logged_out') === 'true') {
                    localStorage.removeItem('barberia_logged_out');
                    try {
                        keycloak.clearToken();
                    } catch {
                        // Ignore
                    }
                    keycloak.token = undefined;
                    keycloak.refreshToken = undefined;
                    keycloak.idToken = undefined;
                    keycloak.tokenParsed = undefined;
                    keycloak.authenticated = false;
                    setLoading(false);
                    return;
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