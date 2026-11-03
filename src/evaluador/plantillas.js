/**
 * Evaluador basado en plantillas (RF-03). Cada reto declara criterios observables
 * (estructura del DOM, estilos calculados, texto) y se acepta cualquier solución que los cumpla.
 */
const comprobadores = {
  existe: (doc, c) => doc.querySelector(c.selector) !== null,
  'no-existe': (doc, c) => doc.querySelector(c.selector) === null,
  cantidad: (doc, c) => doc.querySelectorAll(c.selector).length === c.valor,
  texto: (doc, c) => (doc.querySelector(c.selector)?.textContent ?? '').includes(c.contiene),
  estilo: (doc, c, ventana) => {
    const elemento = doc.querySelector(c.selector);
    if (!elemento) return false;
    return ventana.getComputedStyle(elemento).getPropertyValue(c.propiedad).trim() === c.valor;
  },
};

export function evaluar(documento, criterios, ventana = documento.defaultView) {
  const resultados = criterios.map((criterio) => {
    const comprobar = comprobadores[criterio.tipo];
    if (!comprobar) throw new Error(`Tipo de criterio desconocido: ${criterio.tipo}`);
    return { criterio, cumple: comprobar(documento, criterio, ventana) };
  });
  return { aprobado: resultados.every((r) => r.cumple), resultados };
}
