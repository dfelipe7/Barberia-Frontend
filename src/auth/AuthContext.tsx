import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const roles = usuarioSesion?.rol ? [usuarioSesion.rol] : [];
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

  const refrescarPerfil = useCallback(async () => {
    const currentToken = localStorage.getItem('token_barberia');
    if (!currentToken) return;
    try {
      const perfilDTO = await usuariosService.obtenerMiPerfil();
      setUsuarioDb(usuariosMapper.toDomain(perfilDTO));
    } catch (error) {
      console.error('Error obteniendo perfil de BD:', error);
    }
  }, []);

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

  useEffect(() => {
    if (isInitializing) return;
    if (token) {
      refrescarPerfil();
    }
  }, [isInitializing, token, refrescarPerfil]);

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