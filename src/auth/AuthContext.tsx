import { createContext, useContext, useState, useEffect } from 'react';
import keycloak from './keycloak';
import { usuariosService, type Usuario } from '../modules/usuarios/services/usuarios.service';

/**
 * AUTH CONTEXT (El Estado Global de Autenticación)
 * 
 * Este archivo actúa como la memoria central de la aplicación.
 * Toma los datos crudos que nos entregó Keycloak (el token JWT) y los 
 * transforma en variables fáciles de usar (como 'nombre', 'roles', 'email').
 * Además, cruza esa información con nuestra Base de Datos para tener el perfil completo.
 */
interface AuthContextType {
    keycloak: typeof keycloak; // La instancia original de Keycloak por si necesitamos cerrar sesión o hacer cosas avanzadas.
    isAuthenticated: boolean; // ¿Está logueado el usuario?
    nombre?: string; // Extraído del token
    apellido?: string; // Extraído del token
    email?: string; // Extraído del token
    roles: string[]; // Qué poderes tiene este usuario (SUPERADMIN, BARBERO, etc.)
    usuarioDb: Usuario | null; // El registro completo de este usuario que vive en nuestra Base de Datos (MySQL)
}

const AuthContext = createContext<AuthContextType | undefined>(
    undefined,
);

export function AuthContextProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    // tokenParsed es un objeto de Javascript que contiene toda la información 
    // decodificada que Keycloak metió dentro del JWT.
    const tokenParsed = keycloak.tokenParsed;

    // Extraemos los roles del usuario. Si no tiene roles, dejamos un arreglo vacío [].
    const [roles] = useState<string[]>(
        tokenParsed?.realm_access?.roles ?? [],
    );
    // Extraemos los datos personales básicos que Google/Keycloak nos pasaron.
    const [nombre] = useState<string | undefined>(tokenParsed?.given_name);
    const [apellido] = useState<string | undefined>(tokenParsed?.family_name);
    const [email] = useState<string | undefined>(tokenParsed?.email);
    
    // Aquí guardaremos la información de este usuario sacada de nuestra propia base de datos (Ej: su estado de comisión)
    const [usuarioDb, setUsuarioDb] = useState<Usuario | null>(null);

    // Cuando este contexto carga por primera vez...
    useEffect(() => {
        // Si el usuario ya está autenticado en Keycloak...
        if (keycloak.authenticated) {
            // Hacemos una petición silenciosa a nuestro backend (NestJS) para decirle:
            // "Oye, soy este usuario, dame mi información guardada en MySQL"
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