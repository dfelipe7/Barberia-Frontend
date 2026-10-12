import React from 'react';

export interface DataTableWithMobileProps<_T = unknown> {
  isMobile: boolean;
  desktop: React.ReactNode; // tabla
  mobile: React.ReactNode; // cards
  className?: string;
}

export function DataTableWithMobile<_T = unknown>({
  isMobile,
  desktop,
  mobile,
  className = '',
}: DataTableWithMobileProps<_T>): React.ReactElement {
  return (
    <div
      key={isMobile ? 'mobile' : 'desktop'}
      className={`${isMobile ? 'mobile-cards-container' : 'table-view-container'} ${className}`.trim()}
      style={{ animation: 'fadeInTableView 150ms ease-out' }}
    >
      {isMobile ? mobile : desktop}
    </div>
  );
}

export default DataTableWithMobile;
