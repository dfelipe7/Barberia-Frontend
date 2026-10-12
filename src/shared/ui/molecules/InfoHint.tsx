import React from 'react';

export interface InfoHintProps {
  children: React.ReactNode;
  className?: string;
}

export const InfoHint: React.FC<InfoHintProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`alert alert-light border d-flex align-items-center gap-2 small shadow-sm ${className}`.trim()}
      role="note"
    >
      <span className="fs-5 flex-shrink-0" aria-hidden="true">
        💡
      </span>
      <span>{children}</span>
    </div>
  );
};

export default InfoHint;
