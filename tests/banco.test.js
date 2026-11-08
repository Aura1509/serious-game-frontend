import { describe, expect, it } from 'vitest';
import { evaluar } from '../src/evaluador/plantillas.js';
import { cargarBanco, validarReto } from '../src/retos/banco.js';

const retos = [...cargarBanco().values()];

function documentoCon({ html = '', css = '' }) {
  document.head.innerHTML = `<style>${css}</style>`;
  document.body.innerHTML = html;
  return document;
}

describe('banco de retos', () => {
  it('carga todos los retos sin errores', () => {
    expect(retos.length).toBeGreaterThan(0);
  });

  it('cada reto declara un resultado de aprendizaje y partes válidas', () => {
    for (const reto of retos) {
      expect(validarReto(reto)).toBeNull();
      expect(reto.ra).toMatch(/^RA-F[1-5]/);
    }
  });

  it('cada consigna tiene cinco oraciones o menos (RNF-06)', () => {
    for (const parte of retos.flatMap((reto) => reto.partes)) {
      const oraciones = parte.consigna.split(/[.!?]+/).filter((o) => o.trim());
      expect(oraciones.length).toBeLessThanOrEqual(5);
    }
  });

  it('la base no supera la primera parte y la solución supera todas', () => {
    for (const reto of retos.filter((r) => r.solucion && r.editable !== 'js')) {
      const todos = reto.partes.flatMap((p) => p.criterios);
      expect(evaluar(documentoCon(reto.base), reto.partes[0].criterios, window).aprobado).toBe(false);
      expect(evaluar(documentoCon({ ...reto.base, ...reto.solucion }), todos, window).aprobado).toBe(true);
    }
  });
});
