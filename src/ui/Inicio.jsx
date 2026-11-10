import { useEffect, useRef } from 'react';
import Controles from './Controles.jsx';

export default function Inicio({ cargando, porcentaje, superados, alEmpezar }) {
  const boton = useRef(null);

  useEffect(() => {
    if (!cargando) boton.current?.focus();
  }, [cargando]);

  return (
    <section className="inicio" aria-labelledby="titulo-juego">
      <div className="tarjeta">
        <p className="lugar">Universidad del Valle, Facultad de Ingeniería</p>
        <h1 id="titulo-juego">Serious game Web 3D</h1>
        <p>
          Recorre el campus con tu avatar, entra al aula 1 del edificio HTML y ayuda a construir la cartelera
          web de la Facultad.
        </p>
        <h2 className="subtitulo">Controles</h2>
        <Controles />
        {superados.length > 0 && <p>Retos superados en este navegador: {superados.join(', ')}.</p>}
        <p aria-live="polite">
          {cargando ? `Cargando el campus: ${Math.round(porcentaje)} %` : 'El campus está listo.'}
        </p>
        <button ref={boton} type="button" className="principal" disabled={cargando} onClick={alEmpezar}>
          Empezar
        </button>
      </div>
    </section>
  );
}
