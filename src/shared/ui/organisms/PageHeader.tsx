import React from 'react';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode; // botones a la derecha
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3 ${className}`.trim()}
    >
      <div className="min-w-0">
        {eyebrow && <span className="text-eyebrow mb-2 d-block text-truncate">{eyebrow}</span>}
        <h1 className="h2 title-fluid-h2 fw-bold mb-1 text-break">{title}</h1>
        {subtitle && <p className="text-muted mb-0 text-break">{subtitle}</p>}
      </div>
      {actions && (
        <div className="d-flex align-items-center gap-2 pt-1 w-100 w-sm-auto flex-wrap">{actions}</div>
      )}
    </div>
  );
};

export default PageHeader;
