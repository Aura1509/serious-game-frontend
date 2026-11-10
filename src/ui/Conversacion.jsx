import { useEffect, useRef, useState } from 'react';

export function Escrito({ texto, animar, paso = 2 }) {
  const [visibles, setVisibles] = useState(animar ? 0 : texto.length);

  useEffect(() => {
    if (!animar) return undefined;
    const intervalo = setInterval(() => {
      setVisibles((actual) => {
        if (actual >= texto.length) {
          clearInterval(intervalo);
          return actual;
        }
        return actual + paso;
      });
    }, 22);
    return () => clearInterval(intervalo);
  }, [texto, animar, paso]);

  return <span aria-hidden="true">{texto.slice(0, visibles)}</span>;
}

export default function Conversacion({ persona, linea, color, animar, alSiguiente, alTerminar }) {
  const boton = useRef(null);
  const ultima = linea >= persona.lineas.length - 1;
  const texto = persona.lineas[linea];

  useEffect(() => {
    boton.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section
      className={animar ? 'vineta vineta-animada' : 'vineta'}
      role="dialog"
      aria-labelledby="titulo-conversacion"
      aria-describedby="texto-conversacion"
    >
      <h2 id="titulo-conversacion" className="vineta-nombre" style={{ '--acento': color }}>
        {persona.nombre}
        <span className="rol">{persona.rol}</span>
      </h2>
      <p className="vineta-texto">
        <Escrito key={linea} texto={texto} animar={animar} />
        <span id="texto-conversacion" className="visually-hidden" aria-live="polite">
          {texto}
        </span>
      </p>
      <div className="vineta-acciones">
        <button ref={boton} type="button" className="principal" onClick={ultima ? alTerminar : alSiguiente}>
          {ultima ? 'Terminar' : 'Siguiente'}
        </button>
        {!ultima && (
          <button type="button" onClick={alTerminar}>
            Terminar (Esc)
          </button>
        )}
        <span className="vineta-progreso" aria-hidden="true">
          {persona.lineas.map((_, i) => (
            <i key={i} className={i <= linea ? 'leido' : ''} />
          ))}
        </span>
      </div>
    </section>
  );
}
