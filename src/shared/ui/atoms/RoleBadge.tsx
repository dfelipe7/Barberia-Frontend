import React from 'react';
import { ROL_COLORS, type Rol } from '../../constants/roles';

export interface RoleBadgeProps {
  rol: string;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ rol, className = '' }) => {
  const color = ROL_COLORS[rol as Rol] || 'secondary';
  const textColor = color === 'warning' || color === 'info' ? 'text-dark' : '';

  return (
    <span className={`badge bg-${color} ${textColor} ${className}`.trim()}>
      {rol}
    </span>
  );
};

export default RoleBadge;
