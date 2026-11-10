import React, { useState, useEffect } from 'react';
import { BRAND } from '../../config/brand';
import { useSystemTheme } from '../lib/useSystemTheme';
import { useTenantBrand } from '../../features/negocio/context/TenantBrandContext';

export type BrandLogoVariant = 'auto' | 'black' | 'white';

export interface BrandLogoProps {
  /**
   * - 'auto'  → detecta automáticamente el tema del sistema (default)
   * - 'black' → logo para fondos claros (fuerza logo-black)
   * - 'white' → logo para fondos oscuros (fuerza logo-white)
   */
  variant?: BrandLogoVariant;
  /** Alto del logo en px (mantiene aspect ratio automáticamente) */
  height?: number;
  /** Alto máximo en px */
  maxHeight?: number;
  /** Ancho máximo */
  maxWidth?: number | string;
  /** Clase CSS adicional */
  className?: string;
  /** Texto alternativo descriptivo. Por defecto: nombre de la barbería */
  alt?: string;
  style?: React.CSSProperties;
  /**
   * Controla si se muestra el nombre de la barbería al lado del isotipo.
   * Si es undefined, se muestra automáticamente cuando la sede tiene un logo
   * personalizado o su nombre es diferente a la marca predeterminada.
   */
  showName?: boolean;
  /**
   * Fuerza el uso exclusivo del logo oficial de Kyrios / Plataforma SaaS,
   * omitiendo cualquier marca personalizada o nombre de tenant.
   */
  forceKyrios?: boolean;
}

/**
 * Logo oficial de la barbería.
 *
 * Muestra el logo personalizado subido por la sede activa junto con el nombre
 * de la barbería al lado. Si la sede aún no ha configurado sus logos o si la
 * imagen falla, recurre de forma transparente a los assets predeterminados de BRAND.
 */
interface LogoSrcParams {
  resolvedVariant: 'black' | 'white';
  imageError: boolean;
  logoBlancoUrl?: string | null;
  logoNegroUrl?: string | null;
  isDifferentTenant: boolean;
}

function resolverSrcLogo({
  resolvedVariant,
  imageError,
  logoBlancoUrl,
  logoNegroUrl,
  isDifferentTenant,
}: LogoSrcParams): { src: string; isCustomLogo: boolean } {
  const fallbackSrc = resolvedVariant === 'white' ? BRAND.assets.logoWhite : BRAND.assets.logoBlack;

  if (imageError) {
    return {
      src: isDifferentTenant ? BRAND.assets.iconKyrios : fallbackSrc,
      isCustomLogo: false,
    };
  }

  const customUrl = resolvedVariant === 'white' ? logoBlancoUrl : logoNegroUrl;
  if (customUrl) {
    return { src: customUrl, isCustomLogo: true };
  }

  if (isDifferentTenant) {
    return { src: BRAND.assets.iconKyrios, isCustomLogo: false };
  }

  return { src: fallbackSrc, isCustomLogo: false };
}

function resolverVarianteLogo(variant: 'auto' | 'black' | 'white', systemTheme: string): 'black' | 'white' {
  if (variant === 'white') return 'white';
  if (variant === 'black') return 'black';
  return systemTheme === 'dark' ? 'white' : 'black';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'auto',
  height = 36,
  maxHeight,
  maxWidth = '100%',
  className = '',
  alt,
  style,
  showName,
  forceKyrios = false,
}) => {
  const systemTheme = useSystemTheme();
  const { nombreNegocio, logoBlancoUrl, logoNegroUrl } = useTenantBrand();
  const [imageError, setImageError] = useState(false);

  // Reiniciar estado de error si cambian las URLs del logo
  useEffect(() => {
    setImageError(false);
  }, [logoBlancoUrl, logoNegroUrl]);

  const resolvedVariant = resolverVarianteLogo(variant, systemTheme);

  const isDifferentTenant = !forceKyrios && Boolean(
    nombreNegocio &&
    nombreNegocio.toLowerCase().trim() !== BRAND.name.toLowerCase().trim()
  );

  const { src, isCustomLogo } = forceKyrios
    ? { src: resolvedVariant === 'white' ? BRAND.assets.logoWhite : BRAND.assets.logoBlack, isCustomLogo: false }
    : resolverSrcLogo({
        resolvedVariant,
        imageError,
        logoBlancoUrl,
        logoNegroUrl,
        isDifferentTenant,
      });

  const effectiveMaxHeight = maxHeight ?? height;
  const effectiveAlt = alt || (forceKyrios ? BRAND.name : (nombreNegocio || BRAND.name));
  const shouldShowName = !forceKyrios && (showName ?? (isCustomLogo || isDifferentTenant));
  const textColor = resolvedVariant === 'white' ? '#FFFFFF' : '#0C0C0C';

  const imageElement = (
    <img
      src={src}
      alt={effectiveAlt}
      height={height}
      className={`brand-logo-img ${!shouldShowName ? className : ''}`.trim()}
      onError={() => setImageError(true)}
      style={{
        display: 'inline-block',
        width: 'auto',
        maxWidth,
        maxHeight: `${effectiveMaxHeight}px`,
        height: `${height}px`,
        objectFit: 'contain',
        verticalAlign: 'middle',
        ...(!shouldShowName ? style : {}),
      }}
      draggable={false}
    />
  );

  if (!shouldShowName) {
    return imageElement;
  }

  return (
    <div
      className={`brand-logo-container d-inline-flex align-items-center gap-2 ${className}`.trim()}
      style={{
        verticalAlign: 'middle',
        textDecoration: 'none',
        ...style,
      }}
    >
      {imageElement}
      <span
        className="brand-logo-name fw-bold text-truncate"
        style={{
          fontSize: 'clamp(0.76rem, 2.8vw, 0.92rem)',
          letterSpacing: '-0.01em',
          lineHeight: 1.15,
          maxWidth: 'clamp(145px, 46vw, 260px)',
          color: textColor,
          fontFamily: BRAND.typography.body,
        }}
      >
        {nombreNegocio || effectiveAlt}
      </span>
    </div>
  );
};

export default BrandLogo;
