import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { mensajesDeTeoria, pistasDisponibles } from '../asistente/guion.js';
import { useControladorReto } from '../retos/useControladorReto.js';

const ARCHIVOS = { html: 'cartelera.html', css: 'estilos.css', js: 'script.js' };

export default function PanelReto({ reto, progreso, alSuperar, alSalir, marcoTablero, alRobot }) {
  const { codigo, parte, retro, superado, fallos, vistaPrevia, escribir, ejecutar, reiniciar } =
    useControladorReto({ reto, progreso, alSuperar });
  const [pistas, setPistas] = useState({ parte: 0, vistas: 0 });
  const titulo = useRef(null);
  const numeros = useRef(null);
  const actual = reto.partes[parte];
  const { teoria, consigna, ejemplo } = actual;
  const total = reto.partes.length;
  const lineas = codigo.split('\n').length;
  const lista = actual.pistas ?? [];
  const vistas = pistas.parte === parte ? pistas.vistas : 0;
  const disponibles = pistasDisponibles(actual, fallos);

  const presentar = useEffectEvent(() => {
    alRobot([
      {
        texto: 'Tu cartelera se proyecta en el tablero: cada cambio en el código se ve aquí.',
        expresion: 'feliz',
        gesto: 'saludar',
        etiqueta: reto.id,
      },
      ...mensajesDeTeoria(reto.partes[0], 1, total),
    ]);
  });

  const comentar = useEffectEvent((resultado) => {
    if (resultado.aprobado) {
      alRobot([
        { texto: resultado.mensajes[0], expresion: 'feliz', etiqueta: 'Parte superada' },
        ...mensajesDeTeoria(actual, parte + 1, total),
      ]);
      return;
    }
    alRobot([
      { texto: resultado.mensajes[0], expresion: 'preocupado', etiqueta: 'Revisa esto' },
      vistas < disponibles && {
        texto: 'Si te atascas, pídeme una pista con el botón Pedir pista.',
        expresion: 'pensar',
      },
    ]);
  });

  useEffect(() => {
    titulo.current?.focus();
    presentar();
  }, []);

  useEffect(() => {
    if (retro && !superado) comentar(retro);
  }, [retro, superado]);

  function pedirPista() {
    if (vistas >= disponibles) return;
    setPistas({ parte, vistas: vistas + 1 });
    alRobot({
      texto: lista[vistas],
      expresion: 'pensar',
      etiqueta: `Pista ${vistas + 1} de ${lista.length}`,
    });
  }

  return (
    <>
      <div ref={marcoTablero} className="tablero-vivo">
        <span className="tablero-etiqueta" aria-hidden="true">
          En vivo
        </span>
        <iframe
          ref={vistaPrevia}
          id="vista-previa"
          title="Vista previa de la cartelera, proyectada en el tablero"
        />
      </div>
      <aside className="panel" aria-labelledby="titulo-reto">
        <div className="panel-cabecera">
          <p className="lugar">{reto.lugar}</p>
          <button type="button" onClick={alSalir}>
            Volver al campus (Esc)
          </button>
        </div>
        <h1 id="titulo-reto" ref={titulo} tabIndex={-1}>
          <span className="chip-reto">{reto.id}</span> {reto.titulo}
        </h1>
        {total > 1 && (
          <ol className="pasos" aria-label="Partes del reto">
            {reto.partes.map((_, i) => (
              <li
                key={i}
                className={i < parte || superado ? 'hecho' : i === parte ? 'actual' : ''}
                aria-current={i === parte && !superado ? 'step' : undefined}
              >
                <span aria-hidden="true">{i < parte || superado ? '✓' : i + 1}</span>
                Parte {i + 1}
              </li>
            ))}
          </ol>
        )}
        <details className="tarjeta-reto teoria" open>
          <summary>Teoría</summary>
          <p>{teoria}</p>
          {ejemplo && (
            <div className="ejemplo-teoria">
              <p className="ejemplo-titulo">Ejemplo</p>
              <code>{ejemplo.antes}</code>
              <span className="visually-hidden">se cambia por</span>
              <code>{ejemplo.despues}</code>
            </div>
          )}
          <button
            type="button"
            className="secundario"
            onClick={() => alRobot(mensajesDeTeoria(actual, parte + 1, total))}
          >
            Que el robot la explique otra vez
          </button>
        </details>
        <details className="tarjeta-reto consigna" open>
          <summary>Qué debes hacer</summary>
          <p>{consigna}</p>
        </details>
        <div className="editor">
          <div className="editor-barra" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>{ARCHIVOS[reto.editable] ?? 'codigo.txt'}</span>
          </div>
          <div className="editor-cuerpo">
            <pre ref={numeros} className="editor-lineas" aria-hidden="true">
              {Array.from({ length: lineas }, (_, i) => i + 1).join('\n')}
            </pre>
            <label htmlFor="editor" className="visually-hidden">
              Código
            </label>
            <textarea
              id="editor"
              spellCheck={false}
              value={codigo}
              onChange={(evento) => escribir(evento.target.value)}
              onScroll={(evento) => {
                if (numeros.current) numeros.current.scrollTop = evento.target.scrollTop;
              }}
            />
          </div>
        </div>
        <div className="acciones">
          <button type="button" className="principal" onClick={ejecutar}>
            <span aria-hidden="true">▶</span> Ejecutar
          </button>
          <button type="button" onClick={reiniciar}>
            Reiniciar
          </button>
        </div>
        <div className="retroalimentacion" aria-live="polite">
          {retro?.mensajes.map((mensaje, i) => (
            <p key={i} className={retro.aprobado ? 'ok' : 'error'}>
              <span aria-hidden="true">{retro.aprobado ? '✓' : '✗'}</span> {mensaje}
            </p>
          ))}
        </div>
        {lista.length > 0 && !superado && (
          <section className="tarjeta-reto pistas" aria-labelledby="titulo-pistas">
            <h2 id="titulo-pistas">Pistas del robot</h2>
            <div aria-live="polite">
              {vistas > 0 && (
                <ol>
                  {lista.slice(0, vistas).map((pista) => (
                    <li key={pista}>{pista}</li>
                  ))}
                </ol>
              )}
            </div>
            <button type="button" onClick={pedirPista} disabled={vistas >= disponibles}>
              {vistas >= lista.length
                ? 'Ya tienes todas las pistas'
                : `Pedir pista ${vistas + 1} de ${lista.length}`}
            </button>
            {vistas < lista.length && vistas >= disponibles && (
              <p className="nota">La siguiente pista se desbloquea después de tu próximo intento.</p>
            )}
          </section>
        )}
      </aside>
    </>
  );
}
