import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import keycloak, { cerrarSesion } from './keycloak';
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
    keycloak: typeof keycloak; // La instancia original de Keycloak por si necesitamos cerrar sesión o hacer cosas avanzadas.
    cerrarSesion: () => void; // Función centralizada para cerrar sesión sincronizando todas las pestañas abiertas
    isAuthenticated: boolean; // ¿Está logueado el usuario?
    isInitializing: boolean; // ¿Pendiente hasta que init() termine?
    nombre?: string; // Extraído del token
    apellido?: string; // Extraído del token
    email?: string; // Extraído del token
    roles: string[]; // Qué poderes tiene este usuario (SUPERADMIN, BARBERO, etc.)
    usuarioDb: Usuario | null; // El registro completo de este usuario que vive en nuestra Base de Datos (MySQL)
    refrescarPerfil: () => Promise<void>; // Recarga los datos del perfil desde la BD
}

const AuthContext = createContext<AuthContextType | undefined>(
    undefined,
);

export function AuthContextProvider({
    children,
    isInitializing,
}: {
    children: React.ReactNode;
    isInitializing: boolean;
}) {
    // tokenParsed es un objeto de Javascript que contiene toda la información 
    // decodificada que Keycloak metió dentro del JWT.
    const tokenParsed = keycloak.tokenParsed;

    // Extraemos los roles y datos personales directamente de tokenParsed.
    // Al derivarlos en cada render, cuando isInitializing pasa de true a false,
    // se reflejan inmediatamente sin desfases de estado.
    const roles = tokenParsed?.realm_access?.roles ?? [];
    const nombre = tokenParsed?.given_name;
    const apellido = tokenParsed?.family_name;
    const email = tokenParsed?.email;
    
    // Aquí guardaremos la información de este usuario sacada de nuestra propia base de datos (Ej: su estado de comisión)
    const [usuarioDb, setUsuarioDb] = useState<Usuario | null>(null);

    // Función para recargar el perfil desde la BD. Se puede llamar desde cualquier página.
    const refrescarPerfil = useCallback(async () => {
        if (!keycloak.authenticated) return;
        try {
            const perfilDTO = await usuariosService.obtenerMiPerfil();
            setUsuarioDb(usuariosMapper.toDomain(perfilDTO));
        } catch (error) {
            console.error('Error obteniendo perfil de BD:', error);
        }
    }, []);

    // Proteger refetch de perfil contra no autenticado o inicialización pendiente
    useEffect(() => {
        if (isInitializing) return;
        if (keycloak.authenticated) {
            refrescarPerfil();
        }
    }, [isInitializing, refrescarPerfil]);

    return (
        <AuthContext.Provider
            value={{
                keycloak,
                cerrarSesion,
                isAuthenticated: !!keycloak.authenticated,
                isInitializing,
                nombre,
                apellido,
                email,
                roles,
                usuarioDb,
                refrescarPerfil,
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