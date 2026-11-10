import { useEffect, useRef, useState } from 'react';
import { ejecutarEnSandbox, mostrarVistaPrevia } from '../ejecucion/sandbox.js';
import { evaluar } from '../evaluador/plantillas.js';
import { componerRetroalimentacion } from '../retroalimentacion/mensajes.js';

export function useControladorReto({ reto, progreso, alSuperar }) {
  const inicial = reto.base[reto.editable];
  const [codigo, setCodigo] = useState(inicial);
  const [parte, setParte] = useState(0);
  const [retro, setRetro] = useState(null);
  const [superado, setSuperado] = useState(false);
  const [fallos, setFallos] = useState(0);
  const vistaPrevia = useRef(null);
  const espera = useRef(null);
  const ejecutando = useRef(false);

  const completo = (texto) => ({ ...reto.base, [reto.editable]: texto });

  useEffect(() => {
    mostrarVistaPrevia(vistaPrevia.current, reto.base);
    return () => clearTimeout(espera.current);
  }, [reto]);

  function escribir(texto) {
    setCodigo(texto);
    if (reto.editable === 'js' || ejecutando.current) return;
    clearTimeout(espera.current);
    espera.current = setTimeout(() => mostrarVistaPrevia(vistaPrevia.current, completo(texto)), 300);
  }

  async function ejecutar() {
    if (ejecutando.current) return;
    ejecutando.current = true;
    clearTimeout(espera.current);
    const criterios = reto.partes.slice(0, parte + 1).flatMap((p) => p.criterios);
    try {
      const { documento, ventana, errores } = await ejecutarEnSandbox(vistaPrevia.current, completo(codigo));
      const nueva = componerRetroalimentacion(
        evaluar(documento, criterios, ventana),
        errores,
        reto.partes[parte].exito,
      );
      if (nueva.aprobado && parte < reto.partes.length - 1) {
        setParte(parte + 1);
        setFallos(0);
        nueva.mensajes.push(`Pasa a la parte ${parte + 2}: lee la nueva teoría y lo que debes hacer.`);
      } else if (nueva.aprobado) {
        progreso.marcarSuperado(reto.id);
        setSuperado(true);
        alSuperar();
      } else {
        setFallos(fallos + 1);
      }
      setRetro(nueva);
    } catch (error) {
      setFallos(fallos + 1);
      setRetro({ aprobado: false, mensajes: [error.message] });
    } finally {
      ejecutando.current = false;
    }
  }

  function reiniciar() {
    clearTimeout(espera.current);
    setCodigo(inicial);
    setParte(0);
    setRetro(null);
    setSuperado(false);
    setFallos(0);
    mostrarVistaPrevia(vistaPrevia.current, reto.base);
  }

  return { codigo, parte, retro, superado, fallos, vistaPrevia, escribir, ejecutar, reiniciar };
}
