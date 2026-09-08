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
                // INICIALIZACIÓN DE KEYCLOAK
                // 'check-sso' es una opción mágica que le dice a Keycloak:
                // "Por favor, mira silenciosamente si el usuario ya tiene sesión en el navegador. 
                // Si la tiene, inícialo sin pedir contraseña. Si no, déjalo como invitado".
                // Esto evita que la página de login brinque de la nada.
                await keycloak.init({
                    onLoad: 'check-sso',
                    pkceMethod: 'S256', // Medida de seguridad recomendada para Single Page Apps (React)
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