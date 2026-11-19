import React from 'react';

export interface StatusBadgeProps {
  estado: 'ACTIVO' | 'INACTIVO';
  tone?: 'role' | 'global' | 'sede'; // 'role': Activo/Inactivo | 'global': Habilitada/Bloqueada | 'sede': Activo/Inactivo
  className?: string;
}

function getStatusBadgeBgClass(isActivo: boolean, isGlobal: boolean): string {
  if (isActivo) return 'bg-success text-white';
  if (isGlobal) return 'bg-danger text-white';
  return 'bg-secondary text-white';
}

function getStatusBadgeLabel(isActivo: boolean, isGlobal: boolean): string {
  if (isGlobal) {
    return isActivo ? 'Habilitada' : 'Bloqueada';
  }
  return isActivo ? 'Activo' : 'Inactivo';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  estado,
  tone = 'role',
  className = '',
}) => {
  const isActivo = estado === 'ACTIVO';
  const isGlobal = tone === 'global';

  const bgClass = getStatusBadgeBgClass(isActivo, isGlobal);
  const label = getStatusBadgeLabel(isActivo, isGlobal);

  return (
    <span className={`badge ${bgClass} fw-semibold ${className}`.trim()}>
      {label}
    </span>
  );
};

export default StatusBadge;
