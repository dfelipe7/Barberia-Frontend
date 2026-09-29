import React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface ComisionSliderProps {
  id: string;
  valorActual: number;
  registerProps: UseFormRegisterReturn;
  error?: string;
  disabled?: boolean;
}

export const ComisionSlider: React.FC<ComisionSliderProps> = ({
  id,
  valorActual,
  registerProps,
  error,
  disabled,
}) => (
  <div>
    <label htmlFor={id} className="form-label fw-semibold">
      Porcentaje de comisión: <span className="fw-bold">{valorActual}%</span>
    </label>
    <input
      id={id}
      type="range"
      className="form-range"
      min={0}
      max={100}
      step={5}
      disabled={disabled}
      {...registerProps}
    />
    {error && <div className="text-danger small mt-1">{error}</div>}
  </div>
);

export default ComisionSlider;
