import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  CAMINAR,
  CORRER,
  LIMITE,
  animarAvatar,
  colocarEnInicio,
  crearEstadoJugador,
  moverJugador,
  tocaElSuelo,
} from '../src/escena/fisica.js';
import { describirInteraccion } from '../src/escena/interacciones.js';
import { procesarCampus } from '../src/escena/procesarCampus.js';
import { buscarCercano, zonaDe } from '../src/escena/proximidad.js';

function malla(nombre, geometria, material, posicion = [0, 0, 0]) {
  const objeto = new THREE.Mesh(geometria, material);
  objeto.name = nombre;
  objeto.position.set(...posicion);
  return objeto;
}

function punto(nombre, posicion) {
  const objeto = new THREE.Object3D();
  objeto.name = nombre;
  objeto.position.set(...posicion);
  return objeto;
}

function campusDePrueba() {
  const escena = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ name: 'M_Ladrillo' });
  escena.add(
    malla('WALK_Suelo', new THREE.PlaneGeometry(100, 100).rotateX(-Math.PI / 2), material),
    malla('COL_Muro', new THREE.BoxGeometry(1, 3, 10), material, [5, 1.5, 0]),
    malla('HTML_Muro_1', new THREE.BoxGeometry(1, 1, 1), material, [10, 0, 0]),
    malla('HTML_Muro_2', new THREE.BoxGeometry(1, 1, 1), material, [12, 0, 0]),
    malla('Rotulo_HTML_Tablero_A1', new THREE.PlaneGeometry(4, 2), material, [0, 2, -6]),
    malla('FLOAT_Holo', new THREE.BoxGeometry(1, 1, 1), material, [0, 3, 0]),
    malla('Avatar', new THREE.BoxGeometry(0.5, 1.2, 0.5).translate(0, 0.6, 0), material, [2, 0, 2]),
    malla('Avatar_armL', new THREE.BoxGeometry(0.15, 0.55, 0.15), material, [1.7, 1.17, 2]),
    punto('SPAWN_Jugador', [0, 0, 0]),
    punto('INT_HTML_Aula_A1', [0, 0, -4]),
    punto('EDIFICIO_HTML', [-40, 0, 0]),
  );
  return escena;
}

describe('procesamiento del campus', () => {
  const campus = procesarCampus(campusDePrueba());

  it('oculta colisiones y suelos y arma un colisionador con BVH', () => {
    expect(campus.escenario.getObjectByName('COL_Muro').visible).toBe(false);
    expect(campus.escenario.getObjectByName('WALK_Suelo').visible).toBe(false);
    expect(campus.colisionador.geometry.boundsTree).toBeDefined();
  });

  it('separa el avatar y deja sus extremidades listas para animarse', () => {
    expect(campus.avatar.children.map((parte) => parte.name)).toEqual(['Avatar']);
    const brazo = campus.avatar.getObjectByName('Avatar_armL');
    expect(brazo.parent.name).toBe('Avatar');
    brazo.geometry.computeBoundingBox();
    expect(brazo.geometry.boundingBox.max.y).toBeCloseTo(0);
    expect(campus.avatar.userData.partes.brazos).toEqual([brazo]);
    expect(campus.escenario.getObjectByName('Avatar')).toBeUndefined();
  });

  it('encuentra puntos, vistas de tablero, zonas y objetos animados', () => {
    expect(Object.keys(campus.puntos)).toEqual(
      expect.arrayContaining(['SPAWN_Jugador', 'INT_HTML_Aula_A1', 'EDIFICIO_HTML']),
    );
    expect(campus.vistas.INT_HTML_Aula_A1.posicion.z).toBeGreaterThan(-6);
    expect(campus.zonas.map((zona) => zona.nombre)).toContain('el edificio HTML');
    expect(campus.animados).toHaveLength(1);
  });

  it('une las mallas estáticas que comparten material y no repite el trabajo', () => {
    expect(campus.mallasFusionadas).toBe(1);
    expect(procesarCampus(campus.escenario)).toBe(campus);
  });
});

function caminar(campus, estado, teclas, segundos, camara) {
  for (let i = 0; i < Math.round(segundos * 60); i++) {
    moverJugador(campus, estado, teclas, camara, 1 / 60);
    animarAvatar(campus.avatar, estado, 1 / 60, false);
  }
}

function camaraMirandoA(x, z) {
  const camara = new THREE.PerspectiveCamera();
  camara.position.set(0, 2, 0);
  camara.lookAt(x, 2, z);
  return camara;
}

describe('movimiento del jugador', () => {
  it('cae hasta el suelo y no atraviesa un muro', () => {
    const campus = procesarCampus(campusDePrueba());
    colocarEnInicio(campus);
    campus.avatar.position.set(0, 2, 0);
    const estado = crearEstadoJugador();
    const camara = new THREE.PerspectiveCamera();
    camara.position.set(-10, 2, 0);
    camara.lookAt(0, 2, 0);
    for (let i = 0; i < 120; i++) moverJugador(campus, estado, new Set(['KeyW']), camara, 1 / 60);
    expect(campus.avatar.position.y).toBeLessThan(0.1);
    expect(campus.avatar.position.x).toBeLessThan(4.5);
    expect(campus.avatar.position.x).toBeGreaterThan(3);
  });
});

describe('proximidad e interacciones', () => {
  const puntos = {
    INT_HTML_Aula_A1: new THREE.Vector3(0, 0, -4),
    INT_HTML_Aula_A2: new THREE.Vector3(0, 4.2, -4),
    SPAWN_Jugador: new THREE.Vector3(),
  };

  it('encuentra el punto cercano del mismo piso', () => {
    expect(buscarCercano(new THREE.Vector3(0, 0, -3), puntos)).toBe('INT_HTML_Aula_A1');
    expect(buscarCercano(new THREE.Vector3(0, 4.2, -3), puntos)).toBe('INT_HTML_Aula_A2');
    expect(buscarCercano(new THREE.Vector3(0, 0, 3), puntos)).toBeNull();
  });

  it('nombra la zona donde está el jugador', () => {
    const zonas = [{ nombre: 'la plaza central', centro: new THREE.Vector3(), radio: 20 }];
    expect(zonaDe(new THREE.Vector3(1, 0, 1), zonas)).toBe('la plaza central');
    expect(zonaDe(new THREE.Vector3(30, 0, 0), zonas)).toBeNull();
  });

  it('describe el reto H1 y los avisos con buen español', () => {
    expect(describirInteraccion('INT_HTML_Aula_A1')).toMatchObject({
      tipo: 'reto',
      reto: 'H1',
      lugar: 'Aula 1 del edificio HTML',
    });
    expect(describirInteraccion('INT_GENAI_Puerta').lugar).toBe('Entrada del laboratorio de IA');
    expect(describirInteraccion('INT_CSS_Aula_A2').tipo).toBe('aviso');
  });
});

describe('movimiento natural', () => {
  it('acelera de a poco, corre con Shift y frena sin detenerse en seco', () => {
    const campus = procesarCampus(campusDePrueba());
    colocarEnInicio(campus);
    campus.avatar.position.set(0, 0, 10);
    const estado = crearEstadoJugador();
    const camara = camaraMirandoA(0, 30);
    caminar(campus, estado, new Set(), 0.3, camara);
    caminar(campus, estado, new Set(['KeyW']), 1 / 60, camara);
    expect(estado.rapidez).toBeGreaterThan(0);
    expect(estado.rapidez).toBeLessThan(CAMINAR / 2);
    caminar(campus, estado, new Set(['KeyW']), 1, camara);
    expect(estado.rapidez).toBeCloseTo(CAMINAR, 0);
    caminar(campus, estado, new Set(['KeyW', 'ShiftLeft']), 1, camara);
    expect(estado.rapidez).toBeCloseTo(CORRER, 0);
    caminar(campus, estado, new Set(), 1 / 60, camara);
    expect(estado.rapidez).toBeGreaterThan(CAMINAR);
    caminar(campus, estado, new Set(), 1, camara);
    expect(estado.rapidez).toBeLessThan(0.05);
  });

  it('mueve piernas y brazos en sentidos opuestos al caminar', () => {
    const campus = procesarCampus(campusDePrueba());
    colocarEnInicio(campus);
    campus.avatar.position.set(0, 0, 10);
    const estado = crearEstadoJugador();
    caminar(campus, estado, new Set(['KeyW']), 0.9, camaraMirandoA(0, 30));
    const { brazos, cuerpo } = campus.avatar.userData.partes;
    expect(Math.abs(brazos[0].rotation.x)).toBeGreaterThan(0.01);
    expect(cuerpo.rotation.x).toBeGreaterThan(0);
  });

  it('baja una rampa pegado al suelo, sin pequeños saltos', () => {
    const escena = campusDePrueba();
    const rampa = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 10).rotateX(-Math.PI / 2).rotateX(-0.5),
      new THREE.MeshStandardMaterial(),
    );
    rampa.name = 'WALK_Rampa';
    rampa.position.set(-20, 2.4, 0);
    escena.add(rampa);
    const campus = procesarCampus(escena);
    colocarEnInicio(campus);
    campus.avatar.position.set(-20, 4.5, 3.6);
    const estado = crearEstadoJugador();
    const camara = camaraMirandoA(0, -30);
    caminar(campus, estado, new Set(), 0.5, camara);
    let despegues = 0;
    for (let i = 0; i < 60; i++) {
      caminar(campus, estado, new Set(['KeyW']), 1 / 60, camara);
      if (!estado.enSuelo) despegues++;
    }
    expect(campus.avatar.position.z).toBeLessThan(2);
    expect(campus.avatar.position.y).toBeLessThan(3.5);
    expect(despegues).toBe(0);
  });

  it('no toma el error de redondeo de un choque como suelo', () => {
    expect(tocaElSuelo(1e-9, 0, 1 / 60)).toBe(false);
    expect(tocaElSuelo(0.0027, -0.16, 1 / 60)).toBe(true);
    expect(tocaElSuelo(0.0004, -0.16, 1 / 60)).toBe(false);
  });

  it('cae al suelo al pasar el borde de una plataforma, sin caminar en el aire', () => {
    const escena = campusDePrueba();
    const plataforma = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 6), new THREE.MeshStandardMaterial());
    plataforma.name = 'WALK_Plataforma';
    plataforma.position.set(-20, 1, 20);
    escena.add(plataforma);
    const campus = procesarCampus(escena);
    colocarEnInicio(campus);
    campus.avatar.position.set(-20, 2.2, 20);
    const estado = crearEstadoJugador();
    const camara = camaraMirandoA(0, 60);
    caminar(campus, estado, new Set(), 0.5, camara);
    expect(campus.avatar.position.y).toBeGreaterThan(1.9);
    caminar(campus, estado, new Set(['KeyW']), 3, camara);
    expect(campus.avatar.position.z).toBeGreaterThan(23.5);
    expect(campus.avatar.position.y).toBeLessThan(0.1);
  });

  it('no deja salir del campus y avisa al llegar al borde', () => {
    const escena = campusDePrueba();
    escena.add(
      malla(
        'WALK_Afueras',
        new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2),
        new THREE.MeshStandardMaterial(),
        [0, -0.001, 0],
      ),
    );
    const campus = procesarCampus(escena);
    colocarEnInicio(campus);
    campus.avatar.position.set(0, 0, LIMITE - 3);
    const estado = crearEstadoJugador();
    const camara = camaraMirandoA(0, 400);
    caminar(campus, estado, new Set(['KeyW', 'ShiftLeft']), 3, camara);
    expect(Math.hypot(campus.avatar.position.x, campus.avatar.position.z)).toBeLessThanOrEqual(LIMITE + 1e-6);
    expect(estado.enElBorde).toBe(true);
  });
});
