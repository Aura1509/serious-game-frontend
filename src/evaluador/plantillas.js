/**
 * Evaluador basado en plantillas (RF-03). Cada reto declara criterios observables
 * (estructura del DOM, estilos calculados, texto) y se acepta cualquier solución que los cumpla.
 */
const plantillas = {
  existe: {
    campos: ['selector'],
    comprobar: (doc, c) => doc.querySelector(c.selector) !== null,
  },
  'no-existe': {
    campos: ['selector'],
    comprobar: (doc, c) => doc.querySelector(c.selector) === null,
  },
  cantidad: {
    campos: ['selector', 'valor'],
    comprobar: (doc, c) => doc.querySelectorAll(c.selector).length === c.valor,
  },
  texto: {
    campos: ['selector', 'contiene'],
    comprobar: (doc, c) => (doc.querySelector(c.selector)?.textContent ?? '').includes(c.contiene),
  },
  estilo: {
    campos: ['selector', 'propiedad', 'valor'],
    comprobar: (doc, c, ventana) => {
      const elemento = doc.querySelector(c.selector);
      if (!elemento) return false;
      return ventana.getComputedStyle(elemento).getPropertyValue(c.propiedad).trim() === c.valor;
    },
  },
  contenedor: {
    campos: ['selector', 'contiene', 'etiqueta'],
    comprobar: (doc, c) => {
      const elemento = [...doc.querySelectorAll(c.selector)].find((e) => e.textContent.includes(c.contiene));
      return elemento?.parentElement?.closest('article, section, div')?.localName === c.etiqueta;
    },
  },
};

export function validarCriterio(criterio) {
  const plantilla = plantillas[criterio.tipo];
  if (!plantilla) return `tipo de criterio desconocido: ${criterio.tipo}`;
  if (!criterio.mensaje) return `el criterio ${criterio.tipo} no tiene mensaje`;
  const faltan = plantilla.campos.filter((campo) => criterio[campo] === undefined);
  return faltan.length ? `al criterio ${criterio.tipo} le faltan: ${faltan.join(', ')}` : null;
}

export function evaluar(documento, criterios, ventana = documento.defaultView) {
  const resultados = criterios.map((criterio) => {
    const plantilla = plantillas[criterio.tipo];
    if (!plantilla) throw new Error(`Tipo de criterio desconocido: ${criterio.tipo}`);
    return { criterio, cumple: plantilla.comprobar(documento, criterio, ventana) };
  });
  return { aprobado: resultados.every((r) => r.cumple), resultados };
}
