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
        // Canal de comunicación entre pestañas para sincronizar el Cierre de Sesión (compatible con Brave/Safari)
        const authChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('barberia_auth_channel') : null;

        if (authChannel) {
            authChannel.onmessage = (event) => {
                if (event.data === 'LOGOUT') {
                    window.location.reload();
                }
            };
        }

        if (isRun.current) return;
        isRun.current = true;

        const iniciarKeycloak = async () => {
            try {
                // INICIALIZACIÓN DE KEYCLOAK
                // 'check-sso' le dice a Keycloak que verifique sesión existente sin pedir contraseña.
                // 'checkLoginIframe: false' evita el bucle de recargas infinitas en Brave y Safari (causado por bloqueo de cookies de 3ros).
                await keycloak.init({
                    onLoad: 'check-sso',
                    pkceMethod: 'S256', // Medida de seguridad recomendada para Single Page Apps (React)
                    checkLoginIframe: false,
                });

                // Notifica a las demás pestañas para que también cierren sesión al instante
                keycloak.onAuthLogout = () => {
                    authChannel?.postMessage('LOGOUT');
                    window.location.reload();
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