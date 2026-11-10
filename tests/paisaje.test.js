import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { crearEstadoJugador, moverJugador } from '../src/escena/fisica.js';
import { buscarRuta, consultar, ocupacionDelCampus } from '../src/escena/ocupacion.js';
import { procesarCampus } from '../src/escena/procesarCampus.js';
import { animarPuertas, prepararPuertas } from '../src/escena/puertas.js';
import { clasificarTriangulo, crearMateriales, rutasDeTexturas } from '../src/escena/superficies.js';
import {
  crearArbolFrondoso,
  crearAzar,
  crearPalma,
  ubicarBancas,
  ubicarVegetacion,
} from '../src/escena/vegetacion.js';

const ARRIBA = new THREE.Vector3(0, 1, 0);
const LADO = new THREE.Vector3(1, 0, 0);

function malla(nombre, geometria, material, posicion = [0, 0, 0]) {
  const objeto = new THREE.Mesh(geometria, material);
  objeto.name = nombre;
  objeto.position.set(...posicion);
  return objeto;
}

function texturasFalsas() {
  return Object.fromEntries(Object.keys(rutasDeTexturas()).map((clave) => [clave, new THREE.Texture()]));
}

function campusConSuperficies() {
  const paleta = new THREE.MeshStandardMaterial({ name: 'M_Paleta' });
  const escena = new THREE.Group();
  escena.add(
    malla('WALK_Suelo', new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), paleta),
    malla('Suelo', new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), paleta),
    malla('Camino_CSS', new THREE.PlaneGeometry(4, 40).rotateX(-Math.PI / 2), paleta, [0, 0.02, 0]),
    malla('HTML_Fachada', new THREE.BoxGeometry(10, 6, 10), paleta, [30, 3, 0]),
  );
  return escena;
}

describe('superficies del campus', () => {
  it('clasifica cada triángulo por objeto, color y orientación', () => {
    expect(clasificarTriangulo('Suelo', '#e6e1d6', ARRIBA)).toBe('cesped');
    expect(clasificarTriangulo('Camino_CSS', '#e07aa8', ARRIBA)).toBe('caminos');
    expect(clasificarTriangulo('Plaza_Escalon_Rojo', '#b8342c', LADO)).toBe('adoquin');
    expect(clasificarTriangulo('HTML_Pupitre_3', '#a8743f', ARRIBA)).toBe('madera');
    expect(clasificarTriangulo('HTML_Pupitre_3', '#22262f', LADO)).toBe('metal');
    expect(clasificarTriangulo('JS_Fachada', '#0e1a3a', LADO)).toBe('cristal');
    expect(clasificarTriangulo('CSS_Interior_Base', '#2a3160', ARRIBA)).toBe('terrazo');
    expect(clasificarTriangulo('CSS_Interior_Base', '#2a3160', LADO)).toBe('panete');
  });

  it('funde el campus por superficie con el color de la paleta y UV en metros', () => {
    const materiales = crearMateriales(texturasFalsas());
    const campus = procesarCampus(campusConSuperficies(), {
      materiales,
      muestrearPaleta: () => [224, 122, 168],
    });
    const cesped = campus.escenario.getObjectByName('Superficie_cesped');
    const caminos = campus.escenario.getObjectByName('Superficie_caminos');
    expect(cesped.material).toBe(materiales.cesped);
    expect(caminos.material).toBe(materiales.caminos);
    expect(campus.escenario.getObjectByName('Superficie_panete')).toBeDefined();
    const uv = caminos.geometry.attributes.uv;
    const posicion = caminos.geometry.attributes.position;
    expect(uv.getX(0)).toBeCloseTo(posicion.getX(0));
    expect(uv.getY(0)).toBeCloseTo(posicion.getZ(0));
    const color = caminos.geometry.attributes.color;
    expect(color.getX(0)).toBeGreaterThan(color.getY(0));
  });
});

describe('ocupación y rutas', () => {
  function plazaConMuro() {
    const escena = new THREE.Group();
    const piso = malla('Superficie_caminos', new THREE.PlaneGeometry(30, 12).rotateX(-Math.PI / 2), null);
    piso.material = new THREE.MeshBasicMaterial();
    const muro = malla('Muro', new THREE.BoxGeometry(0.4, 2, 9), new THREE.MeshBasicMaterial(), [0, 1, -1.5]);
    escena.add(piso, muro);
    return escena;
  }

  it('mide la distancia a caminos y obstáculos', () => {
    const rejilla = ocupacionDelCampus(plazaConMuro(), 20, 0.5, 0.4);
    expect(consultar(rejilla, 5, 0).camino).toBe(0);
    expect(consultar(rejilla, 5, 10).camino).toBeGreaterThan(3);
    expect(consultar(rejilla, 0.1, -1).bloqueo).toBe(0);
  });

  it('busca una ruta que rodea el muro por el hueco', () => {
    const rejilla = ocupacionDelCampus(plazaConMuro(), 20, 0.5, 0.4);
    const ruta = buscarRuta(rejilla, new THREE.Vector3(-8, 0, -3), new THREE.Vector3(8, 0, -3));
    expect(ruta.length).toBeGreaterThan(2);
    expect(Math.max(...ruta.map((punto) => punto.z))).toBeGreaterThan(3);
  });
});

describe('vegetación y mobiliario', () => {
  it('genera árboles y palmas con tronco sólido y follaje en tarjetas', () => {
    const saman = crearArbolFrondoso('saman', 1);
    const palma = crearPalma(2);
    expect(saman.solido.attributes.color.count).toBe(saman.solido.attributes.position.count);
    expect(saman.hojas.attributes.uv.count).toBe(saman.hojas.attributes.position.count);
    expect(saman.hojas.attributes.position.count).toBeGreaterThan(600);
    expect(palma.hojas.attributes.uv).toBeDefined();
    expect(crearAzar(5)()).toBe(crearAzar(5)());
  });

  it('ubica árboles lejos de los edificios y bancas junto a los caminos', () => {
    const escena = new THREE.Group();
    const camino = malla('Superficie_caminos', new THREE.PlaneGeometry(4, 160).rotateX(-Math.PI / 2), null);
    camino.material = new THREE.MeshBasicMaterial();
    const edificio = malla(
      'Edificio',
      new THREE.BoxGeometry(16, 8, 16),
      new THREE.MeshBasicMaterial(),
      [30, 4, 0],
    );
    escena.add(camino, edificio);
    const rejilla = ocupacionDelCampus(escena);
    const ubicacion = ubicarVegetacion(rejilla);
    expect(ubicacion.saman.length).toBeGreaterThan(0);
    for (const arbol of ubicacion.saman)
      expect(consultar(rejilla, arbol.x, arbol.z).edificio).toBeGreaterThanOrEqual(7);
    const bancas = ubicarBancas(rejilla);
    expect(bancas.length).toBeGreaterThan(0);
    for (const banca of bancas) expect(consultar(rejilla, banca.x, banca.z).camino).toBeLessThanOrEqual(2.1);
  });

  it('impide atravesar troncos y bancas', () => {
    const escena = new THREE.Group();
    escena.add(
      malla(
        'WALK_Suelo',
        new THREE.PlaneGeometry(50, 50).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial(),
      ),
    );
    const campus = procesarCampus(escena);
    campus.avatar.position.set(0, 0, 0);
    const camara = new THREE.PerspectiveCamera();
    camara.position.set(0, 2, 5);
    camara.lookAt(0, 2, 0);
    const estado = crearEstadoJugador();
    const obstaculos = [{ x: 0, y: 0, z: -3, radio: 0.5 }];
    for (let i = 0; i < 120; i++)
      moverJugador(campus, estado, new Set(['KeyW']), camara, 1 / 60, { obstaculos });
    expect(Math.hypot(campus.avatar.position.x, campus.avatar.position.z + 3)).toBeGreaterThanOrEqual(0.84);
  });
});

describe('puertas automáticas', () => {
  function edificioConPuerta() {
    const escena = new THREE.Group();
    escena.add(
      malla(
        'HTML_Puerta',
        new THREE.BoxGeometry(3.2, 2.4, 0.2).translate(0, 1.7, 0),
        new THREE.MeshBasicMaterial(),
        [0, 0, 7],
      ),
    );
    return escena;
  }

  it('divide la puerta en dos hojas que se abren al acercarse', () => {
    const [puerta] = prepararPuertas(edificioConPuerta());
    expect(puerta.izquierda.position.x).toBeCloseTo(-1.6);
    expect(puerta.derecha.position.x).toBeCloseTo(1.6);
    for (let i = 0; i < 60; i++) animarPuertas([puerta], [new THREE.Vector3(0, 0, 9)], 1 / 60, false);
    expect(puerta.izquierda.rotation.y).toBeGreaterThan(1.5);
    expect(puerta.derecha.rotation.y).toBeLessThan(-1.5);
    animarPuertas([puerta], [new THREE.Vector3(0, 0, 30)], 1 / 60, true);
    expect(puerta.izquierda.rotation.y).toBe(0);
  });

  it('ignora la colisión de la puerta para poder entrar', () => {
    const escena = edificioConPuerta();
    const material = new THREE.MeshBasicMaterial();
    escena.add(
      malla('WALK_Suelo', new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), material),
      malla('COL_HTML_Puerta', new THREE.BoxGeometry(3.4, 3, 0.35), material, [0, 1.5, 7]),
    );
    const campus = procesarCampus(escena);
    campus.avatar.position.set(0, 0, 11);
    const camara = new THREE.PerspectiveCamera();
    camara.position.set(0, 2, 16);
    camara.lookAt(0, 2, 0);
    const estado = crearEstadoJugador();
    for (let i = 0; i < 240; i++) moverJugador(campus, estado, new Set(['KeyW']), camara, 1 / 60);
    expect(campus.avatar.position.z).toBeLessThan(5);
    expect(campus.puertas).toHaveLength(1);
  });
});
