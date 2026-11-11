import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { perfilNegocioApi } from '../services/perfilNegocioApi';
import type { PerfilNegocioPublicoResponse } from '../types/perfilNegocio.types';
import { redesSocialesApi } from '../services/redesSocialesApi';
import type { RedSocial } from '../types/redesSociales.types';
import { obtenerNegocioSlugActivo } from '../../../shared/lib/http/axios';
import { BRAND } from '../../../config/brand';
import { resolverTemaTenant, TEMAS_TENANT, type TenantThemeId } from '../../../config/tenantTheme';

/**
 * Valores y recursos visuales expuestos por el contexto de personalización de marca de la barbería.
 */
export interface TenantBrandContextValue {
  /** Slug activo de la barbería actual en minúsculas, o `null` si se está en la plataforma global. */
  slug: string | null;
  /** Nombre comercial de la barbería (o nombre por defecto de la plataforma SaaS). */
  nombreNegocio: string;
  /** Lema o frase promocional de la barbería. */
  frasePrincipal: string;
  /** URL absoluta al logotipo en versión clara/blanca (para fondos oscuros). */
  logoBlancoUrl: string | null;
  /** URL absoluta al logotipo en versión oscura/negra (para fondos claros). */
  logoNegroUrl: string | null;
  /** URL absoluta al banner o imagen de portada de la barbería. */
  bannerUrl: string | null;
  /** URL absoluta al favicon personalizado de la pestaña del navegador. */
  faviconUrl: string | null;
  /** Dirección física del local. */
  direccion: string | null;
  /** Municipio o ciudad de ubicación. */
  ciudad: string | null;
  /** Departamento o provincia de ubicación. */
  departamento: string | null;
  /** Indicaciones adicionales de llegada al establecimiento. */
  referencia: string | null;
  /** Coordenada geográfica de latitud. */
  latitud: number | null;
  /** Coordenada geográfica de longitud. */
  longitud: number | null;
  /** Enlace a Google Maps para navegación GPS directa. */
  mapsUrl: string | null;
  /** Clave del tema visual activo aplicado al documento (`clasico-azul`, etc.). */
  temaKey: string;
  /** Indica si la barbería ha completado la configuración inicial de su perfil público. */
  configurado: boolean;
  /** Lista de perfiles y canales de redes sociales activos de la barbería. */
  redesSociales: RedSocial[];
  /** Función para forzar la recarga del perfil y tema desde el backend. */
  recargarPerfil: () => Promise<void>;
}

/**
 * Normaliza y resuelve una ruta de recurso estático (imágenes, logos) asegurando
 * que devuelva una URL absoluta accesible en el navegador.
 *
 * @param url - Ruta relativa o URL absoluta proveniente del backend.
 * @returns URL absoluta completamente calificada, o `null` si no se proporcionó ruta.
 */
export function resolverUrlRecurso(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
}

const MAPA_TITULOS_RUTAS: readonly [string, string][] = [
  ['/reservar', 'Reservar Cita'],
  ['/reserva/gestion', 'Mi Cita'],
  ['/c/', 'Mi Cita'],
  ['/catalogo/servicios', 'Servicios'],
  ['/catalogo/barberos', 'Barberos'],
  ['/cliente/mi-cuenta', 'Mi Cuenta'],
  ['/cliente/registro', 'Registro'],
  ['/cliente/iniciar-sesion', 'Acceso Cliente'],
  ['/login', 'Iniciar Sesión'],
  ['/dashboard', 'Dashboard'],
  ['/mi-perfil', 'Mi Perfil'],
  ['/configuracion', 'Configuración'],
  ['/usuarios', 'Usuarios'],
  ['/barberos', 'Barberos'],
  ['/servicios', 'Servicios'],
  ['/horarios', 'Horarios'],
  ['/reservas', 'Reservas'],
  ['/whatsapp', 'WhatsApp'],
];

const TEMAS_PERMITIDOS: readonly TenantThemeId[] = [
  'clasico-azul',
  'cyber-lime',
  'sunset-amber',
  'midnight-cyan',
  'crimson-velvet',
  'monochrome-noir',
];

const SLUG_SEGURO_REGEX = /^[a-z0-9-]+$/;

/**
 * Sanitiza y persiste el tema en el almacenamiento local mitigando vulnerabilidades
 * de Browser Storage Poisoning (CWE) por entradas externas de URL o API.
 */
function guardarTemaSeguro(slug: string | null | undefined, tema: string | null | undefined): void {
  if (!tema) return;
  const temaSanitizado = TEMAS_PERMITIDOS.find((t) => t === tema);
  if (!temaSanitizado) return;

  try {
    localStorage.setItem('tema_negocio_activo', temaSanitizado);
    if (slug && SLUG_SEGURO_REGEX.test(slug)) {
      const claveSegura = `tema_negocio_${encodeURIComponent(slug)}`;
      localStorage.setItem(claveSegura, temaSanitizado);
    }
  } catch {
    // Almacenamiento local restringido o inaccesible
  }
}

/**
 * Resuelve el título de la pestaña del navegador combinando el nombre
 * de la barbería y la sección que el usuario está visitando.
 */
function resolverTituloPestana(pathname: string, nombreNegocio: string, frase?: string | null): string {
  if (pathname === '/' || pathname === '') {
    return 'Kyrios Platform | SaaS para Barberías';
  }
  if (pathname.startsWith('/plataforma') || pathname.startsWith('/explorar')) {
    return 'Explorar Barberías | Kyrios Platform';
  }

  // Quitar el prefijo del slug (/:slug) para conocer la sección relativa
  const pathSinSlug = pathname.replace(/^\/[^/]+/, '') || '/';

  // Páginas del cliente / públicas
  if (pathSinSlug === '/' || pathSinSlug === '') {
    return frase ? `${nombreNegocio} · ${frase}` : `${nombreNegocio} | Barbería`;
  }

  const coincidencia = MAPA_TITULOS_RUTAS.find(([prefijo]) => pathSinSlug.startsWith(prefijo));
  if (coincidencia) {
    return `${coincidencia[1]} | ${nombreNegocio}`;
  }

  return `${nombreNegocio} | Barbería`;
}

const TenantBrandContext = createContext<TenantBrandContextValue>({
  slug: null,
  nombreNegocio: BRAND.name,
  frasePrincipal: BRAND.tagline,
  logoBlancoUrl: null,
  logoNegroUrl: null,
  bannerUrl: null,
  faviconUrl: null,
  direccion: null,
  ciudad: null,
  departamento: null,
  referencia: null,
  latitud: null,
  longitud: null,
  mapsUrl: null,
  temaKey: 'clasico-azul',
  configurado: false,
  redesSociales: [],
  recargarPerfil: async () => {},
});

/**
 * Proveedor React que inyecta la identidad visual, metadatos y temas dinámicos
 * de la barbería en función de la URL activa.
 *
 * @remarks
 * **Funcionalidades Clave:**
 * 1. Resuelve el `slug` del tenant a partir de la ruta o del estado de la pestaña.
 * 2. Consulta de forma asíncrona el perfil público del negocio y sus redes sociales.
 * 3. Inyecta el atributo `data-tenant-theme` en el elemento raíz `<html>` del documento.
 * 4. Actualiza dinámicamente el título `<title>` y el `<link rel="icon">` (favicon) del navegador.
 * 5. Mantiene sincronización pasiva periódica y ante eventos de foco en la pestaña.
 *
 * @param props - Componentes secundarios de la aplicación.
 */
export const TenantBrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [perfil, setPerfil] = useState<PerfilNegocioPublicoResponse | null>(null);
  const [redesSociales, setRedesSociales] = useState<RedSocial[]>([]);
  const slug = obtenerNegocioSlugActivo();
  const ultimaCargaRef = useRef<number>(0);

  const cargarPerfil = useCallback(async (forzar = false) => {
    if (!slug || slug === 'plataforma' || slug === 'explorar') {
      setPerfil(null);
      setRedesSociales([]);
      return;
    }

    const ahora = Date.now();
    // Prevenir peticiones redundantes con un throttle de 4 segundos salvo que sea forzado
    if (!forzar && ahora - ultimaCargaRef.current < 4000) {
      return;
    }
    ultimaCargaRef.current = ahora;

    try {
      const [perfilData, redesData] = await Promise.all([
        perfilNegocioApi.obtenerPerfilPublico().catch(() => null),
        redesSocialesApi.listar().catch(() => null),
      ]);
      if (perfilData) {
        setPerfil(perfilData);
      }
      if (redesData) {
        setRedesSociales(redesData);
      }

      const temaKeyBackend = perfilData?.temaKey as TenantThemeId | undefined;
      if (slug && temaKeyBackend && TEMAS_TENANT[temaKeyBackend]) {
        guardarTemaSeguro(slug, temaKeyBackend);
        document.documentElement.dataset.tenantTheme = temaKeyBackend;
      }
    } catch {
      // Prevenir sobreescritura accidental si el perfil ya estaba cargado en memoria
    }
  }, [slug]);

  useEffect(() => {
    void cargarPerfil(true);
  }, [cargarPerfil]);

  // Actualizar dinámicamente el título y el favicon de la pestaña del navegador
  useEffect(() => {
    const nombre = perfil?.negocio?.nombre || (slug && slug !== 'plataforma' && slug !== 'explorar' ? slug.toUpperCase() : BRAND.name);
    document.title = resolverTituloPestana(location.pathname, nombre, perfil?.frasePrincipal);

    // Resolver favicon: si la barbería subió uno, usarlo; de lo contrario, favicon por defecto
    const faviconUrl = perfil?.faviconUrl ? resolverUrlRecurso(perfil.faviconUrl) : '/favicon.svg';
    if (faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      if (link.href !== faviconUrl) {
        link.href = faviconUrl;
      }
    }
  }, [location.pathname, perfil, slug]);


  // Sincronizar tema de la barbería en el atributo HTML raíz y persistir en localStorage de forma segura
  useEffect(() => {
    const temaId = (perfil?.temaKey as TenantThemeId) || resolverTemaTenant(slug);
    if (temaId) {
      document.documentElement.dataset.tenantTheme = temaId;
      guardarTemaSeguro(slug, temaId);
    }
  }, [perfil?.temaKey, slug]);

  // Escuchar eventos cuando el perfil es actualizado desde la configuración administrativa
  useEffect(() => {
    const handleActualizado = () => {
      void cargarPerfil(true);
    };

    window.addEventListener('tenant-perfil-actualizado', handleActualizado);

    return () => {
      window.removeEventListener('tenant-perfil-actualizado', handleActualizado);
    };
  }, [cargarPerfil]);

  // Sincronización entre navegadores y ventanas remotas:
  // Cuando el usuario regresa a la pestaña (focus / visible), refresca el perfil silenciosamente
  useEffect(() => {
    const handleReactivacion = () => {
      if (document.visibilityState === 'visible') {
        void cargarPerfil(false);
      }
    };

    window.addEventListener('focus', handleReactivacion);
    document.addEventListener('visibilitychange', handleReactivacion);

    // Polling ligero cada 20 segundos solo si la pestaña está visible
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void cargarPerfil(false);
      }
    }, 20000);

    return () => {
      window.removeEventListener('focus', handleReactivacion);
      document.removeEventListener('visibilitychange', handleReactivacion);
      window.clearInterval(intervalId);
    };
  }, [cargarPerfil]);

  const value: TenantBrandContextValue = useMemo(
    () => ({
      slug,
      nombreNegocio: perfil?.negocio?.nombre || BRAND.name,
      frasePrincipal: perfil?.frasePrincipal || BRAND.tagline,
      logoBlancoUrl: resolverUrlRecurso(perfil?.logoBlancoUrl),
      logoNegroUrl: resolverUrlRecurso(perfil?.logoNegroUrl),
      bannerUrl: resolverUrlRecurso(perfil?.bannerUrl),
      faviconUrl: resolverUrlRecurso(perfil?.faviconUrl),
      direccion: perfil?.direccion || null,
      ciudad: perfil?.ciudad || null,
      departamento: perfil?.departamento || null,
      referencia: perfil?.referencia || null,
      latitud: perfil?.latitud ?? null,
      longitud: perfil?.longitud ?? null,
      mapsUrl: perfil?.mapsUrl || null,
      temaKey: perfil?.temaKey || resolverTemaTenant(slug),
      configurado: perfil?.configurado ?? false,
      redesSociales,
      recargarPerfil: cargarPerfil,
    }),
    [slug, perfil, redesSociales, cargarPerfil]
  );

  return <TenantBrandContext.Provider value={value}>{children}</TenantBrandContext.Provider>;
};

/**
 * Hook personalizado para acceder a los datos de identidad visual, temas y perfil de la barbería.
 *
 * @returns El contexto de personalización de marca de tipo `TenantBrandContextValue`.
 */
export function useTenantBrand() {
  return useContext(TenantBrandContext);
}
