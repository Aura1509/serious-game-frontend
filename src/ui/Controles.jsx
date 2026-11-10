const CONTROLES = [
  ['W A S D o flechas', 'Moverte por el campus'],
  ['Mantener Shift', 'Correr, o caminar si activaste Correr siempre'],
  ['Espacio', 'Saltar, o hablar si estás junto a una persona'],
  ['Arrastrar con el ratón, Q y E, o los botones Girar', 'Girar la cámara'],
  ['Rueda del ratón, o las teclas + y -', 'Acercar o alejar la cámara'],
  ['Enter', 'Interactuar o entrar a un aula'],
  ['Escape', 'Salir del reto o terminar una conversación'],
  ['R', 'Pedirle un consejo al robot'],
  ['H', 'Abrir la ayuda'],
  ['Botón Pausar animaciones', 'Detener el movimiento decorativo del campus'],
];

export default function Controles() {
  return (
    <>
      <dl className="controles">
        {CONTROLES.map(([tecla, accion]) => (
          <div key={tecla}>
            <dt>{tecla}</dt>
            <dd>{accion}</dd>
          </div>
        ))}
      </dl>
      <p className="nota">
        Las teclas funcionan cuando el campus tiene el foco: haz clic en él o llega con Tab.
      </p>
    </>
  );
}
