import { ejecutarEnSandbox, mostrarVistaPrevia } from '../ejecucion/sandbox.js';
import { evaluar } from '../evaluador/plantillas.js';
import { componerRetroalimentacion } from '../retroalimentacion/mensajes.js';

/**
 * Controlador de retos (RNF-07): abre un reto, ejecuta el código del estudiante,
 * lo evalúa y coordina la retroalimentación, el progreso y la escena.
 */
export function crearControlador({ banco, progreso, panel, escena, vistaPrevia }) {
  let reto = null;
  let parte = 0;
  let ejecutando = false;
  let espera = null;

  const codigo = () => ({ ...reto.base, [reto.editable]: panel.obtenerCodigo() });

  function iniciar() {
    clearTimeout(espera);
    parte = 0;
    panel.mostrarReto(reto);
    panel.mostrarParte(reto, parte);
    mostrarVistaPrevia(vistaPrevia, codigo());
  }

  async function ejecutar() {
    if (ejecutando) return;
    ejecutando = true;
    clearTimeout(espera);
    const criterios = reto.partes.slice(0, parte + 1).flatMap((p) => p.criterios);
    try {
      const { documento, ventana, errores } = await ejecutarEnSandbox(vistaPrevia, codigo());
      const resultado = evaluar(documento, criterios, ventana);
      const retro = componerRetroalimentacion(resultado, errores, reto.partes[parte].exito);
      if (retro.aprobado && parte < reto.partes.length - 1) {
        parte += 1;
        panel.mostrarParte(reto, parte);
        retro.mensajes.push(`Pasa a la parte ${parte + 1}: lee la nueva teoría y lo que debes hacer.`);
      } else if (retro.aprobado) {
        progreso.marcarSuperado(reto.id);
        escena.celebrar();
      }
      panel.mostrarResultado(retro);
    } catch (error) {
      panel.mostrarResultado({ aprobado: false, mensajes: [error.message] });
    } finally {
      ejecutando = false;
    }
  }

  function actualizarVistaPrevia() {
    if (reto.editable === 'js' || ejecutando) return;
    clearTimeout(espera);
    espera = setTimeout(() => mostrarVistaPrevia(vistaPrevia, codigo()), 300);
  }

  panel.alEjecutar(ejecutar);
  panel.alReiniciar(iniciar);
  panel.alEscribir(actualizarVistaPrevia);

  return {
    abrirReto(id) {
      reto = banco.get(id);
      if (!reto) throw new Error(`No existe el reto ${id}`);
      iniciar();
    },
  };
}
