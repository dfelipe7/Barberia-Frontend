import React from 'react';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message = 'Ocurrió un error inesperado al procesar la solicitud.',
  onRetry,
  className = 'my-3',
}) => {
  if (!message) return null;

  return (
    <div className={`alert alert-danger d-flex align-items-center justify-content-between ${className}`} role="alert">
      <div>
        <span className="me-2">⚠️</span>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          className="btn btn-outline-danger btn-sm ms-3"
          onClick={onRetry}
        >
          Reintentar
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
