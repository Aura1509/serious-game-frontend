const base = { delgadez: 0.92, ojos: '#3f2a1c', labios: '#b8676a', zapatos: '#f2f2f0' };

export const PERSONAJES = [
  {
    nombre: 'Sofía',
    aspecto: {
      modelo: 'mujer_casual',
      sexo: 'f',
      tintes: { pelo: '#6b3f22', arriba: '#4f9a5c', abajo: '#34465f', piel: '#e8b993', zapatos: '#e9e6df' },
      rasgos: { iris: '#6b4a2b', pestanas: true },
    },
    acento: '#3f8f55',
    rol: 'estudiante de Ingeniería Industrial',
    tipo: 'silla',
    perfil: {
      ...base,
      altura: 1.6,
      silueta: 'a',
      piel: '#e9bb98',
      pelo: { estilo: 'largo', color: '#8e4f26' },
      top: { color: '#7e57c2', mangas: 'cortas' },
      pantalon: { color: '#2f3b52', largo: 'largo' },
    },
    lineas: [
      'Hola. Voy para la biblioteca, pero antes paso por la plazoleta a tomar un poco de sol.',
      'Si te pierdes, sigue los caminos de colores: cada uno lleva a un edificio.',
      'El rosado va al edificio CSS, el amarillo al de JavaScript y el azul al laboratorio de IA.',
    ],
  },
  {
    nombre: 'Mariana',
    aspecto: {
      modelo: 'mujer_casual',
      sexo: 'f',
      tintes: { pelo: '#1f1612', arriba: '#7e57c2', abajo: '#3a3f4b', piel: '#e0ac84' },
      rasgos: { pestanas: true },
    },
    acento: '#7e57c2',
    rol: 'estudiante de Ingeniería de Sistemas',
    tipo: 'baston',
    perfil: {
      ...base,
      altura: 1.63,
      silueta: 'a',
      piel: '#e6b48f',
      pelo: { estilo: 'mono', color: '#2b1b14' },
      top: { color: '#ef8fbf', mangas: 'cortas' },
      pantalon: { color: '#3a3f4b', largo: 'largo' },
      gafas: 'oscuras',
    },
    lineas: [
      '¡Hola! ¿Vas para el reto del edificio HTML? Yo también tengo clase allá.',
      'Un buen consejo: el HTML semántico ayuda a quienes usamos lector de pantalla a entender una página.',
      'Etiquetas como header, nav, main y footer nos dicen qué es cada parte.',
    ],
  },
  {
    nombre: 'Valentina',
    aspecto: {
      modelo: 'mujer_vestido',
      sexo: 'f',
      tintes: { pelo: '#3b2417', arriba: '#d9548a', piel: '#c98e62', zapatos: '#f0e6d8' },
      rasgos: { iris: '#3b2416', pestanas: true, rubor: 0.26 },
    },
    acento: '#d9548a',
    rol: 'monitora del edificio HTML',
    perfil: {
      ...base,
      altura: 1.58,
      silueta: 'a',
      piel: '#d9a07a',
      pelo: { estilo: 'coleta', color: '#4a2e1c' },
      top: { color: '#2f8f83', mangas: 'cortas' },
      pantalon: { color: '#3e5d8c', largo: 'largo' },
    },
    lineas: [
      'Soy monitora del edificio HTML. El reto H1 está en el aula 1, en el primer piso.',
      'La cartelera del reto está hecha solo con div. Tu trabajo es cambiarla por etiquetas que digan qué es cada parte.',
      'Si un mensaje te dice que algo falta, léelo con calma: siempre explica dónde revisar.',
    ],
  },
  {
    nombre: 'Andrés',
    aspecto: {
      modelo: 'hombre_casual',
      sexo: 'm',
      tintes: { pelo: '#1f1510', arriba: '#f2c230', abajo: '#2d3a52', piel: '#c48a5f' },
      rasgos: { iris: '#3b2416' },
    },
    acento: '#b3262d',
    rol: 'estudiante de Ingeniería de Sistemas',
    perfil: {
      ...base,
      altura: 1.76,
      silueta: 'b',
      piel: '#c48a5f',
      pelo: { estilo: 'corto', color: '#1f1510' },
      top: { color: '#f2c230', mangas: 'cortas' },
      pantalon: { color: '#2d2d35', largo: 'largo' },
      mochila: '#3c4a5c',
    },
    lineas: [
      '¿Qué más? Voy tarde para clase en el edificio JavaScript.',
      'Dicen que los retos de JavaScript llegan en los próximos sprints. Por ahora, practica con HTML.',
    ],
  },
  {
    nombre: 'Julián',
    aspecto: {
      modelo: 'hombre_hoodie',
      sexo: 'm',
      tintes: { pelo: '#17100c', arriba: '#3d6fb0', abajo: '#b39b72', piel: '#7a4b31', zapatos: '#2d2d35' },
      rasgos: { iris: '#2a1a10', barba: 'sombra' },
    },
    acento: '#3f4752',
    rol: 'estudiante de Ingeniería Electrónica',
    perfil: {
      ...base,
      altura: 1.8,
      silueta: 'b',
      piel: '#8a573a',
      pelo: { estilo: 'rizado', color: '#17100c' },
      top: { color: '#3d7bd9', mangas: 'largas' },
      pantalon: { color: '#b39b72', largo: 'largo' },
      gafas: 'claras',
    },
    lineas: [
      '¿Sabías que el campus de Meléndez también es jardín botánico?',
      'Esos árboles de copa ancha son samanes. Los de flores rosadas son guayacanes y los lilas, gualandayes.',
    ],
  },
  {
    nombre: 'Daniela',
    aspecto: {
      modelo: 'mujer_casual',
      sexo: 'f',
      tintes: { pelo: '#18100c', arriba: '#f07a2a', abajo: '#40618f', piel: '#6f4630', zapatos: '#e9e6df' },
      rasgos: { iris: '#2a1a10', pestanas: true, labios: '#8c3a44' },
    },
    acento: '#30343c',
    rol: 'estudiante de Ingeniería Química',
    perfil: {
      ...base,
      altura: 1.66,
      silueta: 'a',
      piel: '#6f4630',
      pelo: { estilo: 'afro', color: '#18100c' },
      top: { color: '#f07a2a', mangas: 'cortas' },
      pantalon: { color: '#40618f', largo: 'largo' },
      mochila: '#2f6db5',
    },
    lineas: [
      'En las gradas de ladrillo de la plazoleta nos sentamos a estudiar entre clase y clase.',
      'Si las animaciones te marean, abajo a la izquierda está el botón Pausar animaciones.',
    ],
  },
  {
    nombre: 'Camilo',
    aspecto: {
      modelo: 'hombre_casual',
      sexo: 'm',
      tintes: { pelo: '#6b4a2e', arriba: '#4f9a4a', abajo: '#3e5d8c', piel: '#f0c7a6' },
      rasgos: { iris: '#5f7f60' },
    },
    acento: '#3d6fb0',
    rol: 'monitor del edificio CSS',
    perfil: {
      ...base,
      altura: 1.74,
      silueta: 'b',
      piel: '#f0c7a6',
      pelo: { estilo: 'corto', color: '#6b4a2e' },
      top: { color: '#4f9a4a', mangas: 'largas' },
      pantalon: { color: '#3e5d8c', largo: 'largo' },
      mochila: '#c0392b',
    },
    lineas: [
      'Hola. Soy monitor del edificio CSS, el de la fachada curva y los caminos rosados.',
      'Allá aprenderás a darle estilo a la cartelera: colores con buen contraste, espacios y tipografía legible.',
    ],
  },
];

export const SENTADOS = [
  {
    nombre: 'Tomás',
    aspecto: {
      modelo: 'hombre_hoodie',
      sexo: 'm',
      tintes: { pelo: '#3a2a1e', arriba: '#5b6b7a', abajo: '#3e5d8c', piel: '#e2b48f' },
      rasgos: { iris: '#5a3a22', barba: 'sombra' },
    },
    acento: '#4a6a92',
    rol: 'estudiante de Ingeniería Civil',
    perfil: {
      ...base,
      altura: 1.72,
      silueta: 'b',
      piel: '#e1ad87',
      pelo: { estilo: 'corto', color: '#3a2a1e' },
      top: { color: '#5b6b7a', mangas: 'cortas' },
      pantalon: { color: '#3e5d8c', largo: 'largo' },
    },
    lineas: [
      'Estoy repasando para un parcial. Aquí bajo los árboles se estudia muy bien.',
      'Un truco que me sirve: leer el mensaje de error completo antes de cambiar el código.',
    ],
  },
  {
    nombre: 'Isabela',
    aspecto: {
      modelo: 'mujer_vestido',
      sexo: 'f',
      tintes: { pelo: '#24160f', arriba: '#e04d9b', piel: '#b9825a' },
      rasgos: { iris: '#3b2416', pestanas: true },
    },
    acento: '#a8916a',
    rol: 'estudiante de Ingeniería de Sistemas',
    perfil: {
      ...base,
      altura: 1.6,
      silueta: 'a',
      piel: '#b9825a',
      pelo: { estilo: 'largo', color: '#24160f' },
      top: { color: '#e04d9b', mangas: 'cortas' },
      pantalon: { color: '#2d2d35', largo: 'largo' },
    },
    lineas: [
      '¡Hola! Estoy esperando a mi grupo para trabajar en la cartelera de la Facultad.',
      'Con la tecla H abres la ayuda, y ahí puedes activar Correr siempre o los gráficos ligeros.',
    ],
  },
];

const conPerfil = (aspecto, rol) => ({
  ...base,
  altura: aspecto.sexo === 'm' ? 1.74 : 1.62,
  silueta: aspecto.sexo === 'm' ? 'b' : 'a',
  piel: '#d7a37c',
  pelo: { estilo: aspecto.sexo === 'm' ? 'corto' : 'largo', color: aspecto.tintes.pelo ?? '#2a1a12' },
  top: { color: aspecto.tintes.arriba ?? '#3a3f4a', mangas: rol === 'profesor' ? 'largas' : 'cortas' },
  pantalon: { color: aspecto.tintes.abajo ?? '#2b2f3a', largo: 'largo' },
  gafas: aspecto.gafas,
});

const profesor = (nombre, rol, lugar, aspecto, acento, lineas) => ({
  nombre,
  rol,
  curso: rol.replace(/^profesora? de /, ''),
  tipo: 'profesor',
  lugar,
  aspecto,
  acento,
  perfil: conPerfil(aspecto, 'profesor'),
  lineas,
});

export const PROFESORES = [
  profesor(
    'Profesora Paola Rodríguez',
    'profesora de Proyecto Integrador I',
    'plaza',
    {
      modelo: 'mujer_blusa_larga',
      sexo: 'f',
      tintes: { pelo: '#2a1a12', arriba: '#3b4560', abajo: '#2b2f3a', piel: '#d9a07a', zapatos: '#2a2420' },
      rasgos: { iris: '#3b2416', pestanas: true },
      gafas: 'claras',
    },
    '#2f4a6b',
    [
      'Hola, soy la profesora Paola Rodríguez, de Proyecto Integrador I.',
      'En el integrador la cartelera tiene que servirle a personas reales. Piensa primero en quién la va a usar.',
      'Antes de escribir código, haz un boceto: ¿qué regiones necesita la página? header, nav, main, aside y footer.',
    ],
  ),
  profesor(
    'Profesor Fabián Valencia',
    'profesor de Proyecto Integrador I',
    'plaza',
    {
      modelo: 'hombre_traje',
      sexo: 'm',
      tintes: { pelo: '#2a1d14', arriba: '#3a3f4a', abajo: '#24262c', piel: '#d9a07a' },
      rasgos: { iris: '#3b2416' },
      gafas: 'claras',
    },
    '#3a3f4a',
    [
      'Hola, soy el profesor Fabián Valencia, de Proyecto Integrador I.',
      'HTML, CSS y JavaScript trabajan juntos: estructura, presentación y comportamiento.',
      'Prueba tu página cada vez que cambies algo. Un error pequeño se encuentra rápido.',
    ],
  ),
  profesor(
    'Profesor Carlos Gaona',
    'profesor de Desarrollo de Software I',
    'HTML',
    {
      modelo: 'hombre_barba',
      sexo: 'm',
      tintes: {
        pelo: '#7a756f',
        arriba: '#f2f1ec',
        arriba2: '#e4e2dc',
        abajo: '#2a2d34',
        piel: '#e2b48f',
      },
      rasgos: { iris: '#3b2416' },
    },
    '#4a5568',
    [
      'Hola, soy el profesor Carlos Gaona, de Desarrollo de Software I.',
      'Separa responsabilidades: el HTML dice qué es cada cosa y el CSS decide cómo se ve.',
      'Nombra las cosas por lo que son: una clase llamada noticia dice más que caja1.',
    ],
  ),
  profesor(
    'Profesora María Alejandra Pabón',
    'profesora de Desarrollo de Software I',
    'HTML',
    {
      modelo: 'mujer_traje_largo',
      sexo: 'f',
      tintes: { pelo: '#2a1a12', arriba: '#3f6b5a', abajo: '#2b2f3a', piel: '#e8b993' },
      rasgos: { iris: '#5a3a22', pestanas: true },
    },
    '#3f6b5a',
    [
      'Hola, soy la profesora María Alejandra Pabón, de Desarrollo de Software I.',
      'Cierra cada etiqueta que abras: un div sin cerrar puede romper todo lo que sigue.',
      'article es algo que se entiende solo; section agrupa un tema con su título.',
    ],
  ),
  profesor(
    'Profesora Beatriz Florián',
    'profesora de Desarrollo de Software I',
    'CSS',
    {
      modelo: 'mujer_blusa_larga',
      sexo: 'f',
      tintes: { pelo: '#1d1512', arriba: '#f4e3ea', abajo: '#2b2f3a', piel: '#e0ac84' },
      rasgos: { iris: '#3b2416', pestanas: true, labios: '#c0566a', rubor: 0.26 },
    },
    '#7a3b4f',
    [
      'Hola, soy la profesora Beatriz Florián, de Desarrollo de Software I.',
      'Prueba tu cartelera con el teclado: si llegas a todo con Tab, vas bien.',
      'Un lector de pantalla depende de tu HTML. Las regiones le ayudan a saltar a lo importante.',
    ],
  ),
  profesor(
    'Profesor Fredy Ballesteros',
    'profesor de Desarrollo de Software II',
    'JS',
    {
      modelo: 'hombre_traje',
      sexo: 'm',
      tintes: { pelo: '#2a2018', arriba: '#3b4b5e', abajo: '#2a2d34', piel: '#a86f4a' },
      rasgos: { iris: '#2a1a10' },
      gafas: 'claras',
    },
    '#3b4b5e',
    [
      'Hola, soy el profesor Fredy Ballesteros, de Desarrollo de Software II.',
      'En JavaScript, primero encuentra el elemento con querySelector y después cámbialo.',
      'Lee la consola del navegador: el mensaje de error te dice en qué línea buscar.',
    ],
  ),
  profesor(
    'Profesora Leidy Carvajal',
    'profesora de Desarrollo de Software II',
    'GENAI',
    {
      modelo: 'mujer_traje',
      sexo: 'f',
      tintes: { pelo: '#2a1a12', arriba: '#6b4f8a', abajo: '#2b2f3a', piel: '#c98e62' },
      rasgos: { iris: '#3b2416', pestanas: true },
    },
    '#6b4f8a',
    [
      'Hola, soy la profesora Leidy Carvajal, de Desarrollo de Software II.',
      'Cuando una IA te sugiera código, léelo línea por línea antes de usarlo.',
      'Si algo falla, cambia una sola cosa a la vez y vuelve a probar.',
    ],
  ),
];

const estudiante = (nombre, tipo, aspecto, acento, lineas) => ({
  nombre,
  rol: 'estudiante de Ingeniería de Sistemas',
  tipo,
  aspecto,
  acento,
  perfil: conPerfil(aspecto, 'estudiante'),
  lineas,
});

export const ENTRADA = [
  estudiante(
    'Ana',
    'sentada',
    {
      modelo: 'mujer_casual',
      sexo: 'f',
      tintes: { pelo: '#c99a4a', arriba: '#f29db2', abajo: '#34465f', piel: '#f1c9a5', zapatos: '#e9e6df' },
      rasgos: { iris: '#4f6f8a', pestanas: true },
    },
    '#f29db2',
    [
      '¡Hola! ¿Vienes por lo de la cartelera de la Facultad?',
      'Las actividades son en la plazoleta. Sigue derecho por este camino.',
      'Allá te esperan los profesores, y desde ahí llegas al reto del edificio HTML.',
    ],
  ),
  estudiante(
    'Mateo',
    'fijo',
    {
      modelo: 'hombre_casual',
      sexo: 'm',
      tintes: { pelo: '#5a3a24', arriba: '#2f9e8f', abajo: '#2d2d35', piel: '#c48a5f' },
      rasgos: { iris: '#3b2416' },
    },
    '#2f9e8f',
    [
      'Bienvenida al campus. Si buscas los retos, ve primero a la plazoleta.',
      'Desde la plazoleta se llega a los cuatro edificios: HTML, CSS, JavaScript y el laboratorio de IA.',
    ],
  ),
  estudiante(
    'Luisa',
    'sentada',
    {
      modelo: 'mujer_vestido',
      sexo: 'f',
      tintes: { pelo: '#2b1b14', arriba: '#3e7cb1', piel: '#a86f4a' },
      rasgos: { iris: '#2a1a10', pestanas: true },
    },
    '#3e7cb1',
    [
      'Estamos esperando para entrar a clase. Tú ve a la plazoleta, que allá empiezan las actividades.',
      'Si te pierdes, pídele un consejo al robot con la tecla R.',
    ],
  ),
];

const sentado = (nombre, aspecto, acento, lineas) => estudiante(nombre, 'sentada', aspecto, acento, lineas);

export const ESTUDIO = [
  sentado(
    'Sara',
    {
      modelo: 'mujer_casual',
      sexo: 'f',
      tintes: { pelo: '#3b2417', arriba: '#e8743b', abajo: '#34465f', piel: '#d9a07a', zapatos: '#e9e6df' },
      rasgos: { iris: '#5a3a22', pestanas: true },
    },
    '#c25a24',
    [
      '¡Hola! Acabo de empezar Ingeniería de Sistemas y todavía estoy aprendiendo qué es una etiqueta HTML.',
      'Primero quiero entender bien los conceptos. Después voy a la plazoleta a hacer los retos.',
    ],
  ),
  sentado(
    'Juan Pablo',
    {
      modelo: 'hombre_hoodie',
      sexo: 'm',
      tintes: { pelo: '#1f1510', arriba: '#2b3a67', abajo: '#5b6b7a', piel: '#c48a5f' },
      rasgos: { iris: '#3b2416' },
    },
    '#2b3a67',
    [
      'Estamos estudiando para los retos de la plazoleta: repasamos un concepto y luego lo practicamos.',
      'Hoy vamos con HTML semántico: header, nav, main y footer.',
    ],
  ),
  sentado(
    'Valeria',
    {
      modelo: 'mujer_vestido',
      sexo: 'f',
      tintes: { pelo: '#6b3f22', arriba: '#2bb5a8', piel: '#f0c7a6', zapatos: '#f0e6d8' },
      rasgos: { iris: '#5f7f60', pestanas: true },
    },
    '#1f8a80',
    [
      'Voy en cuarto semestre. Ya hice los retos de HTML y ahora le ayudo a mi grupo a repasar.',
      'Un consejo: antes de un reto, lee bien la consigna y haz un boceto de la página.',
    ],
  ),
  sentado(
    'Santiago',
    {
      modelo: 'hombre_casual',
      sexo: 'm',
      tintes: { pelo: '#3a2a1e', arriba: '#e2b41c', abajo: '#2d3a52', piel: '#a86f4a' },
      rasgos: { iris: '#2a1a10' },
    },
    '#9c7a12',
    [
      'Apenas voy en primer semestre. Todavía confundo div con section, por eso estoy repasando.',
      'Cuando lo tenga claro, cruzo el arco y voy a hacer los retos.',
    ],
  ),
  sentado(
    'Natalia',
    {
      modelo: 'mujer_blusa_larga',
      sexo: 'f',
      tintes: { pelo: '#18100c', arriba: '#7a3b4f', abajo: '#2b2f3a', piel: '#6f4630' },
      rasgos: { iris: '#2a1a10', pestanas: true, labios: '#8c3a44' },
    },
    '#7a3b4f',
    [
      'Voy en tercer semestre y estoy repasando CSS: colores con buen contraste y letra que se lea bien.',
      'Los retos se ponen más difíciles en cada edificio, así que estudiamos por partes.',
    ],
  ),
  sentado(
    'Esteban',
    {
      modelo: 'hombre_hoodie',
      sexo: 'm',
      tintes: { pelo: '#5a3a24', arriba: '#c0392b', abajo: '#3e5d8c', piel: '#e1ad87' },
      rasgos: { iris: '#5a3a22', barba: 'sombra' },
    },
    '#a8302a',
    [
      'Estamos estudiando con un resumen de las etiquetas para no olvidarlas en los retos.',
      'Si ya te sientes lista, los retos empiezan en el edificio HTML, pasando la plazoleta.',
    ],
  ),
  estudiante(
    'Camila',
    'fija',
    {
      modelo: 'mujer_casual',
      sexo: 'f',
      tintes: { pelo: '#2b1b14', arriba: '#f29db2', abajo: '#2b2f3a', piel: '#c98e62', zapatos: '#e9e6df' },
      rasgos: { iris: '#3b2416', pestanas: true },
    },
    '#c2457a',
    [
      'Somos de primer semestre y todavía estamos aprendiendo los conceptos básicos.',
      'Nos dijeron que los retos ayudan mucho, así que primero estudiamos y luego vamos a la plazoleta.',
    ],
  ),
];

export const JUGADORA = {
  modelo: 'jugadora',
  sexo: 'f',
  altura: 1.64,
  tintes: { pelo: '#2b1a12', arriba: '#d23b3b', abajo: '#34465f', piel: '#e0ac84', zapatos: '#e9e6df' },
  rasgos: { iris: '#5a3a22', pestanas: true, rubor: 0.24 },
};

export const TODOS = [...PERSONAJES, ...SENTADOS, ...PROFESORES, ...ENTRADA, ...ESTUDIO];

export function datosDePersona(nombreInteraccion) {
  const coincidencia = /^PERSONA_(\d+)$/.exec(nombreInteraccion ?? '');
  return coincidencia ? (TODOS[Number(coincidencia[1])] ?? null) : null;
}
