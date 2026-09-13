import React from 'react';

interface SpinnerProps {
  mensaje?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner: React.FC<SpinnerProps> = ({
  mensaje = 'Cargando...',
  className = 'py-5',
  size = 'md',
}) => {
  const spinnerClass = size === 'sm' ? 'spinner-border-sm' : '';

  return (
    <div className={`d-flex justify-content-center align-items-center ${className}`}>
      <div className={`spinner-border ${spinnerClass} text-primary`} role="status">
        <span className="visually-hidden">{mensaje}</span>
      </div>
      {mensaje && <span className="ms-3 text-muted">{mensaje}</span>}
    </div>
  );
};

export default Spinner;
