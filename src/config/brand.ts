/**
 * Configuración centralizada de branding de Kyrios Studio.
 * Fuente única de verdad para logos, colores e identidad de la marca.
 * Importa los assets con Vite para que sean procesados correctamente en build.
 */

import logoBlack from '../assets/brand/logo-black.svg';
import logoWhite from '../assets/brand/logo-white.svg';
import favicon from '../assets/brand/favicon.svg';
import banner from '../assets/brand/banner.png';

export const BRAND = {
  /** Nombre oficial de la marca */
  name: 'Kyrios Studio',
  tagline: 'Barbería de alto estándar · Popayán',

  colors: {
    /** Fondo claro de marca */
    white: '#FFFDFA',
    /** Negro de marca */
    black: '#0C0C0C',
    /** Azul de identidad */
    blue: '#0071BC',
  },

  typography: {
    /**
     * Percolator-Bold — tipografía de display de la marca.
     * No existe localmente como archivo de fuente; se usa como font-family
     * de fallback para cuando esté disponible. Para producción integrar
     * el archivo .woff2 en src/assets/brand/fonts/.
     */
    display: '"Percolator-Bold", "Barlow Condensed", sans-serif',
    body: '"Inter", system-ui, sans-serif',
  },

  assets: {
    /** Logo para fondos claros */
    logoBlack,
    /** Logo para fondos oscuros */
    logoWhite,
    /** Ícono/favicon de la marca */
    favicon,
    /** Banner principal */
    banner,
  },

  social: {
    instagram: 'https://www.instagram.com/kyrios_sstudio/',
    facebook: 'https://www.facebook.com/profile.php?id=61579605825892',
  },

  contact: {
    address: 'Vía al Bosque, Tv 9A Norte, Popayán, Cauca',
    /** Enlace directo a Google Maps con coordenadas exactas */
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Kyrios+Audio+Norte,+Popay%C3%A1n',
    /** Coordenadas del pin en Google Maps */
    coordinates: {
      lat: 2.4839891,
      lng: -76.5807622,
    },
    /** Src del iframe embebido (obtenido desde Google Maps → Compartir → Insertar) */
    embedSrc:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1993.034687092028!2d-76.58076218317477!3d2.4839890894831713!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3005436cb491f3%3A0xcf4418387d9dbe3a!2sKyrios%20Audio%20Norte!5e0!3m2!1ses-419!2sco!4v1790892891559!5m2!1ses-419!2sco',
  },
} as const;