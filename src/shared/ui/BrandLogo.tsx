import React from 'react';
import { BRAND } from '../../config/brand';
import { useSystemTheme } from '../lib/useSystemTheme';

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
  /** Texto alternativo descriptivo. Por defecto: nombre de la marca */
  alt?: string;
  style?: React.CSSProperties;
}

/**
 * Logo oficial de Kyrios Studio.
 *
 * Con `variant="auto"` (por defecto) detecta el tema del sistema y usa
 * físicamente el archivo vectorial correcto: logo-black sobre fondos claros y
 * logo-white sobre fondos oscuros.
 *
 * Incluye dimensiones responsivas fluidas que evitan desbordamiento en
 * pantallas móviles pequeñas (320px, 375px, 425px).
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'auto',
  height = 36,
  maxHeight,
  maxWidth = '100%',
  className = '',
  alt = BRAND.name,
  style,
}) => {
  const systemTheme = useSystemTheme();

  const resolvedVariant: 'black' | 'white' =
    variant === 'auto'
      ? systemTheme === 'dark' ? 'white' : 'black'
      : variant;

  const src =
    resolvedVariant === 'white'
      ? BRAND.assets.logoWhite
      : BRAND.assets.logoBlack;

  const effectiveMaxHeight = maxHeight ?? height;

  return (
    <img
      src={src}
      alt={alt}
      height={height}
      className={`brand-logo-img ${className}`.trim()}
      style={{
        display: 'inline-block',
        width: 'auto',
        maxWidth,
        maxHeight: `${effectiveMaxHeight}px`,
        height: 'auto',
        objectFit: 'contain',
        verticalAlign: 'middle',
        ...style,
      }}
      draggable={false}
    />
  );
};

export default BrandLogo;
