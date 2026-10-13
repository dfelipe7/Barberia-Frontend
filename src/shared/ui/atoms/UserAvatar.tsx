import React, { useState } from 'react';
import { obtenerUrlFoto } from '../../lib/obtenerUrlFoto';
import { useTheme } from '../../context/ThemeContext';

export interface UserAvatarProps {
  nombre?: string;
  apellido?: string;
  fotoUrl?: string | null;
  size?: number; // default 36
  className?: string;
}

/**
 * Subcomponente que muestra la imagen y maneja el error de carga.
 * Montarlo con `key={url}` garantiza que el estado errorCarga se resetea
 * automáticamente cuando cambia la URL, sin necesidad de useEffect.
 */
const AvatarImg: React.FC<{
  url: string;
  nombre?: string;
  size: number;
  className: string;
  isDark: boolean;
  onError: () => void;
}> = ({ url, nombre, size, className, isDark, onError }) => (
  <img
    src={url}
    alt={`Foto de ${nombre || 'usuario'}`}
    onError={onError}
    className={`rounded-circle border ${className}`.trim()}
    style={{
      width: `${size}px`,
      height: `${size}px`,
      objectFit: 'cover',
      borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(12,12,12,0.15)',
      flexShrink: 0,
      transition: 'border-color 150ms ease',
    }}
  />
);

export const UserAvatar: React.FC<UserAvatarProps> = ({
  nombre,
  apellido,
  fotoUrl,
  size = 36,
  className = '',
}) => {
  const { isDark } = useTheme();
  const url = obtenerUrlFoto(fotoUrl);
  const [errorCarga, setErrorCarga] = useState(false);

  // Iniciales para el fallback
  const iniN = (nombre || '').trim()[0] || '';
  const iniA = (apellido || '').trim()[0] || '';
  const iniciales = (iniN + iniA).toUpperCase();
  const fontSize = `${Math.max(11, Math.round(size * 0.38))}px`;

  // Si hay URL y no falló la carga, mostramos la imagen.
  // Se monta con key={url} para resetear errorCarga cuando la URL cambia.
  if (url && !errorCarga) {
    return (
      <AvatarImg
        key={url}
        url={url}
        nombre={nombre}
        size={size}
        className={className}
        isDark={isDark}
        onError={() => setErrorCarga(true)}
      />
    );
  }

  // Si no hay iniciales válidas tampoco, no renderizar nada
  if (!iniN && !iniA) return null;

  // Fallback: iniciales en círculo azul
  return (
    <div
      className={`d-inline-flex align-items-center justify-content-center rounded-circle fw-bold ${className}`.trim()}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize,
        backgroundColor: '#0071BC',
        color: '#FFFDFA',
        flexShrink: 0,
        letterSpacing: '0.04em',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,113,188,0.3)'}`,
        transition: 'border-color 150ms ease',
      }}
      aria-hidden="true"
    >
      {iniciales}
    </div>
  );
};

export default UserAvatar;
