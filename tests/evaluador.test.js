import { describe, expect, it } from 'vitest';
import { evaluar, validarCriterio } from '../src/evaluador/plantillas.js';

const documentoCon = (html) =>
  new DOMParser().parseFromString(`<!doctype html><html><body>${html}</body></html>`, 'text/html');

describe('evaluador por plantillas', () => {
  it('comprueba que un elemento exista o no exista', () => {
    const existe = { tipo: 'existe', selector: 'nav a', mensaje: '' };
    const noExiste = { tipo: 'no-existe', selector: 'section > a', mensaje: '' };
    expect(evaluar(documentoCon('<nav><a href="#a">A</a></nav>'), [existe, noExiste]).aprobado).toBe(true);
    expect(evaluar(documentoCon('<section><a href="#a">A</a></section>'), [noExiste]).aprobado).toBe(false);
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

  it('comprueba en qué contenedor quedó un bloque', () => {
    const criterio = {
      tipo: 'contenedor',
      selector: 'h2',
      contiene: 'Noticia',
      etiqueta: 'article',
      mensaje: '',
    };
    const aprueba = (html) => evaluar(documentoCon(html), [criterio]).aprobado;
    expect(aprueba('<main><article><header><h2>Noticia</h2></header></article></main>')).toBe(true);
    expect(aprueba('<main><section><h2>Noticia</h2></section></main>')).toBe(false);
    expect(aprueba('<main><article><h2>Otra</h2></article></main>')).toBe(false);
  });

  it('detecta criterios mal declarados', () => {
    expect(validarCriterio({ tipo: 'existe', selector: 'nav', mensaje: 'Falta nav.' })).toBeNull();
    expect(validarCriterio({ tipo: 'contenedor', selector: 'h2', mensaje: 'x' })).toMatch(
      /contiene, etiqueta/,
    );
    expect(validarCriterio({ tipo: 'existe', selector: 'nav' })).toMatch(/no tiene mensaje/);
    expect(validarCriterio({ tipo: 'inventado', mensaje: 'x' })).toMatch(/desconocido/);
  });
});
