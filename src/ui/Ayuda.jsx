import { useEffect, useRef } from 'react';
import { hayVoz } from '../asistente/useAsistente.js';
import Controles from './Controles.jsx';

const CON_VOZ = hayVoz();

export default function Ayuda({ abierta, alCerrar, opciones, alCambiarOpcion }) {
  const dialogo = useRef(null);

  useEffect(() => {
    const actual = dialogo.current;
    if (abierta && !actual.open) {
      actual.showModal();
      actual.querySelector('h2')?.focus();
    }
    if (!abierta && actual.open) actual.close();
  }, [abierta]);

  return (
    <dialog ref={dialogo} className="ayuda" aria-labelledby="titulo-ayuda" onClose={alCerrar}>
      <h2 id="titulo-ayuda" tabIndex={-1}>
        Cómo se juega
      </h2>
      <p>
        Recorre el campus y acércate a las puertas y a las aulas. Cuando aparezca un aviso en la parte de
        abajo, pulsa Enter. La columna de luz amarilla marca tu próximo destino, y el robot que vuela a tu
        lado te da consejos, la teoría de cada reto y pistas.
      </p>
      <Controles />
      <fieldset className="opciones">
        <legend>Opciones</legend>
        <label>
          <input
            type="checkbox"
            checked={opciones.correr}
            onChange={(evento) => alCambiarOpcion('correr', evento.target.checked)}
          />
          Correr siempre. Con Shift caminas.
        </label>
        <label>
          <input
            type="checkbox"
            checked={opciones.ligera}
            onChange={(evento) => alCambiarOpcion('ligera', evento.target.checked)}
          />
          Gráficos ligeros: menos sombras y efectos, para equipos lentos.
        </label>
        <label>
          <input
            type="checkbox"
            checked={opciones.consejos}
            onChange={(evento) => alCambiarOpcion('consejos', evento.target.checked)}
          />
          Consejos del robot mientras exploras. Con R puedes pedirle uno cuando quieras.
        </label>
        <label>
          <input
            type="checkbox"
            checked={opciones.voz && CON_VOZ}
            disabled={!CON_VOZ}
            onChange={(evento) => alCambiarOpcion('voz', evento.target.checked)}
          />
          {CON_VOZ
            ? 'Voz del robot: lee en voz alta lo que dice, con la voz del navegador.'
            : 'Voz del robot: este navegador no tiene voz disponible.'}
        </label>
      </fieldset>
      <button type="button" className="principal" onClick={alCerrar}>
        Cerrar la ayuda
      </button>
    </dialog>
  );
}
