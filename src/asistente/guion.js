export const NOMBRE_ROBOT = 'Robot asistente';

const ZONAS = {
  'la plaza central':
    'Esta es la plaza central. En la cúpula se lanzará la cartelera cuando tengas las cuatro llaves.',
  'el edificio HTML': {
    pendiente:
      'El edificio HTML. Aquí la cartelera recibe su estructura. Tu reto está en el aula 1, en este piso.',
    hecho: 'El edificio HTML. Aquí ya le diste estructura a la cartelera.',
  },
  'el edificio CSS':
    'El edificio CSS. Aquí la cartelera tomará estilo: colores, espacios y tipografía. Sus retos llegarán pronto.',
  'el edificio JavaScript':
    'El edificio JavaScript. Aquí la cartelera responderá a los clics, pero nadie lo ha programado todavía.',
  'el laboratorio de IA':
    'El laboratorio de IA. Aquí revisarás el código que propone una IA antes de aceptarlo.',
};

export const CONSEJOS = [
  {
    id: 'correr',
    texto: ({ correr }) => (correr ? 'Mantén Shift para caminar más despacio.' : 'Mantén Shift para correr.'),
  },
  { id: 'saltar', texto: 'Pulsa Espacio para saltar.' },
  { id: 'camara', texto: 'Gira la cámara con Q y E, o arrastrando con el ratón.' },
  { id: 'baliza', texto: 'La columna de luz amarilla marca tu próximo destino.' },
  { id: 'zoom', texto: 'Acerca o aleja la cámara con la rueda del ratón o con las teclas + y -.' },
  { id: 'personas', texto: 'Las personas del campus dan consejos. Acércate y pulsa Espacio para hablar.' },
  { id: 'ayuda', texto: 'Con H abres la ayuda. Ahí puedes activar mi voz o apagar estos consejos.' },
];

export function frases(texto, minimo = 70) {
  const partes = texto.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [];
  const salida = [];
  for (const parte of partes.map((frase) => frase.trim()).filter(Boolean)) {
    const ultima = salida.at(-1);
    if (ultima && ultima.length < minimo) salida[salida.length - 1] = `${ultima} ${parte}`;
    else salida.push(parte);
  }
  return salida;
}

export const duracionDe = (texto) => Math.min(14000, Math.max(3500, 1500 + texto.length * 60));

export const tiempoDeHabla = (texto) => Math.min(9000, 300 + texto.length * 22);

export function saludo(superado) {
  return [
    {
      texto: '¡Hola! Soy tu robot asistente. Voy a acompañarte por el campus.',
      expresion: 'feliz',
      gesto: 'saludar',
      anunciar: true,
    },
    {
      texto: superado
        ? 'Ya superaste el reto H1. Sigue explorando: los demás retos llegarán pronto.'
        : 'La Facultad necesita su cartelera web y tú la vas a construir. Empieza por el edificio HTML, a la izquierda de la plaza.',
      anunciar: true,
    },
    { texto: 'Si necesitas ayuda, pulsa R y te doy un consejo.', anunciar: true },
  ];
}

export function consejoDeZona(zona, superado) {
  const texto = ZONAS[zona];
  if (!texto) return null;
  return {
    texto: typeof texto === 'string' ? texto : superado ? texto.hecho : texto.pendiente,
    etiqueta: 'Narración',
    anunciar: true,
  };
}

export function consejoDeLugar(info) {
  if (info.tipo === 'charla') {
    return { texto: `Es ${info.persona.nombre}. Pulsa Espacio para hablar.`, gesto: 'saludar' };
  }
  if (info.tipo === 'reto') {
    return {
      texto: `Aquí empieza el reto ${info.reto}. Pulsa Enter cuando estés listo.`,
      expresion: 'feliz',
    };
  }
  return null;
}

export function consejoPedido({ info, superado }) {
  if (info?.tipo === 'charla') {
    return {
      texto: `Es ${info.persona.nombre}, ${info.persona.rol}. Pulsa Espacio para hablar.`,
      anunciar: true,
    };
  }
  if (info?.tipo === 'reto') {
    return { texto: `${info.lugar}. Pulsa Enter para empezar el reto ${info.reto}.`, anunciar: true };
  }
  if (info) {
    return { texto: `${info.lugar}. Pulsa Enter para ${info.accion.toLowerCase()}.`, anunciar: true };
  }
  if (superado) {
    const consejo = CONSEJOS.find(({ id }) => id === 'personas');
    return { texto: `Ya superaste el reto H1. ${consejo.texto}`, anunciar: true, expresion: 'feliz' };
  }
  return {
    texto:
      'Te muestro el camino: ve al edificio HTML, a la izquierda de la plaza, y entra al aula 1. Sigue la columna de luz amarilla.',
    gesto: 'senalar',
    anunciar: true,
  };
}

export function siguienteConsejo(vistos, opciones = {}) {
  const consejo = CONSEJOS.find(({ id }) => !vistos.has(`consejo:${id}`));
  if (!consejo) return null;
  return {
    id: `consejo:${consejo.id}`,
    texto: typeof consejo.texto === 'function' ? consejo.texto(opciones) : consejo.texto,
    etiqueta: 'Consejo',
    anunciar: true,
  };
}

export function mensajesDeTeoria(parte, numero = 1, total = 1) {
  const etiqueta = total > 1 ? `Teoría, parte ${numero} de ${total}` : 'Teoría';
  const lista = frases(parte.teoria).map((texto) => ({ texto, etiqueta }));
  if (parte.ejemplo)
    lista.push({ texto: 'Mira este ejemplo:', ejemplo: parte.ejemplo, etiqueta, duracion: 7500 });
  return lista;
}

export function pistasDisponibles(parte, fallos) {
  return Math.min(parte.pistas?.length ?? 0, fallos + 1);
}
