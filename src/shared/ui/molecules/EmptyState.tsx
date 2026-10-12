import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`alert-surface text-center py-5 px-3 text-surface-muted border rounded ${className}`.trim()}
    >
      {icon && (
        <div className="mb-3 text-surface-muted d-flex justify-content-center" style={{ opacity: 0.6 }}>
          {icon}
        </div>
      )}
      <p className="mb-2 fs-6 fw-semibold text-surface-card">{title}</p>
      {description && <p className="mb-3 small">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
