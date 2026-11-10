import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { alturaDelTecho, distanciaLibre, proyectarTablero } from '../src/escena/camara.js';
import { crearEstadoJugador, moverJugador } from '../src/escena/fisica.js';
import { crearMaterialesVegetales, tarjetasDeCopa } from '../src/escena/follaje.js';
import { ocupacionDelCampus } from '../src/escena/ocupacion.js';
import { capacidadDelPasto, crearHoja, sembrarPasto } from '../src/escena/pasto.js';
import { procesarCampus } from '../src/escena/procesarCampus.js';
import { alturaDelTerreno, crearBosque, crearTerreno } from '../src/escena/terreno.js';

function campusPlano() {
  const escena = new THREE.Group();
  const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial(),
  );
  suelo.name = 'WALK_Suelo';
  escena.add(suelo);
  return procesarCampus(escena);
}

function bvhDe(...mallas) {
  const geometria = new THREE.BufferGeometry();
  const posiciones = [];
  for (const malla of mallas) {
    malla.updateMatrixWorld(true);
    const plana = malla.geometry.toNonIndexed().applyMatrix4(malla.matrixWorld);
    posiciones.push(...plana.attributes.position.array);
  }
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  return new MeshBVH(geometria);
}

describe('salto', () => {
  it('sube con Espacio y vuelve a caer al suelo', () => {
    const campus = campusPlano();
    campus.avatar.position.set(0, 0, 0);
    const estado = crearEstadoJugador();
    const camara = new THREE.PerspectiveCamera();
    camara.position.set(0, 2, 5);
    camara.lookAt(0, 2, 0);
    for (let i = 0; i < 20; i++) moverJugador(campus, estado, new Set(), camara, 1 / 60);
    moverJugador(campus, estado, new Set(['Space']), camara, 1 / 60);
    let maxima = 0;
    for (let i = 0; i < 90; i++) {
      moverJugador(campus, estado, new Set(['Space']), camara, 1 / 60);
      maxima = Math.max(maxima, campus.avatar.position.y);
    }
    expect(maxima).toBeGreaterThan(0.6);
    expect(campus.avatar.position.y).toBeLessThan(0.05);
    expect(estado.enSuelo).toBe(true);
  });
});

describe('cámara en interiores', () => {
  const techo = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial(),
  );
  techo.position.y = 3;
  const muro = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 20), new THREE.MeshBasicMaterial());
  muro.position.set(0, 2, 0);
  const bvh = bvhDe(techo, muro);

  it('detecta el techo y acorta la distancia ante un muro', () => {
    expect(alturaDelTecho(bvh, new THREE.Vector3(3, 1.5, 0))).toBeCloseTo(1.5, 1);
    const libre = distanciaLibre(bvh, new THREE.Vector3(3, 1.5, 0), new THREE.Vector3(-1, 0, 0), 6);
    expect(libre).toBeLessThan(3);
    expect(libre).toBeGreaterThan(2);
  });

  it('proyecta el tablero del aula sobre la pantalla', () => {
    const camara = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100);
    camara.position.set(0, 0, 5);
    camara.updateMatrixWorld();
    const marco = {
      style: {
        setProperty(nombre, valor) {
          this[nombre] = valor;
        },
      },
    };
    const vista = {
      esquinas: [
        new THREE.Vector3(-1, 0.5, 0),
        new THREE.Vector3(1, 0.5, 0),
        new THREE.Vector3(1, -0.5, 0),
        new THREE.Vector3(-1, -0.5, 0),
      ],
    };
    proyectarTablero(marco, vista, camara, 1600, 900);
    expect(marco.style.visibility).toBe('visible');
    expect(parseFloat(marco.style.width)).toBeGreaterThan(200);
    expect(parseFloat(marco.style.left) + parseFloat(marco.style.width) / 2).toBeCloseTo(800, 0);
  });
});

describe('entorno lejano', () => {
  it('deja plano el campus y levanta colinas y una cordillera al oeste', () => {
    expect(alturaDelTerreno(10, 20)).toBe(0);
    expect(alturaDelTerreno(0, -600)).toBeGreaterThan(100);
    expect(alturaDelTerreno(0, -600)).toBeGreaterThan(alturaDelTerreno(0, 600));
    const terreno = crearTerreno();
    expect(terreno.cerca.attributes.uv).toBeDefined();
    expect(terreno.lejos.attributes.color).toBeDefined();
    expect(crearBosque(200).count).toBeGreaterThan(50);
  });

  it('arma copas con tarjetas de hojas y materiales con viento', () => {
    const azar = (() => {
      let i = 0;
      return () => (i++ * 0.618) % 1;
    })();
    const copa = tarjetasDeCopa(azar, {
      centros: [{ centro: new THREE.Vector3(0, 5, 0), radio: 2 }],
      centroCopa: new THREE.Vector3(0, 5, 0),
      tamano: 1.5,
      densidad: 6,
      alturaMinima: 3,
      alturaMaxima: 7,
    });
    expect(copa.attributes.position.count).toBe(24 * 6);
    const materiales = crearMaterialesVegetales({ saman: null });
    expect(materiales.hojas.saman.side).toBe(THREE.DoubleSide);
    expect(materiales.tiempo.value).toBe(0);
  });

  it('siembra pasto solo en el césped, nunca en el camino', () => {
    const escena = new THREE.Group();
    const camino = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 60).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial(),
    );
    camino.name = 'Superficie_caminos';
    escena.add(camino);
    const rejilla = ocupacionDelCampus(escena);
    const malla = new THREE.InstancedMesh(crearHoja(), new THREE.MeshBasicMaterial(), capacidadDelPasto());
    const cantidad = sembrarPasto(malla, rejilla, 0, 0);
    expect(cantidad).toBeGreaterThan(1000);
    const matriz = new THREE.Matrix4();
    const punto = new THREE.Vector3();
    for (let i = 0; i < cantidad; i += 97) {
      malla.getMatrixAt(i, matriz);
      punto.setFromMatrixPosition(matriz);
      expect(Math.abs(punto.x)).toBeGreaterThan(2);
    }
  });
});
