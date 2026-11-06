import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usuariosService } from '../features/usuarios/api/usuarios.service';
import { usuariosMapper } from '../features/usuarios/api/usuarios.mapper';
import type { Usuario } from '../features/usuarios/types/usuarios.types';
import apiClient, { obtenerNegocioSlugActivo } from '../shared/lib/http/axios';
import { queryClient } from '../shared/lib/queryClient';

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
  cerrarSesion: (slugParam?: unknown) => void;
  isAuthenticated: boolean;
  isInitializing: boolean;
  token: string | null;
  nombre?: string;
  apellido?: string;
  email?: string;
  fotoUrl?: string | null;
  roles: string[];
  usuarioDb: Usuario | null;
  negocioSesionSlug: string | null;
  negocioSesionNombre: string | null;
  esStaffDeSede: (slugRuta?: string | null) => boolean;
  loginConGoogle: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  refrescarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function obtenerTokenInicial(): string | null {
  const slug = obtenerNegocioSlugActivo();
  if (slug) {
    return localStorage.getItem(`token_barberia_${slug}`) || null;
  }
  return localStorage.getItem('token_barberia');
}

function parseUsuarioJson(raw: string | null): UsuarioSesion | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function obtenerUsuarioSesionInicial(): UsuarioSesion | null {
  const slug = obtenerNegocioSlugActivo();
  if (slug) {
    return parseUsuarioJson(localStorage.getItem(`usuario_barberia_${slug}`));
  }
  return parseUsuarioJson(localStorage.getItem('usuario_barberia'));
}

function obtenerNegocioSesionSlugInicial(): string | null {
  const slug = obtenerNegocioSlugActivo();
  if (slug) {
    return localStorage.getItem(`token_barberia_${slug}`) ? slug : null;
  }
  return localStorage.getItem('negocio_sesion_slug');
}

function obtenerNegocioSesionNombreInicial(): string | null {
  const slug = obtenerNegocioSlugActivo();
  if (slug) {
    return localStorage.getItem(`negocio_sesion_nombre_${slug}`) || null;
  }
  return localStorage.getItem('negocio_sesion_nombre');
}

function calcularRoles(usuarioSesion: UsuarioSesion | null, usuarioDb: Usuario | null): string[] {
  let rolesFromSesion: string[] = [];
  if (Array.isArray(usuarioSesion?.roles) && usuarioSesion.roles.length > 0) {
    rolesFromSesion = usuarioSesion.roles;
  } else if (usuarioSesion?.rol && usuarioSesion.rol !== 'PERSONAL') {
    rolesFromSesion = [usuarioSesion.rol];
  }

  if (!usuarioDb) {
    return rolesFromSesion;
  }

  const rolesFromDb: string[] = [];
  if (
    usuarioDb.rol === 'SUPERADMIN' ||
    usuarioDb.administrador?.superadmin ||
    rolesFromSesion.includes('SUPERADMIN')
  ) {
    rolesFromDb.push('SUPERADMIN');
  }
  if (
    usuarioDb.administrador?.estado === 'ACTIVO' ||
    (usuarioDb.rol === 'ADMINISTRADOR' && !usuarioDb.administrador)
  ) {
    if (!rolesFromDb.includes('ADMINISTRADOR')) rolesFromDb.push('ADMINISTRADOR');
  }
  if (
    usuarioDb.barbero?.estado === 'ACTIVO' ||
    (usuarioDb.rol === 'BARBERO' && !usuarioDb.barbero)
  ) {
    if (!rolesFromDb.includes('BARBERO')) rolesFromDb.push('BARBERO');
  }

  return rolesFromDb.length > 0 ? rolesFromDb : rolesFromSesion;
}

function formatearErrorAuth(err: any): string {
  const data = err?.response?.data;
  const raw = err?.userMessage ?? data?.message ?? data?.mensaje;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.join(' ');
  if (typeof raw === 'object' && raw !== null) {
    if (typeof raw.message === 'string') return raw.message;
    if (Array.isArray(raw.message)) return raw.message.join(' ');
    if (typeof raw.error === 'string') return raw.error;
  }
  if (typeof err?.message === 'string') return err.message;
  return 'Error al autenticar con Google';
}

function guardarSesionEnStorage(
  accessToken: string,
  usuario: any,
  negocio?: any
): { slugNegocio: string; nombreNegocio: string | null } {
  const slugNegocio = negocio?.slug ? negocio.slug.toLowerCase().trim() : '';
  const nombreNegocio = negocio?.nombre || null;

  if (slugNegocio) {
    localStorage.setItem(`token_barberia_${slugNegocio}`, accessToken);
    localStorage.setItem(`usuario_barberia_${slugNegocio}`, JSON.stringify(usuario));
    localStorage.setItem('negocio_slug', slugNegocio);
    localStorage.setItem('negocio_sesion_slug', slugNegocio);
  }
  if (nombreNegocio) {
    localStorage.setItem('negocio_sesion_nombre', nombreNegocio);
    if (slugNegocio) {
      localStorage.setItem(`negocio_sesion_nombre_${slugNegocio}`, nombreNegocio);
    }
  }
  localStorage.setItem('token_barberia', accessToken);
  localStorage.setItem('usuario_barberia', JSON.stringify(usuario));

  return { slugNegocio, nombreNegocio };
}

export function AuthContextProvider({
  children,
  isInitializing,
}: {
  children: React.ReactNode;
  isInitializing: boolean;
}) {
  const [token, setToken] = useState<string | null>(obtenerTokenInicial);
  const [usuarioSesion, setUsuarioSesion] = useState<UsuarioSesion | null>(obtenerUsuarioSesionInicial);
  const [usuarioDb, setUsuarioDb] = useState<Usuario | null>(null);
  const [negocioSesionSlug, setNegocioSesionSlug] = useState<string | null>(obtenerNegocioSesionSlugInicial);
  const [negocioSesionNombre, setNegocioSesionNombre] = useState<string | null>(obtenerNegocioSesionNombreInicial);

  const esStaffDeSede = useCallback((slugRuta?: string | null) => {
    if (!token) return false;
    if (!slugRuta) return true;
    const normalized = slugRuta.toLowerCase().trim();
    if (!negocioSesionSlug) return true;
    return negocioSesionSlug.toLowerCase().trim() === normalized;
  }, [token, negocioSesionSlug]);

  const isAuthenticated = !!token;
  const roles = useMemo(() => calcularRoles(usuarioSesion, usuarioDb), [usuarioSesion, usuarioDb]);
  const nombre = usuarioSesion?.nombre;
  const apellido = usuarioSesion?.apellido;
  const email = usuarioSesion?.email;
  const fotoUrl = usuarioSesion?.fotoUrl;

  const cerrarSesion = useCallback((slugParam?: unknown) => {
    const rawSlug = typeof slugParam === 'string' && slugParam.trim() !== '' ? slugParam.trim() : null;
    const slugDestino =
      rawSlug ||
      obtenerNegocioSlugActivo() ||
      negocioSesionSlug ||
      localStorage.getItem('negocio_sesion_slug') ||
      localStorage.getItem('negocio_slug') ||
      '';

    if (slugDestino) {
      // 1. Limpiar credenciales de Personal para esta sede específica
      localStorage.removeItem(`token_barberia_${slugDestino}`);
      localStorage.removeItem(`usuario_barberia_${slugDestino}`);
      localStorage.removeItem(`negocio_sesion_nombre_${slugDestino}`);

      // 2. Limpiar también credenciales de Cliente para esta sede (evita que el navbar siga mostrando "Hola Felipe")
      localStorage.removeItem(`token_cliente_${slugDestino}`);
      localStorage.removeItem(`cliente_${slugDestino}`);

      // 3. Notificar SOLO a las otras pestañas de ESTA MISMA SEDE
      window.localStorage.setItem(
        'barberia_logout_event',
        JSON.stringify({ slug: slugDestino, timestamp: Date.now() })
      );
    }

    // 4. Si el token general pertenecía a esta sede (o ya no hay sede), limpiar las llaves generales
    const activeSesionSlug = localStorage.getItem('negocio_sesion_slug');
    if (!activeSesionSlug || activeSesionSlug === slugDestino) {
      localStorage.removeItem('token_barberia');
      localStorage.removeItem('usuario_barberia');
      localStorage.removeItem('negocio_sesion_slug');
      localStorage.removeItem('negocio_sesion_nombre');
    }

    queryClient.clear();
    setToken(null);
    setUsuarioSesion(null);
    setUsuarioDb(null);
    setNegocioSesionSlug(null);
    setNegocioSesionNombre(null);

    // Redirigir de forma segura a la landing de esa barbería limpia dentro del mismo host
    const resolverPathSeguro = (slug?: string | null): string => {
      if (slug) {
        const slugLimpio = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (slugLimpio.length > 0 && slugLimpio.length <= 64) {
          return `/${slugLimpio}`;
        }
      }
      return '/';
    };

    window.location.pathname = resolverPathSeguro(slugDestino);
  }, [negocioSesionSlug]);

  const isRefreshingRef = useRef(false);

  const refrescarPerfil = useCallback(async () => {
    const slug = obtenerNegocioSlugActivo();
    const currentToken = slug ? localStorage.getItem(`token_barberia_${slug}`) : localStorage.getItem('token_barberia');
    if (!currentToken || isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      // 1. Renovar silenciosamente el token JWT con los roles vigentes en la base de datos
      try {
        const refreshRes = await apiClient.post('/auth/refresh');
        if (refreshRes.data?.accessToken) {
          const { accessToken, usuario, negocio } = refreshRes.data;
          const targetSlug = negocio?.slug || slug;
          if (targetSlug) {
            localStorage.setItem(`token_barberia_${targetSlug}`, accessToken);
            localStorage.setItem(`usuario_barberia_${targetSlug}`, JSON.stringify(usuario));
            localStorage.setItem('negocio_sesion_slug', targetSlug);
            setNegocioSesionSlug(targetSlug);
          }
          if (negocio?.nombre) {
            localStorage.setItem('negocio_sesion_nombre', negocio.nombre);
            if (targetSlug) {
              localStorage.setItem(`negocio_sesion_nombre_${targetSlug}`, negocio.nombre);
            }
            setNegocioSesionNombre(negocio.nombre);
          }
          localStorage.setItem('token_barberia', accessToken);
          localStorage.setItem('usuario_barberia', JSON.stringify(usuario));
          setToken(accessToken);
          setUsuarioSesion(usuario);
        }
      } catch (err: any) {
        // En caso de fallo en segundo plano, NO cerrar sesión agresivamente para no desconectar otras pestañas
        console.warn('Renovación pasiva en segundo plano omitida:', err?.message);
      }

      // 2. Traer perfil completo de dominio de la BD
      try {
        const perfilDTO = await usuariosService.obtenerMiPerfil();
        const domainUser = usuariosMapper.toDomain(perfilDTO);
        setUsuarioDb(domainUser);
      } catch (e) {
        console.warn('Perfil de BD pasivo no actualizado:', e);
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  const loginConGoogle = useCallback(async (idToken: string) => {
    try {
      const response = await apiClient.post('/auth/google', { idToken });
      const { accessToken, usuario, negocio } = response.data;
      const { slugNegocio, nombreNegocio } = guardarSesionEnStorage(accessToken, usuario, negocio);
      if (slugNegocio) setNegocioSesionSlug(slugNegocio);
      if (nombreNegocio) setNegocioSesionNombre(nombreNegocio);

      queryClient.clear();
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
      return { success: false, error: formatearErrorAuth(err) };
    }
  }, []);

  // 1. Carga inicial al arrancar la app
  useEffect(() => {
    if (isInitializing) return;
    if (token) {
      void refrescarPerfil();
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
        void refrescarPerfil();
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
        void refrescarPerfil();
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [token, refrescarPerfil]);

  // 4. Sincronización pasiva entre pestañas (SOLO para la misma sede)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      const currentSlug = obtenerNegocioSlugActivo();
      const expectedKey = currentSlug ? `token_barberia_${currentSlug}` : 'token_barberia';
      const expectedUserKey = currentSlug ? `usuario_barberia_${currentSlug}` : 'usuario_barberia';

      if (e.key === expectedKey) {
        setToken(e.newValue);
        const userStr = e.newValue ? localStorage.getItem(expectedUserKey) : null;
        if (userStr) {
          try {
            setUsuarioSesion(JSON.parse(userStr));
          } catch {
            setUsuarioSesion(null);
          }
        } else {
          setUsuarioSesion(null);
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
        negocioSesionSlug,
        negocioSesionNombre,
        esStaffDeSede,
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