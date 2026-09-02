import { createContext, useContext, useState } from 'react';
import keycloak from './keycloak';

interface AuthContextType {
    keycloak: typeof keycloak;
    isAuthenticated: boolean;
    nombre?: string;
    apellido?: string;
    email?: string;
    roles: string[];
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

    return (
        <AuthContext.Provider
            value={{
                keycloak,
                isAuthenticated: !!keycloak.authenticated,
                nombre,
                apellido,
                email,
                roles,
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