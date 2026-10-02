import { useEffect, useState } from 'react';

/**
 * Hook para retrasar la actualización de un valor (debounce).
 * Evita disparar peticiones HTTP o cálculos pesados en cada keystroke.
 *
 * @param value Valor reactivo a retrasar
 * @param delayMs Tiempo de espera en milisegundos (por defecto 350ms)
 * @returns El valor debounced
 */
export function useDebounce<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export default useDebounce;
