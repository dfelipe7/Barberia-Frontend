import React from 'react';
import { obtenerUrlFoto } from '../../lib/obtenerUrlFoto';
import { useTheme } from '../../context/ThemeContext';

export interface UserAvatarProps {
  nombre?: string;
  apellido?: string;
  fotoUrl?: string | null;
  size?: number; // default 36
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  nombre,
  apellido,
  fotoUrl,
  size = 36,
  className = '',
}) => {
  const { isDark } = useTheme();
  const url = obtenerUrlFoto(fotoUrl);

  if (url) {
    return (
      <img
        src={url}
        alt={`Foto de ${nombre || 'usuario'}`}
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
  }

  const iniN = (nombre || '').trim()[0] || '';
  const iniA = (apellido || '').trim()[0] || '';
  if (!url && !iniN && !iniA) return null;
  const iniciales = (iniN + iniA).toUpperCase();
  const fontSize = `${Math.max(11, Math.round(size * 0.38))}px`;

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
