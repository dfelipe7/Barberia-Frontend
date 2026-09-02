import { useEffect, useState, useRef } from 'react';

import keycloak from './keycloak';
import { AuthContextProvider } from './AuthContext';

interface AuthProviderProps {
    children: React.ReactNode;
}

export default function AuthProvider({
    children,
}: AuthProviderProps) {
    const [loading, setLoading] = useState(true);
    const isRun = useRef(false);

    useEffect(() => {
        if (isRun.current) return;
        isRun.current = true;
        const iniciarKeycloak = async () => {
            try {
                await keycloak.init({
                    onLoad: 'check-sso',
                    pkceMethod: 'S256',
                    checkLoginIframe: false,
                });
            } catch (error) {
                console.error('Error iniciando Keycloak:', error);
            } finally {
                setLoading(false);
            }
        };

        iniciarKeycloak();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <AuthContextProvider>
            {children}
        </AuthContextProvider>
    );
}