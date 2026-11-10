import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import h1 from '../data/retos/html/H1.json';
import {
  consejoDeZona,
  consejoPedido,
  frases,
  mensajesDeTeoria,
  pistasDisponibles,
  saludo,
  siguienteConsejo,
} from '../src/asistente/guion.js';
import { crearEstadoRobot, crearRobot, moverRobot, puntoDeVuelo } from '../src/escena/robot.js';
import { leerPreferencia } from '../src/ui/preferencias.js';

function bvhDe(...mallas) {
  const posiciones = [];
  for (const malla of mallas) {
    malla.updateMatrixWorld(true);
    const plana = malla.geometry.toNonIndexed().applyMatrix4(malla.matrixWorld);
    posiciones.push(...plana.attributes.position.array);
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  return new MeshBVH(geometria);
}

function volar(robot, estado, entrada, pasos = 180) {
  for (let i = 0; i < pasos; i++) moverRobot(robot, estado, { dt: 1 / 60, ...entrada });
}

describe('robot asistente', () => {
  it('se arma con figuras básicas y una pantalla que dibuja ojos y boca', () => {
    const robot = crearRobot();
    let piezas = 0;
    robot.grupo.traverse((objeto) => {
      if (objeto.isMesh) piezas += 1;
    });
    expect(piezas).toBeGreaterThan(12);
    const { uniforms } = robot.pantalla.material;
    expect(uniforms.uBoca.value).toBe(0);
    expect(uniforms.uAbierto.value).toBe(1);
    expect(robot.grupo.userData.partes).toBe(robot);
  });

  it('vuela al lado del jugador, a la altura de su cabeza', () => {
    const camara = new THREE.PerspectiveCamera();
    camara.position.set(0, 3, 6);
    camara.lookAt(0, 1.5, 0);
    camara.updateMatrixWorld();
    const objetivo = puntoDeVuelo(new THREE.Vector3(), new THREE.Vector3(), camara);
    expect(objetivo.x).toBeGreaterThan(0.8);
    expect(objetivo.y).toBeCloseTo(1.62);
    const robot = crearRobot();
    const estado = crearEstadoRobot();
    moverRobot(robot, estado, { objetivo: new THREE.Vector3(), dt: 1 / 60 });
    volar(robot, estado, { objetivo });
    expect(robot.grupo.position.distanceTo(objetivo)).toBeLessThan(0.05);
  });

  it('no atraviesa un muro ni se mete en el techo', () => {
    const muro = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 6), new THREE.MeshBasicMaterial());
    muro.position.set(0.55, 2, 0);
    const techo = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20).rotateX(Math.PI / 2),
      new THREE.MeshBasicMaterial(),
    );
    techo.position.y = 2;
    const bvh = bvhDe(muro, techo);
    const robot = crearRobot();
    const estado = crearEstadoRobot();
    const origen = new THREE.Vector3(0, 1.45, 0);
    volar(robot, estado, { objetivo: new THREE.Vector3(1, 1.6, 0), origen, bvh });
    expect(robot.grupo.position.x).toBeLessThan(0.45);
    expect(robot.grupo.position.y).toBeLessThan(1.41);
  });

  it('mueve la boca al hablar y sonríe al celebrar', () => {
    const robot = crearRobot();
    const estado = crearEstadoRobot();
    const objetivo = new THREE.Vector3(0, 1.6, 0);
    let abierta = 0;
    for (let i = 0; i < 60; i++) {
      moverRobot(robot, estado, { objetivo, dt: 1 / 60, hablando: true });
      abierta = Math.max(abierta, robot.pantalla.material.uniforms.uBoca.value);
    }
    expect(abierta).toBeGreaterThan(0.4);
    volar(robot, estado, { objetivo, fiesta: true }, 60);
    expect(robot.pantalla.material.uniforms.uFeliz.value).toBeGreaterThan(0.9);
    volar(robot, estado, { objetivo, hablando: true, reducir: true }, 30);
    expect(robot.cuerpo.position.y).toBe(0);
  });
});

describe('guion del robot', () => {
  it('reparte la teoría en frases cortas y agrega el ejemplo animado', () => {
    expect(frases('Uno. Dos y tres. Cuatro.', 5)).toEqual(['Uno. Dos y tres.', 'Cuatro.']);
    const mensajes = mensajesDeTeoria(h1.partes[0], 1, h1.partes.length);
    expect(mensajes.length).toBeGreaterThan(1);
    expect(mensajes.at(-1).ejemplo.despues).toContain('nav');
    expect(mensajes[0].etiqueta).toBe('Teoría, parte 1 de 2');
  });

  it('da pistas graduales: una por intento y cada parte de H1 trae tres', () => {
    for (const parte of h1.partes) expect(parte.pistas).toHaveLength(3);
    expect(pistasDisponibles(h1.partes[0], 0)).toBe(1);
    expect(pistasDisponibles(h1.partes[0], 1)).toBe(2);
    expect(pistasDisponibles(h1.partes[0], 9)).toBe(3);
    expect(pistasDisponibles({ teoria: '' }, 4)).toBe(0);
  });

  it('da cada consejo una sola vez y narra los edificios', () => {
    const vistos = new Set();
    const ids = [];
    for (let consejo = siguienteConsejo(vistos); consejo; consejo = siguienteConsejo(vistos)) {
      vistos.add(consejo.id);
      ids.push(consejo.id);
    }
    expect(new Set(ids).size).toBe(ids.length);
    expect(siguienteConsejo(new Set(), { correr: true }).texto).toContain('caminar');
    expect(consejoDeZona('el edificio HTML', false).texto).toContain('aula 1');
    expect(consejoDeZona('el edificio HTML', true).texto).not.toContain('aula 1');
    expect(consejoDeZona('un lugar desconocido')).toBeNull();
    expect(saludo(false)[0].gesto).toBe('saludar');
    expect(consejoPedido({ info: null, superado: false }).gesto).toBe('senalar');
  });

  it('deja los consejos activos por defecto', () => {
    const vacio = { getItem: () => null, setItem: () => {} };
    expect(leerPreferencia('consejos-del-robot', vacio, true)).toBe(true);
    expect(leerPreferencia('voz-del-robot', vacio)).toBe(false);
  });
});
