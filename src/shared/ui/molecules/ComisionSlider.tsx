import React, { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import './ComisionSlider.css';

export interface ComisionSliderProps {
  id: string;
  /** Valor actual reflejado desde watch() del formulario */
  valorActual: number;
  /** Props del register de react-hook-form (con valueAsNumber: true) */
  registerProps: UseFormRegisterReturn;
  /** Callback opcional para botones de paso (+/-) */
  onChange?: (n: number) => void;
  error?: string;
  disabled?: boolean;
}

export const ComisionSlider: React.FC<ComisionSliderProps> = ({
  id,
  valorActual,
  registerProps,
  onChange,
  error,
  disabled = false,
}) => {
  const safeValue = Number.isNaN(valorActual) || valorActual === undefined ? 0 : valorActual;
  const [hasChanged, setHasChanged] = useState(false);
  const prevValueRef = useRef(safeValue);

  // Microinteracción sutil de pulso al cambiar el valor (Emil Kowalski)
  useEffect(() => {
    if (prevValueRef.current !== safeValue) {
      prevValueRef.current = safeValue;
      setHasChanged(true);
      const timer = setTimeout(() => setHasChanged(false), 200);
      return () => clearTimeout(timer);
    }
  }, [safeValue]);

  return (
    <div className="comision-slider w-100">
      {/* Fila superior: label + valor con wrap para evitar desbordes en cualquier resolución */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <label
          htmlFor={id}
          className="form-label fw-semibold mb-0 comision-slider__label"
        >
          Porcentaje de comisión
        </label>
        <span
          className={`comision-slider__value badge bg-primary bg-opacity-10 text-primary fw-bold ${
            hasChanged ? 'changed' : ''
          }`}
          aria-live="polite"
        >
          {safeValue}%
        </span>
      </div>

      {/* Fila inferior: botones de ajuste fino (si se provee onChange) + slider a ancho completo */}
      <div className="d-flex align-items-center gap-2">
        {onChange && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary comision-slider__step-btn"
            onClick={() => onChange(Math.max(0, safeValue - 1))}
            disabled={disabled || safeValue <= 0}
            aria-label="Reducir comisión en 1%"
            title="Reducir 1%"
          >
            <Minus size={14} strokeWidth={2.5} />
          </button>
        )}

        <input
          id={id}
          type="range"
          className="form-range flex-grow-1"
          min={0}
          max={100}
          step={1}
          disabled={disabled}
          aria-label="Porcentaje de comisión"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={safeValue}
          {...registerProps}
        />

        {onChange && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary comision-slider__step-btn"
            onClick={() => onChange(Math.min(100, safeValue + 1))}
            disabled={disabled || safeValue >= 100}
            aria-label="Aumentar comisión en 1%"
            title="Aumentar 1%"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {error && (
        <div className="text-danger small mt-1" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default ComisionSlider;
