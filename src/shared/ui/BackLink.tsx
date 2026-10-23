import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, type LinkProps } from 'react-router-dom';

interface BackLinkProps {
  to: LinkProps['to'];
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/** Enlace de regreso consistente para las páginas del panel y del flujo público. */
export default function BackLink({ to, children, className = '', onClick }: BackLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`btn btn-outline-secondary d-inline-flex align-items-center gap-2 ${className}`.trim()}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      <span>{children}</span>
    </Link>
  );
}
