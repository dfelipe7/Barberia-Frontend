import React from 'react';
import KyriosSpinner from './KyriosSpinner';

export interface SpinnerProps {
  mensaje?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner: React.FC<SpinnerProps> = ({
  mensaje = 'Cargando...',
  className = 'py-5',
  size = 'md',
}) => {
  return (
    <div className={`d-flex justify-content-center align-items-center ${className}`.trim()}>
      <KyriosSpinner size={size} mensaje={mensaje} variant="inline" />
    </div>
  );
};

export default Spinner;
