import React from 'react';

export interface KyriosSpinnerProps {
  /** Tamaño del spinner: xs (14px), sm (20px), md (32px), lg (48px) */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Texto descriptivo visible junto al icono */
  mensaje?: string;
  /** Clase CSS adicional */
  className?: string;
  /** Disposición: inline (icono al lado del texto) o block (icono centrado arriba, texto abajo) */
  variant?: 'inline' | 'block';
  /** Ocultar a lectores de pantalla cuando se usa dentro de botones o elementos que ya proveen etiqueta accesible */
  'aria-hidden'?: boolean | 'true' | 'false';
  style?: React.CSSProperties;
}

const SIZE_MAP = {
  xs: 14,
  sm: 20,
  md: 32,
  lg: 48,
} as const;

/**
 * Spinner oficial con el isotipo de Kyrios Studio.
 * Rotación continua suave a 1.4s lineal con soporte para prefers-reduced-motion y modo claro/oscuro.
 */
export const KyriosSpinner: React.FC<KyriosSpinnerProps> = ({
  size = 'md',
  mensaje,
  className = '',
  variant = 'inline',
  'aria-hidden': ariaHidden,
  style,
}) => {
  const dimension = SIZE_MAP[size] || SIZE_MAP.md;
  const isHidden = ariaHidden === true || ariaHidden === 'true';

  const svgIcon = (
    <svg
      viewBox="0 0 756 648"
      width={dimension}
      height={dimension}
      className="kyrios-spinner__icon"
      fill="currentColor"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <g
        transform="translate(0.000000,648.000000) scale(0.100000,-0.100000)"
        stroke="none"
      >
        <path d="M5280 5710 c-134 -16 -245 -72 -330 -168 -59 -66 -85 -130 -95 -232 -13 -143 -35 -305 -56 -408 -79 -397 -263 -635 -554 -719 -54 -16 -129 -18 -708 -21 l-648 -3 3 473 c3 469 3 473 26 523 56 123 148 160 445 181 l97 6 0 149 0 149 -1105 0 -1105 0 0 -149 0 -148 123 -7 c214 -12 330 -48 385 -117 13 -16 33 -55 45 -86 l22 -58 0 -1065 c0 -1202 4 -1138 -76 -1225 -68 -73 -149 -97 -381 -111 l-118 -7 0 -143 0 -144 1105 0 1105 0 0 144 0 144 -92 7 c-140 10 -276 33 -327 56 -93 41 -136 113 -149 246 -4 43 -6 262 -4 486 l2 408 528 -4 c456 -3 537 -6 602 -21 370 -86 596 -258 750 -571 60 -123 89 -201 116 -314 14 -64 44 -248 44 -276 0 -13 -25 -15 -165 -15 l-165 0 0 -145 0 -145 715 0 715 0 0 145 0 145 -182 0 -183 0 -18 92 c-64 332 -241 624 -525 869 -124 108 -279 212 -416 281 l-99 50 139 68 c287 142 461 317 617 622 31 59 74 156 97 215 40 104 120 392 120 434 0 11 11 31 25 44 31 32 73 32 150 -1 101 -43 93 -48 79 55 -20 146 -18 142 -87 188 -148 100 -306 141 -467 123z m-2610 -763 c0 -1 -142 -144 -315 -317 l-315 -315 0 318 0 317 315 0 c173 0 315 -1 315 -3z m-310 -1212 l-320 -320 0 275 0 275 318 318 317 317 3 -272 2 -273 -320 -320z m320 -360 l0 -315 -317 0 -318 0 315 315 c173 173 316 315 317 315 2 0 3 -142 3 -315z" />
        <path d="M1363 1724 c-63 -23 -128 -86 -165 -162 -29 -59 -33 -76 -33 -147 1 -61 6 -92 23 -129 70 -155 241 -283 439 -331 58 -14 100 -17 205 -12 204 7 294 38 704 235 317 153 430 193 575 200 90 4 117 1 175 -17 89 -27 163 -70 269 -154 75 -60 88 -67 103 -55 9 7 47 38 84 69 79 66 178 120 263 144 46 14 83 17 165 13 144 -7 260 -47 580 -202 420 -203 507 -231 735 -231 156 0 162 1 243 32 309 119 459 359 358 578 -49 107 -134 173 -233 181 -48 4 -54 3 -33 -7 117 -51 155 -89 186 -182 32 -96 3 -188 -84 -269 -108 -101 -281 -152 -439 -128 -142 22 -262 75 -558 246 -339 195 -525 272 -714 293 -177 20 -379 -24 -519 -113 -23 -14 -46 -26 -51 -26 -6 0 -33 14 -62 30 -129 77 -265 113 -421 111 -235 -2 -390 -58 -776 -280 -370 -213 -500 -264 -664 -263 -149 2 -261 41 -356 128 -117 104 -132 228 -43 357 27 40 62 64 141 96 23 9 22 10 -15 10 -22 -1 -59 -7 -82 -15z" />
      </g>
    </svg>
  );

  const containerClass = variant === 'block' ? 'kyrios-spinner--block' : 'kyrios-spinner--inline';

  return (
    <div
      role={isHidden ? undefined : 'status'}
      aria-live={isHidden ? undefined : 'polite'}
      aria-hidden={isHidden ? true : undefined}
      className={`kyrios-spinner ${containerClass} ${className}`.trim()}
      style={style}
    >
      {svgIcon}
      {mensaje ? (
        <span className="kyrios-spinner__text">{mensaje}</span>
      ) : (
        !isHidden && <span className="visually-hidden">Cargando...</span>
      )}
    </div>
  );
};

export default KyriosSpinner;
