import { useEffect, useState } from 'react';

import keycloak from './keycloak';
import { AuthContextProvider } from './AuthContext';

interface AuthProviderProps {
    children: React.ReactNode;
}

export default function AuthProvider({
    children,
}: AuthProviderProps) {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const iniciarKeycloak = async () => {
            try {
                const autenticado = await keycloak.init({
                    onLoad: 'login-required',
                    pkceMethod: 'S256',
                    checkLoginIframe: false,
                });

                setAuthenticated(autenticado);
            } catch (error) {
                console.error('Error iniciando Keycloak:', error);
            } finally {
                setLoading(false);
            }
        };

        iniciarKeycloak();
    }, []);

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (!authenticated) {
        return <div>No autenticado</div>;
    }

    return (
        <AuthContextProvider>
            {children}
        </AuthContextProvider>
    );
}