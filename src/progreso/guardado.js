/**
 * Guardado del progreso (RF-09, RNF-08): solo en el navegador del estudiante, sin cuentas ni servidor.
 */
const CLAVE = 'serious-game-frontend:progreso';

export function cargarProgreso(almacen = globalThis.localStorage) {
  let superados = [];
  try {
    superados = JSON.parse(almacen?.getItem(CLAVE) ?? '[]');
  } catch {
    superados = [];
  }
  const guardar = () => {
    try {
      almacen?.setItem(CLAVE, JSON.stringify(superados));
    } catch {
      /* el navegador puede bloquear el almacenamiento; el juego sigue funcionando */
    }
  };
  return {
    superados: () => [...superados],
    marcarSuperado(id) {
      if (!superados.includes(id)) superados.push(id);
      guardar();
    },
    reemplazar(lista) {
      superados = [...lista];
      guardar();
    },
    borrar() {
      superados = [];
      try {
        almacen?.removeItem(CLAVE);
      } catch {
        /* sin almacenamiento disponible */
      }
    },
  };
}
