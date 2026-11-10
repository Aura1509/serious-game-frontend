export default function Hud({
  zona,
  objetivo,
  accion,
  alInteractuar,
  alAyuda,
  alPedirConsejo,
  alGirar,
  alVolverAlJuego,
  pausa,
  pausaDelSistema,
  alAlternarPausa,
}) {
  const conRetorno = (accionDelBoton) => (evento) => {
    accionDelBoton();
    if (evento.detail > 0) alVolverAlJuego();
  };

  return (
    <div className="hud">
      <section className="hud-estado" aria-label="Estado del recorrido">
        <p className="hud-lugar">{zona ? `Estás en ${zona}.` : 'Estás en el campus.'}</p>
        <p>
          <strong>Objetivo:</strong> {objetivo}
        </p>
      </section>
      {accion && (
        <div className="hud-accion">
          <button type="button" onClick={alInteractuar}>
            <span className="tecla">{accion.startsWith('Hablar') ? 'Espacio o Enter' : 'Enter'}</span>{' '}
            {accion}
          </button>
        </div>
      )}
      <div className="hud-controles">
        <button type="button" onClick={alAyuda}>
          Ayuda y opciones (H)
        </button>
        <button type="button" onClick={conRetorno(alPedirConsejo)}>
          Pedir un consejo al robot (R)
        </button>
        <button type="button" onClick={conRetorno(() => alGirar(1))}>
          Girar a la izquierda
        </button>
        <button type="button" onClick={conRetorno(() => alGirar(-1))}>
          Girar a la derecha
        </button>
        <button type="button" onClick={conRetorno(alAlternarPausa)} disabled={pausaDelSistema}>
          {pausaDelSistema
            ? 'Animaciones en pausa por tu sistema'
            : pausa
              ? 'Reanudar animaciones'
              : 'Pausar animaciones'}
        </button>
      </div>
    </div>
  );
}
