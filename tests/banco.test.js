import { describe, expect, it } from 'vitest';
import { cargarBanco, validarReto } from '../src/retos/banco.js';

describe('banco de retos', () => {
  it('carga todos los retos sin errores', () => {
    expect(cargarBanco().size).toBeGreaterThan(0);
  });

  it('cada reto declara un resultado de aprendizaje y criterios con mensaje', () => {
    for (const reto of cargarBanco().values()) {
      expect(validarReto(reto)).toBeNull();
      expect(reto.ra).toMatch(/^RA-F[1-5]/);
      reto.criterios.forEach((c) => expect(c.mensaje).toBeTruthy());
    }
  });
});
