import { describe, expect, it } from 'vitest';
import { generarCodigo, leerCodigo } from '../src/progreso/codigo-continuacion.js';

describe('código de continuación', () => {
  it('recupera exactamente los retos superados', () => {
    const superados = ['H1', 'H2', 'H4', 'HF', 'C1', 'C3'];
    expect(leerCodigo(generarCodigo(superados))).toEqual(superados);
  });

  it('tiene el formato corto esperado', () => {
    expect(generarCodigo(['H1'])).toMatch(/^UV1-[0-9A-Z]{4}-[0-9A-Z]$/);
  });

  it('detecta un carácter mal copiado', () => {
    const codigo = generarCodigo(['H1', 'H2']);
    const alterado = codigo.slice(0, 5) + (codigo[5] === 'Z' ? 'Y' : 'Z') + codigo.slice(6);
    expect(() => leerCodigo(alterado)).toThrow(/carácter equivocado/);
  });

  it('funciona sin retos superados y con todos', () => {
    expect(leerCodigo(generarCodigo([]))).toEqual([]);
    const todos = [
      'H1',
      'H2',
      'H3',
      'H4',
      'HF',
      'C1',
      'C2',
      'C3',
      'C4',
      'C5',
      'CF',
      'J1',
      'J2',
      'J3',
      'JF',
      'A1',
      'A2',
      'A3',
      'AF',
      'F1',
    ];
    expect(leerCodigo(generarCodigo(todos))).toEqual(todos);
  });
});
