import React from 'react';

export interface StatusBadgeProps {
  estado: 'ACTIVO' | 'INACTIVO';
  tone?: 'role' | 'global' | 'sede'; // 'role': Activo/Inactivo | 'global': Habilitada/Bloqueada | 'sede': Activo/Inactivo
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  estado,
  tone = 'role',
  className = '',
}) => {
  const isActivo = estado === 'ACTIVO';
  const isGlobal = tone === 'global';

  const bgClass = isActivo
    ? 'bg-success text-white'
    : isGlobal
    ? 'bg-danger text-white'
    : 'bg-secondary text-white';

  const label = isGlobal
    ? isActivo
      ? 'Habilitada'
      : 'Bloqueada'
    : isActivo
    ? 'Activo'
    : 'Inactivo';

  return (
    <span className={`badge ${bgClass} fw-semibold ${className}`.trim()}>
      {label}
    </span>
  );
};

export default StatusBadge;
