const PREFIJO = 'serious-game-frontend:';

export function leerPreferencia(nombre, almacen = globalThis.localStorage, predeterminado = false) {
  try {
    const valor = almacen?.getItem(PREFIJO + nombre);
    return valor === null || valor === undefined ? predeterminado : valor === 'si';
  } catch {
    return predeterminado;
  }
}

export function guardarPreferencia(nombre, valor, almacen = globalThis.localStorage) {
  try {
    almacen?.setItem(PREFIJO + nombre, valor ? 'si' : 'no');
    return true;
  } catch {
    return false;
  }
}

export const leerPausaAnimaciones = (almacen) => leerPreferencia('pausar-animaciones', almacen);

export const guardarPausaAnimaciones = (valor, almacen) =>
  guardarPreferencia('pausar-animaciones', valor, almacen);
