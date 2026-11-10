import { useCallback, useEffect, useRef, useState } from 'react';
import { duracionDe, tiempoDeHabla } from './guion.js';

const PREFERIDAS = ['es-CO', 'es-MX', 'es-US', 'es-419', 'es-ES'];

export const hayVoz = () =>
  typeof globalThis.speechSynthesis !== 'undefined' &&
  typeof globalThis.SpeechSynthesisUtterance !== 'undefined';

function hablar(texto, alTerminar) {
  if (!hayVoz()) return false;
  const sintesis = globalThis.speechSynthesis;
  sintesis.cancel();
  const frase = new globalThis.SpeechSynthesisUtterance(texto);
  const voces = sintesis.getVoices();
  const voz =
    PREFERIDAS.map((idioma) => voces.find((opcion) => opcion.lang.replace('_', '-') === idioma)).find(
      Boolean,
    ) ?? voces.find((opcion) => opcion.lang.startsWith('es'));
  if (voz) frase.voice = voz;
  frase.lang = voz?.lang ?? 'es-CO';
  frase.rate = 1.05;
  frase.pitch = 1.35;
  frase.onend = alTerminar;
  frase.onerror = alTerminar;
  sintesis.speak(frase);
  return true;
}

export function useAsistente({ voz }) {
  const [mensaje, setMensaje] = useState(null);
  const datos = useRef({ cola: [], relojes: [], id: 0, activo: false, voz: false });

  useEffect(() => {
    datos.current.voz = voz;
    if (!voz && hayVoz()) globalThis.speechSynthesis.cancel();
  }, [voz]);

  useEffect(() => {
    const actual = datos.current;
    return () => {
      actual.relojes.forEach(clearTimeout);
      if (hayVoz()) globalThis.speechSynthesis.cancel();
    };
  }, []);

  const avanzar = useCallback(function siguiente() {
    const actual = datos.current;
    actual.relojes.forEach(clearTimeout);
    actual.relojes = [];
    actual.id += 1;
    const id = actual.id;
    const proximo = actual.cola.shift();
    actual.activo = Boolean(proximo);
    if (!proximo) {
      setMensaje(null);
      return;
    }
    setMensaje({ ...proximo, id, hablando: true });
    const callar = () =>
      setMensaje((previo) => (previo?.id === id ? { ...previo, hablando: false } : previo));
    const minimo = proximo.duracion ?? duracionDe(proximo.texto);
    const inicio = Date.now();
    const alTerminar = () => {
      if (actual.id !== id) return;
      callar();
      actual.relojes.push(setTimeout(siguiente, Math.max(700, minimo - (Date.now() - inicio))));
    };
    if ((proximo.voz ?? actual.voz) && hablar(proximo.texto, alTerminar)) {
      actual.relojes.push(setTimeout(siguiente, minimo * 2.5));
      return;
    }
    actual.relojes.push(setTimeout(callar, tiempoDeHabla(proximo.texto)));
    actual.relojes.push(setTimeout(siguiente, minimo));
  }, []);

  const decir = useCallback(
    (mensajes, { reemplazar = true } = {}) => {
      const lista = (Array.isArray(mensajes) ? mensajes : [mensajes]).filter(Boolean);
      if (!lista.length) return;
      const actual = datos.current;
      if (reemplazar) {
        actual.cola = lista;
        avanzar();
        return;
      }
      actual.cola.push(...lista);
      if (!actual.activo) avanzar();
    },
    [avanzar],
  );

  const callar = useCallback(() => {
    const actual = datos.current;
    actual.cola = [];
    actual.relojes.forEach(clearTimeout);
    actual.relojes = [];
    actual.id += 1;
    actual.activo = false;
    if (hayVoz()) globalThis.speechSynthesis.cancel();
    setMensaje(null);
  }, []);

  return { mensaje, decir, callar };
}
