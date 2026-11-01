/**
 * Tipos de datos para el módulo de Perfil e Identidad del Negocio (Multitenant).
 * Coinciden con los DTOs expuestos por PerfilNegocioController en Barberia-Backend.
 */

export interface NegocioMarca {
  nombre: string;
  slug: string;
}

export interface ContenidoMarca {
  frasePrincipal: string | null;
  temaKey?: string | null;
}

export interface UbicacionNegocio {
  direccion: string | null;
  ciudad: string | null;
  departamento: string | null;
  referencia: string | null;
  latitud: number | null;
  longitud: number | null;
  mapsUrl: string | null;
}

export interface ReferenciasArchivo {
  faviconUrl: string | null;
  bannerUrl: string | null;
  logoBlancoUrl: string | null;
  logoNegroUrl: string | null;
}

export interface PerfilNegocioGestionResponse {
  negocio: NegocioMarca;
  configurado: boolean;
  contenido: ContenidoMarca;
  ubicacion: UbicacionNegocio;
  referenciasArchivo: ReferenciasArchivo;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface PerfilNegocioPublicoResponse {
  negocio: NegocioMarca;
  configurado: boolean;
  frasePrincipal: string | null;
  temaKey?: string | null;
  faviconUrl: string | null;
  bannerUrl: string | null;
  logoBlancoUrl: string | null;
  logoNegroUrl: string | null;
  direccion: string | null;
  ciudad: string | null;
  departamento: string | null;
  referencia: string | null;
  latitud?: number | null;
  longitud?: number | null;
  mapsUrl: string | null;
}

export interface ActualizarPerfilNegocioDto {
  frasePrincipal?: string;
  temaKey?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  referencia?: string;
  latitud?: number;
  longitud?: number;
}

export type TipoRecursoPerfil = 'favicon' | 'banner' | 'logo-blanco' | 'logo-negro';

