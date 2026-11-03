/**
 * Panel del reto (RF-01, RF-05): instrucciones siempre visibles, editor y retroalimentación.
 */
export function crearPanel(doc) {
  const $ = (id) => doc.getElementById(id);
  const parrafo = (texto, clase) => {
    const p = doc.createElement('p');
    p.textContent = texto;
    if (clase) p.className = clase;
    return p;
  };
  return {
    mostrarReto(reto) {
      $('lugar-reto').textContent = reto.lugar;
      $('titulo-reto').textContent = `${reto.id} · ${reto.titulo}`;
      $('teoria').replaceChildren(parrafo(reto.teoria));
      $('editor').value = reto.base[reto.editable];
      $('retroalimentacion').replaceChildren();
    },
    obtenerCodigo: () => $('editor').value,
    ponerCodigo: (codigo) => ($('editor').value = codigo),
    mostrarResultado({ aprobado, mensajes }) {
      $('retroalimentacion').replaceChildren(
        ...mensajes.map((m) => parrafo(`${aprobado ? '✓' : '✗'} ${m}`, aprobado ? 'ok' : 'error')),
      );
    },
    alEjecutar: (fn) => $('ejecutar').addEventListener('click', fn),
    alReiniciar: (fn) => $('reiniciar').addEventListener('click', fn),
  };
}
