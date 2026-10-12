import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import KyriosSpinner from './KyriosSpinner';

export interface AccionItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  to?: string;
  linkState?: Record<string, unknown>;
  variant?: 'normal' | 'danger' | 'warning' | 'primary' | 'success';
  disabled?: boolean;
  isLoading?: boolean;
  title?: string;
}

export interface AccionesDropdownProps {
  label: string;
  icon: React.ReactNode;
  buttonVariant?: string;
  items: (AccionItem | null | false | undefined)[];
}

export const AccionesDropdown: React.FC<AccionesDropdownProps> = ({
  label,
  icon,
  buttonVariant = 'btn-outline-secondary',
  items,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeItems = items.filter(Boolean) as AccionItem[];

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (activeItems.length === 0) return null;

  return (
    <div className="position-relative d-inline-block text-start" ref={containerRef}>
      <button
        type="button"
        className={`btn btn-sm ${buttonVariant} d-inline-flex align-items-center gap-1 fw-semibold`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        title={label}
      >
        {icon}
        <span className="d-none d-sm-inline">{label}</span>
        <ChevronDown
          size={13}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {isOpen && (
        <div
          className="position-absolute end-0 mt-1 py-1 card-surface border rounded shadow-lg"
          style={{
            zIndex: 1060,
            minWidth: '210px',
            animation: 'fadeInMenu 120ms ease-out',
          }}
        >
          {activeItems.map((item) => {
            const content = (
              <>
                <span
                  className="d-inline-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '20px' }}
                >
                  {item.isLoading ? (
                    <KyriosSpinner size="xs" aria-hidden="true" />
                  ) : (
                    item.icon
                  )}
                </span>
                <span className="small text-nowrap">{item.label}</span>
              </>
            );

            const getTextColor = () => {
              if (item.disabled) return 'text-muted';
              if (item.variant === 'danger') return 'text-danger';
              if (item.variant === 'warning') return 'text-warning-emphasis';
              if (item.variant === 'primary') return 'text-primary';
              if (item.variant === 'success') return 'text-success';
              return 'text-surface-card';
            };

            const className = `dropdown-item d-flex align-items-center gap-2 py-2 px-3 border-0 bg-transparent text-start w-100 ${getTextColor()} ${
              item.disabled ? 'disabled opacity-50' : ''
            }`;

            if (item.to && !item.disabled) {
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  state={item.linkState}
                  className={className}
                  onClick={() => setIsOpen(false)}
                  title={item.title || item.label}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                className={className}
                disabled={item.disabled || item.isLoading}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                title={item.title || item.label}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AccionesDropdown;
