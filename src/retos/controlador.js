import { ejecutarEnSandbox } from '../ejecucion/sandbox.js';
import { evaluar } from '../evaluador/plantillas.js';
import { componerRetroalimentacion } from '../retroalimentacion/mensajes.js';

/**
 * Controlador de retos (RNF-07): abre un reto, ejecuta el código del estudiante,
 * lo evalúa y coordina la retroalimentación, el progreso y la escena.
 */
export function crearControlador({ banco, progreso, panel, escena, vistaPrevia }) {
  let reto = null;

  async function ejecutar() {
    const codigo = { ...reto.base, [reto.editable]: panel.obtenerCodigo() };
    try {
      const { documento, ventana, errores } = await ejecutarEnSandbox(vistaPrevia, codigo);
      const resultado = evaluar(documento, reto.criterios, ventana);
      panel.mostrarResultado(componerRetroalimentacion(reto, resultado, errores));
      if (resultado.aprobado) {
        progreso.marcarSuperado(reto.id);
        escena.celebrar();
      }
    } catch (error) {
      panel.mostrarResultado({ aprobado: false, mensajes: [error.message] });
    }
  }

  panel.alEjecutar(ejecutar);
  panel.alReiniciar(() => panel.ponerCodigo(reto.base[reto.editable]));

  return {
    abrirReto(id) {
      reto = banco.get(id);
      if (!reto) throw new Error(`No existe el reto ${id}`);
      panel.mostrarReto(reto);
    },
  };
}
