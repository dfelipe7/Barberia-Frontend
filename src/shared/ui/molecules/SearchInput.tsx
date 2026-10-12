import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import KyriosSpinner from '../KyriosSpinner';
import { useDebounce } from '../../lib/useDebounce';

export interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  isSearching?: boolean; // muestra spinner inline
  delay?: number; // 350 default
  onDebouncedChange?: (v: string) => void; // opcional
  className?: string;
  ariaLabel?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder,
  isSearching,
  delay = 350,
  onDebouncedChange,
  className = '',
  ariaLabel = 'Buscar',
}) => {
  const debouncedValue = useDebounce(value, delay);

  useEffect(() => {
    if (onDebouncedChange) {
      onDebouncedChange(debouncedValue);
    }
  }, [debouncedValue, onDebouncedChange]);

  const searching =
    isSearching !== undefined
      ? isSearching
      : Boolean(onDebouncedChange) && value !== debouncedValue;

  return (
    <div className={`search-input-wrapper ${className}`.trim()}>
      <div className="position-relative">
        <input
          type="text"
          className="form-control pe-5"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}
          aria-label={ariaLabel}
        />

        {searching ? (
          <div
            className="position-absolute end-0 top-50 translate-middle-y me-3 d-flex align-items-center"
            style={{ pointerEvents: 'none' }}
            title="Buscando..."
          >
            <KyriosSpinner size="xs" aria-hidden="true" />
          </div>
        ) : value.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="btn btn-link p-0 position-absolute end-0 top-50 translate-middle-y me-3 d-flex align-items-center text-surface-muted text-decoration-none"
            aria-label="Limpiar búsqueda"
            style={{ border: 'none', background: 'none' }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {searching && (
        <div
          className="text-surface-muted small mt-1 ms-1 search-input-status"
          style={{ fontSize: '0.75rem', animation: 'fadeInSpinner 120ms ease-out' }}
          aria-live="polite"
        >
          Buscando...
        </div>
      )}
    </div>
  );
};

export default SearchInput;
