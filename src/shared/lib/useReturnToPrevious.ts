import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface ReturnOptions {
  /** Ruta por defecto si no hay historial útil (location.state.from) */
  fallbackTo: string;
  /** State adicional para la ruta destino (ej. mensaje de éxito) */
  state?: Record<string, unknown>;
}

/**
 * Navega al origen real del usuario (location.state.from) si existe;
 * si no, al fallback indicado.
 *
 * Usa `replace: true` para no apilar entradas basura en el historial
 * del navegador (patrón Emil Kowalski).
 */
export function useReturnToPrevious() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    ({ fallbackTo, state }: ReturnOptions) => {
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? fallbackTo, { state, replace: true });
    },
    [navigate, location.state],
  );
}
