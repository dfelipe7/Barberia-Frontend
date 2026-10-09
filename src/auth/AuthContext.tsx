import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import keycloak, { cerrarSesionGlobal } from './keycloak';
import { usuariosService } from '../features/usuarios/api/usuarios.service';
import { usuariosMapper } from '../features/usuarios/api/usuarios.mapper';
import type { Usuario } from '../features/usuarios/types/usuarios.types';

/**
 * AUTH CONTEXT (El Estado Global de Autenticación)
 * 
 * Este archivo actúa como la memoria central de la aplicación.
 * Toma los datos crudos que nos entregó Keycloak (el token JWT) y los 
 * transforma en variables fáciles de usar (como 'nombre', 'roles', 'email').
 * Además, cruza esa información con nuestra Base de Datos para tener el perfil completo.
 */
interface AuthContextType {
    keycloak: typeof keycloak; // La instancia original de Keycloak por si necesitamos realizar operaciones avanzadas.
    isAuthenticated: boolean; // ¿Está logueado el usuario?
    nombre?: string; // Extraído del token
    apellido?: string; // Extraído del token
    email?: string; // Extraído del token
    roles: string[]; // Qué poderes tiene este usuario (SUPERADMIN, BARBERO, etc.)
    usuarioDb: Usuario | null; // El registro completo de este usuario que vive en nuestra Base de Datos (MySQL)
    refrescarPerfil: () => Promise<void>; // Recarga los datos del perfil desde la BD
    cerrarSesion: (redirectUri?: string) => void; // Cierra sesión de forma sincronizada en todas las pestañas al instante (0s)
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

    // Función para recargar el perfil desde la BD. Se puede llamar desde cualquier página.
    const refrescarPerfil = useCallback(async () => {
        if (keycloak.authenticated) {
            try {
                const perfilDTO = await usuariosService.obtenerMiPerfil();
                setUsuarioDb(usuariosMapper.toDomain(perfilDTO));
            } catch (error) {
                console.error('Error obteniendo perfil de BD:', error);
            }
        }
    }, []);

    // Cuando este contexto carga por primera vez...
    useEffect(() => {
        // Si el usuario ya está autenticado en Keycloak...
        if (keycloak.authenticated) {
            // Hacemos una petición silenciosa a nuestro backend (NestJS) para decirle:
            // "Oye, soy este usuario, dame mi información guardada en MySQL"
            refrescarPerfil();
        }
    }, [refrescarPerfil]);

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
                refrescarPerfil,
                cerrarSesion: cerrarSesionGlobal,
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