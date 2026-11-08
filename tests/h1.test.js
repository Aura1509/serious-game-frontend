import { describe, expect, it } from 'vitest';
import { evaluar } from '../src/evaluador/plantillas.js';
import { componerRetroalimentacion } from '../src/retroalimentacion/mensajes.js';
import { cargarBanco } from '../src/retos/banco.js';

const h1 = cargarBanco().get('H1');
const solucion = h1.solucion.html;
const criterios = h1.partes.flatMap((p) => p.criterios);
const mensaje = (condicion) => criterios.find(condicion).mensaje;

function revisar(html, parte = h1.partes.length - 1) {
  const documento = new DOMParser().parseFromString(
    `<!doctype html><html><body>${html}</body></html>`,
    'text/html',
  );
  const aplicables = h1.partes.slice(0, parte + 1).flatMap((p) => p.criterios);
  return componerRetroalimentacion(evaluar(documento, aplicables));
}

const sinContenedores = solucion
  .replace('<article class="noticia" id="noticia">', '<div class="noticia" id="noticia">')
  .replace('</article>', '</div>')
  .replace('<section class="agenda" id="agenda">', '<div class="agenda" id="agenda">')
  .replace('</section>', '</div>');

describe('reto H1: de div a semántica', () => {
  it('la base hecha con div recibe un mensaje por cada región que falta', () => {
    const { aprobado, mensajes } = revisar(h1.base.html, 0);
    expect(aprobado).toBe(false);
    expect(mensajes).toHaveLength(5);
  });

  it('con las regiones listas supera la parte 1 y la parte 2 pide los contenedores', () => {
    expect(revisar(sinContenedores, 0).aprobado).toBe(true);
    expect(revisar(sinContenedores).mensajes).toEqual([
      mensaje((c) => c.etiqueta === 'article'),
      mensaje((c) => c.etiqueta === 'section'),
    ]);
  });

  it('acepta la solución esperada y otras equivalentes', () => {
    expect(revisar(solucion).aprobado).toBe(true);
    const navEnHeader = solucion.replace(/<\/header>\n(<nav>[\s\S]*?<\/nav>)/, '$1\n</header>');
    expect(revisar(navEnHeader).aprobado).toBe(true);
  });

  it('explica por qué el menú no va en section', () => {
    const menuEnSection = solucion.replace('<nav>', '<section>').replace('</nav>', '</section>');
    expect(revisar(menuEnSection, 0).mensajes).toEqual([mensaje((c) => c.selector === 'section > a')]);
  });

  it('rechaza un nav vacío que deja los enlaces por fuera', () => {
    const navVacio = solucion.replace(/<nav>([\s\S]*?)<\/nav>/, '<nav></nav>\n<div>$1</div>');
    expect(revisar(navVacio, 0).mensajes).toEqual([mensaje((c) => c.selector === 'nav a')]);
  });

  it('explica cuándo la noticia o los botones usan el contenedor equivocado', () => {
    const noticiaEnSection = solucion
      .replace('<article class="noticia" id="noticia">', '<section class="noticia" id="noticia">')
      .replace('</article>', '</section>');
    expect(revisar(noticiaEnSection).mensajes).toEqual([mensaje((c) => c.etiqueta === 'article')]);
    const botonesEnArticle = solucion
      .replace('<div class="botones">', '<article class="botones">')
      .replace('</div>', '</article>');
    expect(revisar(botonesEnArticle).mensajes).toEqual([mensaje((c) => c.etiqueta === 'div')]);
  });
});
