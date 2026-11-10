import { datosDePersona } from './conversaciones.js';

const EDIFICIOS = {
  HTML: 'del edificio HTML',
  CSS: 'del edificio CSS',
  JS: 'del edificio JavaScript',
  GENAI: 'del laboratorio de IA',
};
const AULAS = { A1: 'Aula 1', A2: 'Aula 2', A3: 'Aula 3' };
const RETOS = { INT_HTML_Aula_A1: { id: 'H1', titulo: 'De div a semántica' } };

export function describirInteraccion(nombre) {
  const persona = datosDePersona(nombre);
  if (persona) {
    return {
      tipo: 'charla',
      persona,
      lugar: `${persona.nombre}, ${persona.rol}`,
      accion: `Hablar con ${persona.nombre}`,
    };
  }
  if (nombre === 'INT_Guia') {
    return { tipo: 'ayuda', lugar: 'Tablero de bienvenida', accion: 'Leer cómo se juega' };
  }
  if (nombre === 'INT_Atril') {
    return {
      tipo: 'aviso',
      lugar: 'Atril de la cúpula',
      accion: 'Ver el atril',
      aviso: 'Aquí se lanzará la cartelera al final del recorrido, cuando tengas las cuatro llaves.',
    };
  }
  const [, clave, tipo, aula] = nombre.split('_');
  const edificio = EDIFICIOS[clave] ?? 'del campus';
  const reto = RETOS[nombre];
  if (reto) {
    return {
      tipo: 'reto',
      reto: reto.id,
      lugar: `${AULAS[aula]} ${edificio}`,
      accion: `Empezar el reto ${reto.id}: ${reto.titulo}`,
    };
  }
  if (tipo === 'Puerta') {
    const extra =
      clave === 'HTML'
        ? 'El aula 1, con el reto H1, está en este mismo piso.'
        : 'Sus retos llegarán en los próximos sprints.';
    return {
      tipo: 'aviso',
      lugar: `Entrada ${edificio}`,
      accion: 'Leer la entrada',
      aviso: `Entrada ${edificio}. ${extra}`,
    };
  }
  if (tipo === 'Aula') {
    return {
      tipo: 'aviso',
      lugar: `${AULAS[aula] ?? 'Aula'} ${edificio}`,
      accion: 'Ver el aula',
      aviso: 'El reto de esta aula todavía no está disponible en el prototipo.',
    };
  }
  if (tipo === 'Examen') {
    return {
      tipo: 'aviso',
      lugar: `Reto final ${edificio}`,
      accion: 'Ver el reto final',
      aviso: 'El reto final de este edificio todavía no está disponible en el prototipo.',
    };
  }
  return {
    tipo: 'aviso',
    lugar: 'Punto del campus',
    accion: 'Interactuar',
    aviso: 'Aquí no hay nada todavía.',
  };
}
