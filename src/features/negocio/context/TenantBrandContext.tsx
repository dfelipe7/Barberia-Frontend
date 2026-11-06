import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { perfilNegocioApi } from '../services/perfilNegocioApi';
import type { PerfilNegocioPublicoResponse } from '../types/perfilNegocio.types';
import { redesSocialesApi } from '../services/redesSocialesApi';
import type { RedSocial } from '../types/redesSociales.types';
import { obtenerNegocioSlugActivo } from '../../../shared/lib/http/axios';
import { BRAND } from '../../../config/brand';
import { resolverTemaTenant, type TenantThemeId } from '../../../config/tenantTheme';

export interface TenantBrandContextValue {
  slug: string | null;
  nombreNegocio: string;
  frasePrincipal: string;
  logoBlancoUrl: string | null;
  logoNegroUrl: string | null;
  bannerUrl: string | null;
  faviconUrl: string | null;
  direccion: string | null;
  ciudad: string | null;
  departamento: string | null;
  referencia: string | null;
  latitud: number | null;
  longitud: number | null;
  mapsUrl: string | null;
  temaKey: string;
  configurado: boolean;
  redesSociales: RedSocial[];
  recargarPerfil: () => Promise<void>;
}

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

export const TenantBrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [perfil, setPerfil] = useState<PerfilNegocioPublicoResponse | null>(null);
  const [redesSociales, setRedesSociales] = useState<RedSocial[]>([]);
  const slug = obtenerNegocioSlugActivo();

  const cargarPerfil = useCallback(async () => {
    if (!slug || slug === 'plataforma' || slug === 'explorar') {
      setPerfil(null);
      setRedesSociales([]);
      return;
    }

    try {
      const [perfilData, redesData] = await Promise.all([
        perfilNegocioApi.obtenerPerfilPublico().catch(() => null),
        redesSocialesApi.listar().catch(() => []),
      ]);
      setPerfil(perfilData);
      setRedesSociales(redesData || []);
    } catch {
      // Si falla o no tiene perfil configurado, queda en null y usará los fallbacks
      setPerfil(null);
      setRedesSociales([]);
    }
  }, [slug]);

  useEffect(() => {
    void cargarPerfil();
  }, [cargarPerfil, location.pathname]);

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


  // Sincronizar tema de la barbería en el atributo HTML raíz
  useEffect(() => {
    const temaId = (perfil?.temaKey as TenantThemeId) || resolverTemaTenant(slug);
    if (temaId) {
      document.documentElement.dataset.tenantTheme = temaId;
    }
  }, [perfil?.temaKey, slug]);

  // Escuchar eventos globales y entre pestañas cuando se actualice la configuración
  useEffect(() => {
    const handleActualizado = () => {
      void cargarPerfil();
    };
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('tema_negocio_')) {
        const nuevoTema = resolverTemaTenant(slug);
        if (nuevoTema) {
          document.documentElement.dataset.tenantTheme = nuevoTema;
        }
        void cargarPerfil();
      }
    };
    window.addEventListener('tenant-perfil-actualizado', handleActualizado);
    window.addEventListener('tenant-tema-cambiado', handleActualizado);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('tenant-perfil-actualizado', handleActualizado);
      window.removeEventListener('tenant-tema-cambiado', handleActualizado);
      window.removeEventListener('storage', handleStorage);
    };
  }, [cargarPerfil, slug]);

  const value: TenantBrandContextValue = {
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
  };

  return <TenantBrandContext.Provider value={value}>{children}</TenantBrandContext.Provider>;
};

export function useTenantBrand() {
  return useContext(TenantBrandContext);
}
