import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usuariosService } from '../features/usuarios/api/usuarios.service';
import { usuariosMapper } from '../features/usuarios/api/usuarios.mapper';
import type { Usuario } from '../features/usuarios/types/usuarios.types';
import apiClient, { obtenerNegocioSlugActivo } from '../shared/lib/http/axios';
import { queryClient } from '../shared/lib/queryClient';

/**
 * Información mínima del usuario persistida en almacenamiento local durante la sesión.
 */
export interface UsuarioSesion {
  /** Identificador numérico del usuario en la base de datos. */
  id: number;
  /** Correo electrónico verificado del usuario. */
  email: string;
  /** Nombre de pila del usuario. */
  nombre: string;
  /** Apellidos del usuario. */
  apellido?: string;
  /** Rol primario o identificador de tipo (ej. `PERSONAL`, `ADMINISTRADOR`). */
  rol: string;
  /** Lista opcional de roles RBAC asignados (`SUPERADMIN`, `ADMINISTRADOR`, `BARBERO`). */
  roles?: string[];
  /** Estado de la cuenta (`ACTIVO`, `INACTIVO`). */
  estado: string;
  /** URL de la fotografía de perfil del usuario. */
  fotoUrl?: string | null;
}

/**
 * Contrato de valores y operaciones expuestas por el contexto global de autenticación (`AuthContext`).
 */
export interface AuthContextType {
  /**
   * Cierra la sesión activa purgando tokens y cachés de forma aislada para la sede indicada.
   *
   * @param slugParam - Slug opcional de la sede cuyo acceso se desea finalizar.
   */
  cerrarSesion: (slugParam?: unknown) => void;
  /** Indica si existe un token JWT válido de usuario activo. */
  isAuthenticated: boolean;
  /** Indica si la sesión está en fase inicial de lectura de almacenamiento. */
  isInitializing: boolean;
  /** Token Bearer JWT actual del usuario autenticado. */
  token: string | null;
  /** Nombre del usuario en sesión. */
  nombre?: string;
  /** Apellido del usuario en sesión. */
  apellido?: string;
  /** Correo del usuario en sesión. */
  email?: string;
  /** URL de la fotografía de perfil del usuario. */
  fotoUrl?: string | null;
  /** Lista consolidada de roles RBAC efectivos del usuario. */
  roles: string[];
  /** Modelo completo del usuario sincronizado en tiempo real con la base de datos. */
  usuarioDb: Usuario | null;
  /** Slug de la barbería a la que pertenece la sesión activa del personal. */
  negocioSesionSlug: string | null;
  /** Nombre comercial de la barbería asociada a la sesión. */
  negocioSesionNombre: string | null;
  /**
   * Valida si el usuario en sesión es personal perteneciente a la sede indicada en la ruta.
   *
   * @param slugRuta - Slug de la barbería extraído de la URL.
   * @returns `true` si el usuario tiene membresía en dicha sede.
   */
  esStaffDeSede: (slugRuta?: string | null) => boolean;
  /**
   * Intercambia el ID Token de Google OAuth por un JWT de sesión en el backend.
   *
   * @param idToken - Token emitido por Google Identity Services.
   * @returns Resultado del login con indicador de éxito o mensaje de error.
   */
  loginConGoogle: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  /**
   * Sincroniza el perfil del usuario contra el backend renovando roles y estados.
   */
  refrescarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Resuelve el token JWT inicial dando prioridad a la clave específica de la sede activa.
 *
 * @returns El token JWT encontrado en `localStorage` o `null`.
 */
function obtenerTokenInicial(): string | null {
  const slug = obtenerNegocioSlugActivo();
  if (slug) {
    return localStorage.getItem(`token_barberia_${slug}`) || null;
  }
  return localStorage.getItem('token_barberia');
}

/**
 * Parsea de forma segura una cadena JSON que contiene los datos del usuario en sesión.
 *
 * @param raw - Cadena de texto serializada en formato JSON.
 * @returns Objeto `UsuarioSesion` válido o `null` ante fallos de formato.
 */
function parseUsuarioJson(raw: string | null): UsuarioSesion | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Obtiene los datos del usuario en sesión deserializados desde `localStorage`.
 *
 * @returns Datos de sesión del usuario o `null`.
 */
function obtenerUsuarioSesionInicial(): UsuarioSesion | null {
  const slug = obtenerNegocioSlugActivo();
  if (slug) {
    return parseUsuarioJson(localStorage.getItem(`usuario_barberia_${slug}`));
  }
  return parseUsuarioJson(localStorage.getItem('usuario_barberia'));
}

/**
 * Determina el slug del negocio al que está asociada la sesión inicial.
 *
 * @returns Slug en minúsculas del negocio o `null`.
 */
function obtenerNegocioSesionSlugInicial(): string | null {
  const slug = obtenerNegocioSlugActivo();
  if (slug) {
    return localStorage.getItem(`token_barberia_${slug}`) ? slug : null;
  }
  return localStorage.getItem('negocio_sesion_slug');
}

/**
 * Obtiene el nombre comercial de la barbería guardada en la sesión.
 *
 * @returns Nombre del negocio o `null`.
 */
function obtenerNegocioSesionNombreInicial(): string | null {
  const slug = obtenerNegocioSlugActivo();
  if (slug) {
    return localStorage.getItem(`negocio_sesion_nombre_${slug}`) || null;
  }
  return localStorage.getItem('negocio_sesion_nombre');
}

/**
 * Fusiona los roles declarados en el JWT de sesión con los roles activos de la base de datos.
 *
 * @param usuarioSesion - Datos de sesión almacenados en cliente.
 * @param usuarioDb - Perfil fresco obtenido de la base de datos.
 * @returns Lista normalizada de roles válidos (`SUPERADMIN`, `ADMINISTRADOR`, `BARBERO`).
 */
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

/**
 * Proveedor de contexto React que administra el ciclo de vida de autenticación del personal.
 *
 * @remarks
 * **Capacidades Principales:**
 * 1. Mantiene el token JWT y el perfil de usuario en memoria y almacenamiento local aislado por sede.
 * 2. Verifica en tiempo de ejecución si el usuario pertenece al personal de la barbería visitada (`esStaffDeSede`).
 * 3. Gestiona el intercambio seguro de tokens de Google Identity Services (`loginConGoogle`).
 * 4. Actualiza los roles y el estado de la cuenta en segundo plano mediante sondeo pasivo.
 * 5. Notifica y reacciona ante eventos de cierre de sesión en otras pestañas de la misma sede.
 *
 * @param props - Componentes hijos y bandera de inicialización.
 */
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

/**
 * Hook personalizado para acceder a los valores y operaciones de autenticación de personal.
 *
 * @remarks
 * Debe utilizarse obligatoriamente dentro de un componente envuelto por `AuthProvider`
 * o `AuthContextProvider`. Si se invoca fuera de este contexto, arroja una excepción explicativa.
 *
 * @returns El contexto de autenticación de tipo `AuthContextType`.
 * @throws {Error} Si se consume fuera de `AuthContextProvider`.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthContextProvider');
  }
  return context;
}