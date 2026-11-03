import { describe, expect, it } from 'vitest';
import { evaluar } from '../src/evaluador/plantillas.js';
import { cargarBanco } from '../src/retos/banco.js';

const documentoCon = (html) =>
  new DOMParser().parseFromString(`<!doctype html><html><body>${html}</body></html>`, 'text/html');
const h1 = cargarBanco().get('H1');

describe('evaluador por plantillas', () => {
  it('no aprueba la estructura base hecha con div', () => {
    const { aprobado, resultados } = evaluar(documentoCon(h1.base.html), h1.criterios, window);
    expect(aprobado).toBe(false);
    expect(resultados.filter((r) => !r.cumple)).toHaveLength(5);
  });

  it('aprueba cualquier solución con las cinco regiones', () => {
    const html =
      '<header><h1>Facultad</h1></header><nav><a href="#a">A</a></nav><main><p>Hola</p></main><aside></aside><footer></footer>';
    expect(evaluar(documentoCon(html), h1.criterios, window).aprobado).toBe(true);
  });

  it('comprueba estilos calculados', () => {
    document.body.innerHTML = '<p id="aviso" style="color: rgb(255, 0, 0)">Aviso</p>';
    const criterio = {
      tipo: 'estilo',
      selector: '#aviso',
      propiedad: 'color',
      valor: 'rgb(255, 0, 0)',
      mensaje: '',
    };
    expect(evaluar(document, [criterio], window).aprobado).toBe(true);
  });
});
