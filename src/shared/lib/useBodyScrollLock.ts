import { useEffect } from 'react';

/**
 * Hook para bloquear el scroll del elemento body cuando un modal o drawer está abierto,
 * restaurando el estado original al cerrarse o desmontarse.
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [locked]);
}

export default useBodyScrollLock;
