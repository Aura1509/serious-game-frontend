import { describe, expect, it } from 'vitest';
import { cargarProgreso } from '../src/progreso/guardado.js';

const almacenFalso = () => {
  const datos = new Map();
  return {
    getItem: (k) => datos.get(k) ?? null,
    setItem: (k, v) => datos.set(k, v),
    removeItem: (k) => datos.delete(k),
  };
};

describe('guardado del progreso', () => {
  it('guarda y recupera los retos superados sin duplicarlos', () => {
    const almacen = almacenFalso();
    const progreso = cargarProgreso(almacen);
    progreso.marcarSuperado('H1');
    progreso.marcarSuperado('H1');
    expect(cargarProgreso(almacen).superados()).toEqual(['H1']);
  });

  it('borrar elimina el avance', () => {
    const almacen = almacenFalso();
    const progreso = cargarProgreso(almacen);
    progreso.marcarSuperado('H1');
    progreso.borrar();
    expect(cargarProgreso(almacen).superados()).toEqual([]);
  });
});
