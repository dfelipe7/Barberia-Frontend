import { createContext, useContext, useState, useEffect } from 'react';
import keycloak from './keycloak';
import { usuariosService, type Usuario } from '../modules/usuarios/services/usuarios.service';

interface AuthContextType {
    keycloak: typeof keycloak;
    isAuthenticated: boolean;
    nombre?: string;
    apellido?: string;
    email?: string;
    roles: string[];
    usuarioDb: Usuario | null;
}

const AuthContext = createContext<AuthContextType | undefined>(
    undefined,
);

export function AuthContextProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const tokenParsed = keycloak.tokenParsed;

    const [roles] = useState<string[]>(
        tokenParsed?.realm_access?.roles ?? [],
    );
    const [nombre] = useState<string | undefined>(tokenParsed?.given_name);
    const [apellido] = useState<string | undefined>(tokenParsed?.family_name);
    const [email] = useState<string | undefined>(tokenParsed?.email);
    const [usuarioDb, setUsuarioDb] = useState<Usuario | null>(null);

    useEffect(() => {
        if (keycloak.authenticated) {
            usuariosService.obtenerMiPerfil()
                .then(perfil => setUsuarioDb(perfil))
                .catch(error => console.error("Error obteniendo perfil de BD:", error));
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                keycloak,
                isAuthenticated: !!keycloak.authenticated,
                nombre,
                apellido,
                email,
                roles,
                usuarioDb,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth debe utilizarse dentro de AuthContextProvider',
        );
    }

    return context;
}