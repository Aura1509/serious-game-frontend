import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  ENTRADA,
  ESTUDIO,
  JUGADORA,
  PERSONAJES,
  PROFESORES,
  SENTADOS,
} from '../src/escena/conversaciones.js';
import { claveDelGesto, crearCara, dibujarCara } from '../src/escena/caras.js';
import {
  MODELOS,
  animarCara,
  crearPersonaje,
  paletaDe,
  prepararAnimaciones,
  urlsDelElenco,
} from '../src/escena/elenco.js';
import { animarPersonaje, clipsPorSexo, ponerGafas, RUTA_ANIMACIONES } from '../src/escena/personajes.js';
import { mostrarLetrero } from '../src/escena/personas.js';

const cargador = new GLTFLoader();
const CLIPS = [
  'f_idle_neutral_01',
  'f_walk_neutral_01',
  'f_walk_fast_01',
  'f_sit_chair_idle_neutral_01',
  'm_idle_neutral_01',
  'm_walk_neutral_01',
];
const posicion = (hueso) => hueso.getWorldPosition(new THREE.Vector3());

function cargar(url) {
  const datos = new Uint8Array(readFileSync(resolve('public', url.replace('./', ''))));
  return cargador.parseAsync(datos.buffer, '');
}

function huesos(personaje) {
  const resultado = {};
  personaje.escena.traverse((objeto) => {
    if (objeto.isBone) resultado[objeto.name] = objeto;
  });
  return resultado;
}

function inclinacionDeLaCara(raiz) {
  raiz.updateMatrixWorld(true);
  const hueso = (nombre) => raiz.getObjectByName(nombre);
  const ojos = posicion(hueso('Ojo_L'))
    .add(posicion(hueso('Ojo_R')))
    .multiplyScalar(0.5);
  const cara = ojos.sub(posicion(hueso('Neck'))).normalize();
  return THREE.MathUtils.radToDeg(Math.atan2(cara.z, cara.y));
}

function animar(personaje, entrada, segundos) {
  for (let i = 0; i < Math.round(segundos * 30); i++) animarPersonaje(personaje, entrada, 1 / 30);
  personaje.grupo.updateMatrixWorld(true);
}

const modelos = {};
let animaciones;

beforeAll(async () => {
  const urls = urlsDelElenco();
  const gltfs = await Promise.all(urls.map(cargar));
  urls.forEach((url, i) => {
    modelos[MODELOS[i]] = gltfs[i];
  });
  const rutas = CLIPS.map((nombre) => `${RUTA_ANIMACIONES}${nombre}.glb`);
  animaciones = prepararAnimaciones(clipsPorSexo(await Promise.all(rutas.map(cargar)), rutas));
});

describe('modelos de Quaternius convertidos', () => {
  it('tienen un cuerpo suave para teñir y una cara para dibujar, en pose de T', () => {
    for (const nombre of MODELOS) {
      const escena = modelos[nombre].scene;
      const mallas = [];
      escena.traverse((objeto) => {
        if (objeto.isMesh) mallas.push(objeto);
      });
      expect(mallas).toHaveLength(2);
      const cuerpo = mallas.find((malla) => malla.geometry.getAttribute('_parte'));
      const cara = mallas.find((malla) => malla.geometry.getAttribute('uv'));
      expect(cuerpo.isSkinnedMesh && cara.isSkinnedMesh).toBe(true);
      const vertices = cuerpo.geometry.getAttribute('position').count;
      expect(vertices).toBeLessThan((cuerpo.geometry.index.count / 3) * 1.3);
      const datos = escena.children[0].userData;
      const grupos = datos.partes.map((parte) => parte.grupo);
      expect(grupos).toEqual(expect.arrayContaining(['piel', 'pelo', 'arriba']));
      expect(grupos).not.toContain('ojos');
      expect(datos.cara.ojoI[0]).toBeGreaterThan(datos.cara.ojoD[0]);
      expect(datos.cara.boca[1]).toBeLessThan(datos.cara.ojoD[1]);
      for (const hueso of ['Ojo_L', 'Ojo_R', 'Head', 'Wrist_R']) {
        expect(escena.getObjectByName(hueso)?.isBone).toBe(true);
      }
      expect(escena.getObjectByName('Foot_L').parent.name).toBe('LowerLeg_L');
      escena.updateMatrixWorld(true);
      const brazo = posicion(escena.getObjectByName('Wrist_L')).sub(
        posicion(escena.getObjectByName('UpperArm_L')),
      );
      expect(Math.abs(brazo.normalize().y)).toBeLessThan(0.05);
    }
  });

  it('tiñe la ropa, el pelo y la piel, y oscurece las cejas con el color del pelo', () => {
    const partes = modelos.mujer_casual.scene.children[0].userData.partes;
    const paleta = paletaDe(partes, { pelo: '#ff0000', arriba: '#00ff00' });
    const rojo = new THREE.Color('#ff0000');
    partes.forEach((parte, i) => {
      if (parte.grupo === 'pelo') expect(paleta[i].r).toBeCloseTo(rojo.r * parte.factor);
      if (parte.grupo === 'cejas') expect(paleta[i].r).toBeCloseTo(rojo.r * parte.factor * 0.55);
      if (parte.grupo === 'arriba') expect(paleta[i].g).toBeGreaterThan(0.5);
      if (parte.grupo === 'piel')
        expect(paleta[i].toArray()).toEqual(parte.color.map((v) => expect.closeTo(v)));
    });
  });

  it('cada persona del elenco usa un modelo que existe', () => {
    const elenco = [...PERSONAJES, ...SENTADOS, ...PROFESORES, ...ENTRADA, ...ESTUDIO, { aspecto: JUGADORA }];
    for (const persona of elenco) {
      expect(MODELOS).toContain(persona.aspecto.modelo);
    }
  });
});

describe('animaciones adaptadas al esqueleto', () => {
  it('queda de pie con los brazos abajo, la cabeza derecha y los pies en el suelo', () => {
    const personaje = crearPersonaje(modelos.jugadora, animaciones, { ...JUGADORA, marchas: 'jugador' });
    animar(personaje, { rapidez: 0 }, 1);
    const h = huesos(personaje);
    expect(posicion(h.Wrist_L).y).toBeLessThan(posicion(h.UpperArm_L).y - 0.35);
    expect(posicion(h.Wrist_R).y).toBeLessThan(posicion(h.UpperArm_R).y - 0.35);
    const inclinacion = inclinacionDeLaCara(personaje.escena) - inclinacionDeLaCara(modelos.jugadora.scene);
    expect(Math.abs(inclinacion)).toBeLessThan(12);
    const tobillos = Math.min(posicion(h.Foot_L).y, posicion(h.Foot_R).y);
    expect(tobillos).toBeGreaterThan(0.02);
    expect(tobillos).toBeLessThan(0.2);
    const caja = new THREE.Box3().setFromObject(personaje.grupo, true);
    expect(caja.max.y).toBeGreaterThan(JUGADORA.altura - 0.12);
    expect(caja.max.y).toBeLessThan(JUGADORA.altura + 0.05);
  });

  it('alterna las piernas al caminar y se sienta a la altura de una banca', () => {
    const personaje = crearPersonaje(modelos.mujer_casual, animaciones, { altura: 1.62 });
    const h = huesos(personaje);
    const lados = new Set();
    for (let i = 0; i < 40; i++) {
      animar(personaje, { rapidez: 1.2 }, 0.05);
      lados.add(Math.sign(posicion(h.Foot_L).z - posicion(h.Foot_R).z));
    }
    expect(lados).toEqual(new Set([1, -1]));
    animar(personaje, { sentado: 1 }, 1.5);
    const cadera = posicion(h.UpperLeg_L).y;
    expect(cadera).toBeGreaterThan(0.35);
    expect(cadera).toBeLessThan(0.75);
    expect(posicion(h.LowerLeg_L).z - posicion(h.UpperLeg_L).z).toBeGreaterThan(0.25);
  });

  it('también anima a los hombres con sus propias capturas', () => {
    const personaje = crearPersonaje(modelos.hombre_traje, animaciones, {
      modelo: 'hombre_traje',
      altura: 1.74,
    });
    expect(personaje.sexo).toBe('m');
    animar(personaje, { rapidez: 0 }, 1);
    const h = huesos(personaje);
    expect(posicion(h.Wrist_L).y).toBeLessThan(posicion(h.UpperArm_L).y - 0.35);
  });
});

describe('cara de los personajes', () => {
  it('parpadea, abre la boca al hablar y se queda quieta con movimiento reducido', () => {
    const personaje = crearPersonaje(modelos.mujer_traje, animaciones, { modelo: 'mujer_traje' });
    expect(personaje.cara.disposicion.metro).toBeGreaterThan(1);
    personaje.estadoCara = { parpadeo: 0.01, cierre: 0, reloj: 0 };
    animarCara(personaje, {}, 0.05);
    expect(personaje.cara.gesto.ojos).toBeLessThan(0.6);
    animarCara(personaje, { hablando: true }, 0.4);
    expect(personaje.cara.gesto.boca).toBeGreaterThan(0.2);
    expect(personaje.cara.gesto.cejas).toBeGreaterThan(0);
    animarCara(personaje, { hablando: true, alegria: 0.75, reducir: true }, 0.03);
    expect(personaje.cara.gesto).toMatchObject({ ojos: 0.8, boca: 0, sonrisa: 0.75 });
  });

  it('solo vuelve a dibujar la cara cuando cambia el gesto', () => {
    const cara = crearCara({ ojoD: [0.3, 0.7], ojoI: [0.7, 0.7], boca: [0.5, 0.3], nariz: [0.5, 0.45] });
    expect(dibujarCara(cara)).toBe(false);
    cara.gesto.ojos = 0.98;
    expect(dibujarCara(cara)).toBe(false);
    cara.gesto.boca = 0.6;
    expect(dibujarCara(cara)).toBe(true);
    expect(claveDelGesto(cara.gesto)).toBe(cara.clave);
  });

  it('pone las gafas delante de los ojos', () => {
    const personaje = crearPersonaje(modelos.hombre_traje_b, animaciones, { modelo: 'hombre_traje_b' });
    personaje.grupo.updateMatrixWorld(true);
    const gafas = ponerGafas(personaje, { oscuras: false, adelante: 0.024 });
    personaje.grupo.updateMatrixWorld(true);
    const ojos = posicion(personaje.huesos.ojoD);
    const centro = gafas.getWorldPosition(new THREE.Vector3());
    expect(centro.z).toBeGreaterThan(ojos.z);
    expect(centro.y).toBeCloseTo(ojos.y, 2);
    expect(ponerGafas(personaje)).toBe(gafas);
  });
});

describe('profesores y estudiantes de la entrada', () => {
  const CURSOS = ['Desarrollo de Software I', 'Desarrollo de Software II', 'Proyecto Integrador I'];

  it('cada profesor dice su nombre y su curso y da consejos de desarrollo', () => {
    for (const datos of PROFESORES) {
      expect(CURSOS).toContain(datos.curso);
      expect(datos.lineas[0]).toMatch(/^Hola, soy (la profesora|el profesor) /);
      expect(datos.lineas[0]).toContain(datos.curso);
      expect(datos.lineas.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('los estudiantes de la entrada indican ir a la plazoleta', () => {
    for (const datos of ENTRADA) {
      expect(datos.lineas.join(' ')).toContain('plazoleta');
    }
  });

  it('los de la zona de estudio cuentan que estudian o empiezan la carrera antes de los retos', () => {
    expect(ESTUDIO.filter((datos) => datos.tipo === 'sentada').length).toBeGreaterThanOrEqual(5);
    for (const datos of ESTUDIO) {
      const texto = datos.lineas.join(' ');
      expect(texto).toMatch(/retos/);
      expect(texto).toMatch(/semestre|aprend|estudi|repas/);
    }
  });

  it('muestra el letrero de un profesor solo cuando el jugador está cerca', () => {
    const grupo = new THREE.Group();
    grupo.position.set(10, 0, 0);
    const profesor = { datos: PROFESORES[0], grupo };
    const estudiante = { datos: ENTRADA[0], grupo };
    expect(mostrarLetrero(profesor, new THREE.Vector3(0, 0, 0))).toBe(true);
    expect(mostrarLetrero(profesor, new THREE.Vector3(40, 0, 0))).toBe(false);
    expect(mostrarLetrero(profesor, new THREE.Vector3(10, 8, 0))).toBe(false);
    expect(mostrarLetrero(estudiante, new THREE.Vector3(10, 0, 1))).toBe(false);
  });
});
