import { useSyncExternalStore } from 'react';

const consulta = typeof window === 'undefined' ? null : window.matchMedia('(prefers-reduced-motion: reduce)');

function suscribir(avisar) {
  consulta?.addEventListener('change', avisar);
  return () => consulta?.removeEventListener('change', avisar);
}

export function useReducirMovimiento() {
  return useSyncExternalStore(
    suscribir,
    () => consulta?.matches ?? false,
    () => false,
  );
}
