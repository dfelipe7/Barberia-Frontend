import React from 'react';

export interface StatusBadgeProps {
  estado: 'ACTIVO' | 'INACTIVO';
  tone?: 'role' | 'global'; // 'role': Activo/Inactivo | 'global': Habilitada/Bloqueada
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
    ? 'bg-success'
    : isGlobal
    ? 'bg-danger'
    : 'bg-secondary';

  const label = isGlobal
    ? isActivo
      ? 'Habilitada'
      : 'Bloqueada'
    : isActivo
    ? 'Activo'
    : 'Inactivo';

  return (
    <span className={`badge ${bgClass} ${className}`.trim()}>
      {label}
    </span>
  );
};

export default StatusBadge;
