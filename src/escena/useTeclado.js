import { useEffect, useRef } from 'react';

export function useTeclado(contenedor, activo) {
  const teclas = useRef(new Set());

  useEffect(() => {
    const conjunto = teclas.current;
    const elemento = contenedor.current;
    if (!activo || !elemento) {
      conjunto.clear();
      return undefined;
    }
    const presionar = (evento) => {
      if (evento.ctrlKey || evento.metaKey || evento.altKey) return;
      if (evento.code.startsWith('Arrow') || evento.code === 'Space') evento.preventDefault();
      conjunto.add(evento.code);
      if (evento.key === '+' || evento.key === '-') conjunto.add(evento.key);
    };
    const soltar = (evento) => {
      conjunto.delete(evento.code);
      conjunto.delete(evento.key);
    };
    const limpiar = () => conjunto.clear();
    const alOcultar = () => {
      if (document.hidden) conjunto.clear();
    };
    elemento.addEventListener('keydown', presionar);
    elemento.addEventListener('blur', limpiar);
    window.addEventListener('keyup', soltar);
    window.addEventListener('blur', limpiar);
    document.addEventListener('visibilitychange', alOcultar);
    return () => {
      elemento.removeEventListener('keydown', presionar);
      elemento.removeEventListener('blur', limpiar);
      window.removeEventListener('keyup', soltar);
      window.removeEventListener('blur', limpiar);
      document.removeEventListener('visibilitychange', alOcultar);
      conjunto.clear();
    };
  }, [contenedor, activo]);

  return teclas;
}
