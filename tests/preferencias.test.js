import { describe, expect, it } from 'vitest';
import { guardarPausaAnimaciones, leerPausaAnimaciones } from '../src/ui/preferencias.js';

const almacenFalso = () => {
  const datos = new Map();
  return { getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => datos.set(k, v) };
};

describe('preferencia de pausar animaciones', () => {
  it('recuerda la pausa en el navegador', () => {
    const almacen = almacenFalso();
    expect(leerPausaAnimaciones(almacen)).toBe(false);
    guardarPausaAnimaciones(true, almacen);
    expect(leerPausaAnimaciones(almacen)).toBe(true);
  });

  it('sigue funcionando si el navegador bloquea el almacenamiento', () => {
    const bloqueado = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    };
    expect(leerPausaAnimaciones(bloqueado)).toBe(false);
    expect(guardarPausaAnimaciones(true, bloqueado)).toBe(false);
  });
});
