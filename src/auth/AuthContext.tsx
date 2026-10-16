import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usuariosService } from '../features/usuarios/api/usuarios.service';
import { usuariosMapper } from '../features/usuarios/api/usuarios.mapper';
import type { Usuario } from '../features/usuarios/types/usuarios.types';
import apiClient from '../shared/lib/http/axios';

interface UsuarioSesion {
  id: number;
  email: string;
  nombre: string;
  apellido?: string;
  rol: string;
  roles?: string[];
  estado: string;
  fotoUrl?: string | null;
}

interface AuthContextType {
  cerrarSesion: () => void;
  isAuthenticated: boolean;
  isInitializing: boolean;
  token: string | null;
  nombre?: string;
  apellido?: string;
  email?: string;
  fotoUrl?: string | null;
  roles: string[];
  usuarioDb: Usuario | null;
  loginConGoogle: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  refrescarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthContextProvider({
  children,
  isInitializing,
}: {
  children: React.ReactNode;
  isInitializing: boolean;
}) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token_barberia'));
  const [usuarioSesion, setUsuarioSesion] = useState<UsuarioSesion | null>(() => {
    const saved = localStorage.getItem('usuario_barberia');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [usuarioDb, setUsuarioDb] = useState<Usuario | null>(null);

  const isAuthenticated = !!token;

  // Resuelve todos los roles activos combinando la sesión JWT y el perfil cargado de BD
  const rolesFromSesion = Array.isArray(usuarioSesion?.roles) && usuarioSesion.roles.length > 0
    ? usuarioSesion.roles
    : (usuarioSesion?.rol ? [usuarioSesion.rol] : []);

  const rolesFromDb: string[] = [];
  if (usuarioDb) {
    if (usuarioDb.rol === 'SUPERADMIN') rolesFromDb.push('SUPERADMIN');
    if (usuarioDb.administrador?.estado === 'ACTIVO' || (usuarioDb.rol === 'ADMINISTRADOR' && !usuarioDb.administrador)) {
      if (!rolesFromDb.includes('ADMINISTRADOR')) rolesFromDb.push('ADMINISTRADOR');
    }
    if (usuarioDb.barbero?.estado === 'ACTIVO' || (usuarioDb.rol === 'BARBERO' && !usuarioDb.barbero)) {
      if (!rolesFromDb.includes('BARBERO')) rolesFromDb.push('BARBERO');
    }
  }

  // Resuelve los roles activos: si ya cargó el perfil real de la BD, la BD es la fuente de verdad.
  // Si aún está en la carga inicial, se usa temporalmente la sesión local para evitar parpadeos visuales.
  const roles = usuarioDb ? rolesFromDb : rolesFromSesion;
  const nombre = usuarioSesion?.nombre;
  const apellido = usuarioSesion?.apellido;
  const email = usuarioSesion?.email;
  const fotoUrl = usuarioSesion?.fotoUrl;

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem('token_barberia');
    localStorage.removeItem('usuario_barberia');
    window.localStorage.setItem('barberia_logout_event', Date.now().toString());
    setToken(null);
    setUsuarioSesion(null);
    setUsuarioDb(null);
    window.location.href = '/';
  }, []);

  const isRefreshingRef = useRef(false);

  const refrescarPerfil = useCallback(async () => {
    const currentToken = localStorage.getItem('token_barberia');
    if (!currentToken || isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      // 1. Renovar silenciosamente el token JWT con los roles vigentes en la base de datos
      try {
        const refreshRes = await apiClient.post('/auth/refresh');
        if (refreshRes.data?.accessToken) {
          const { accessToken, usuario } = refreshRes.data;
          localStorage.setItem('token_barberia', accessToken);
          localStorage.setItem('usuario_barberia', JSON.stringify(usuario));
          setToken(accessToken);
          setUsuarioSesion(usuario);
        }
      } catch (err: any) {
        // Si la cuenta fue suspendida o el token es inválido, cerrar sesión de inmediato
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          cerrarSesion();
          return;
        }
      }

      // 2. Traer perfil completo de dominio de la BD
      const perfilDTO = await usuariosService.obtenerMiPerfil();
      const domainUser = usuariosMapper.toDomain(perfilDTO);
      setUsuarioDb(domainUser);
    } catch (error) {
      console.error('Error obteniendo perfil de BD:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [cerrarSesion]);

  const loginConGoogle = useCallback(async (idToken: string) => {
    try {
      const response = await apiClient.post('/auth/google', { idToken });
      const { accessToken, usuario } = response.data;
      localStorage.setItem('token_barberia', accessToken);
      localStorage.setItem('usuario_barberia', JSON.stringify(usuario));
      setToken(accessToken);
      setUsuarioSesion(usuario);

      // Cargar perfil completo de BD
      try {
        const perfilDTO = await usuariosService.obtenerMiPerfil();
        setUsuarioDb(usuariosMapper.toDomain(perfilDTO));
      } catch (e) {
        console.warn('Perfil inicial de BD no cargado de inmediato:', e);
      }

      return { success: true };
    } catch (err: any) {
      const data = err?.response?.data;
      const raw = err?.userMessage ?? data?.message ?? data?.mensaje;
      let mensaje = 'Error al autenticar con Google';

      if (typeof raw === 'string') {
        mensaje = raw;
      } else if (Array.isArray(raw)) {
        mensaje = raw.join(' ');
      } else if (typeof raw === 'object' && raw !== null) {
        if (typeof raw.message === 'string') {
          mensaje = raw.message;
        } else if (Array.isArray(raw.message)) {
          mensaje = raw.message.join(' ');
        } else if (typeof raw.error === 'string') {
          mensaje = raw.error;
        }
      } else if (typeof err?.message === 'string') {
        mensaje = err.message;
      }

      return { success: false, error: mensaje };
    }
  }, []);

  // 1. Carga inicial al arrancar la app
  useEffect(() => {
    if (isInitializing) return;
    if (token) {
      refrescarPerfil();
    }
  }, [isInitializing, token, refrescarPerfil]);

  // 2. Sincronización al volver a la pestaña (focus con debounce de 5s)
  const lastFocusRefreshRef = useRef(0);
  useEffect(() => {
    if (!token) return;
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocusRefreshRef.current > 5000) {
        lastFocusRefreshRef.current = now;
        refrescarPerfil();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, refrescarPerfil]);

  // 3. Sondeo silencioso periódico (cada 45s) solo cuando la pestaña esté activa y visible
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refrescarPerfil();
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [token, refrescarPerfil]);

  // 4. Sincronización pasiva entre pestañas (adopta el token sin repetir llamadas a la API)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'token_barberia' && e.newValue) {
        setToken(e.newValue);
        const userStr = localStorage.getItem('usuario_barberia');
        if (userStr) {
          try {
            setUsuarioSesion(JSON.parse(userStr));
          } catch {}
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        cerrarSesion,
        isAuthenticated,
        isInitializing,
        token,
        nombre,
        apellido,
        email,
        fotoUrl,
        roles,
        usuarioDb,
        loginConGoogle,
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
    throw new Error('useAuth debe utilizarse dentro de AuthContextProvider');
  }
  return context;
}