import { useEffect, useState } from 'react';
import { NOMBRE_ROBOT } from '../asistente/guion.js';
import { Escrito } from './Conversacion.jsx';

function Ejemplo({ ejemplo, animar }) {
  const [cambiado, setCambiado] = useState(!animar);

  useEffect(() => {
    if (!animar) return undefined;
    const reloj = setTimeout(() => setCambiado(true), 1400);
    return () => clearTimeout(reloj);
  }, [animar]);

  return (
    <div className={cambiado ? 'ejemplo-robot cambiado' : 'ejemplo-robot'}>
      <code className="antes">{ejemplo.antes}</code>
      <code className="despues">{ejemplo.despues}</code>
    </div>
  );
}

export default function VinetaRobot({ mensaje, animar, izquierda, ref }) {
  const clases = ['vineta', 'vineta-robot', izquierda && 'a-la-izquierda', animar && 'vineta-animada'];

  return (
    <div ref={ref} key={mensaje.id} className={clases.filter(Boolean).join(' ')} aria-hidden="true">
      <p className="vineta-nombre">
        {NOMBRE_ROBOT}
        {mensaje.etiqueta && <span className="rol">{mensaje.etiqueta}</span>}
      </p>
      <p className="vineta-texto">
        <Escrito texto={mensaje.texto} animar={animar} paso={1} />
      </p>
      {mensaje.ejemplo && <Ejemplo ejemplo={mensaje.ejemplo} animar={animar} />}
    </div>
  );
}
