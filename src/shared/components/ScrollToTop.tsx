import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Restaura el scroll al top en cada cambio de ruta de tipo PUSH o REPLACE,
 * preservando el comportamiento nativo de back/forward (POP).
 *
 * Excepciones:
 * - navegationType === 'POP': el navegador restaura el scroll guardado,
 *   no interferimos.
 * - hash en la URL (ej. /#ubicacion): el navegador hace scroll al anchor,
 *   no interferimos.
 *
 * Se monta una sola vez en el árbol del Router (en main.tsx).
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // back/forward: respeta el scroll guardado por el navegador
    if (navigationType === 'POP') return;

    // hash en la URL: el navegador se encarga del scroll al anchor
    if (hash) return;

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash, navigationType]);

  return null;
}

export default ScrollToTop;
