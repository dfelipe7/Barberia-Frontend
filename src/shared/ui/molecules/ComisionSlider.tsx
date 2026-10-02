import React, { useCallback, useEffect, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import './ComisionSlider.css';

interface ComisionSliderProps {
  id: string;
  /** Valor actual reflejado desde watch() del formulario */
  valorActual: number;
  /** Props del register de react-hook-form (con valueAsNumber: true) */
  registerProps: UseFormRegisterReturn;
  error?: string;
  disabled?: boolean;
}

const HOLD_DELAY_MS = 400;   // ms antes de activar el auto-repeat
const HOLD_INTERVAL_MS = 80; // ms entre pasos en auto-repeat

export const ComisionSlider: React.FC<ComisionSliderProps> = ({
  id,
  valorActual,
  registerProps,
  error,
  disabled = false,
}) => {
  const sliderRef = useRef<HTMLInputElement | null>(null);
  const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Actualiza el valor disparando los eventos nativos que RHF escucha */
  const applyChange = useCallback((next: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(next)));
    if (sliderRef.current) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )?.set;
      nativeSetter?.call(sliderRef.current, String(clamped));
      sliderRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      sliderRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, []);

  const clearHold = useCallback(() => {
    if (holdTimeout.current) clearTimeout(holdTimeout.current);
    if (holdInterval.current) clearInterval(holdInterval.current);
    holdTimeout.current = null;
    holdInterval.current = null;
  }, []);

  const startHold = useCallback(
    (delta: number) => {
      if (disabled) return;
      // Capturar valor actual en el momento del press
      const current = sliderRef.current ? Number(sliderRef.current.value) : valorActual;
      let running = current;

      applyChange(running + delta);
      running += delta;

      holdTimeout.current = setTimeout(() => {
        holdInterval.current = setInterval(() => {
          running += delta;
          applyChange(running);
        }, HOLD_INTERVAL_MS);
      }, HOLD_DELAY_MS);
    },
    [applyChange, valorActual, disabled],
  );

  useEffect(() => () => clearHold(), [clearHold]);

  /** Handler para el input numérico manual */
  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    if (!isNaN(raw)) applyChange(raw);
  };

  const safeValue = isNaN(valorActual) ? 0 : valorActual;

  // Separar ref de RHF del resto de props para fusionar con el nuestro
  const { ref: rhfRef, ...restRegister } = registerProps;

  return (
    <div className="comision-slider-root">
      {/* Etiqueta con badge de valor */}
      <label htmlFor={id} className="form-label fw-semibold mb-2 d-block">
        Porcentaje de comisión&nbsp;
        <span className="comision-slider__badge">{safeValue}%</span>
      </label>

      {/* Fila: − · slider · + · input numérico */}
      <div className="comision-slider__row" role="group" aria-label="Control de comisión">

        {/* Botón − */}
        <button
          type="button"
          className="comision-slider__step-btn"
          aria-label="Reducir comisión en 1%"
          disabled={disabled || safeValue <= 0}
          onMouseDown={() => startHold(-1)}
          onMouseUp={clearHold}
          onMouseLeave={clearHold}
          onTouchStart={() => startHold(-1)}
          onTouchEnd={clearHold}
        >
          <Minus size={14} strokeWidth={2.5} aria-hidden="true" />
        </button>

        {/* Slider */}
        <input
          id={id}
          type="range"
          className="comision-slider__range"
          min={0}
          max={100}
          step={1}
          disabled={disabled}
          aria-label="Porcentaje de comisión"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={safeValue}
          style={{ '--progress': `${safeValue}%` } as React.CSSProperties}
          {...restRegister}
          ref={(el) => {
            sliderRef.current = el;
            if (typeof rhfRef === 'function') rhfRef(el);
            else if (rhfRef)
              (rhfRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
          }}
        />

        {/* Botón + */}
        <button
          type="button"
          className="comision-slider__step-btn"
          aria-label="Aumentar comisión en 1%"
          disabled={disabled || safeValue >= 100}
          onMouseDown={() => startHold(1)}
          onMouseUp={clearHold}
          onMouseLeave={clearHold}
          onTouchStart={() => startHold(1)}
          onTouchEnd={clearHold}
        >
          <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
        </button>

        {/* Input numérico complementario con sufijo % */}
        <div className="comision-slider__number-wrap">
          <input
            type="number"
            className={`form-control form-control-sm comision-slider__number-input${
              error ? ' is-invalid' : ''
            }`}
            min={0}
            max={100}
            step={1}
            value={safeValue}
            disabled={disabled}
            aria-label="Porcentaje de comisión (entrada manual)"
            onChange={handleNumberInput}
          />
          <span className="comision-slider__pct-suffix" aria-hidden="true">%</span>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="text-danger small mt-2" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default ComisionSlider;
