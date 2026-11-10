import * as THREE from 'three';
import { consultar } from './ocupacion.js';
import { alturaDelTerreno } from './terreno.js';

export const MITAD = 19;
const CELDA = 0.24;
const matriz = new THREE.Matrix4();
const posicion = new THREE.Vector3();
const cuaternion = new THREE.Quaternion();
const escala = new THREE.Vector3();
const EJE = new THREE.Vector3(0, 1, 0);
const color = new THREE.Color();
const base = new THREE.Color('#4f7d34');
const punta = new THREE.Color('#9dc457');

function azar(i, j, k) {
  const s = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

export function crearHoja() {
  const niveles = [0, 0.3, 0.62, 1];
  const posiciones = [];
  const colores = [];
  const normales = [];
  const indices = [];
  niveles.forEach((t, n) => {
    const ancho = 0.035 * (1 - t) + 0.002;
    const curva = 0.12 * t * t;
    const c = base.clone().lerp(punta, t);
    for (const lado of [-1, 1]) {
      posiciones.push(lado * ancho, t, curva);
      colores.push(c.r, c.g, c.b);
      normales.push(0, 0.8, 0.6);
    }
    if (n > 0) {
      const a = (n - 1) * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  });
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geometria.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
  geometria.setAttribute('normal', new THREE.Float32BufferAttribute(normales, 3));
  geometria.setIndex(indices);
  return geometria;
}

export function capacidadDelPasto() {
  const lado = Math.ceil((MITAD * 2) / CELDA) + 1;
  return lado * lado;
}

export function sembrarPasto(malla, rejilla, centroX, centroZ, excluir = null) {
  const desde = Math.floor((centroX - MITAD) / CELDA);
  const hasta = Math.floor((centroX + MITAD) / CELDA);
  const desdeZ = Math.floor((centroZ - MITAD) / CELDA);
  const hastaZ = Math.floor((centroZ + MITAD) / CELDA);
  let cantidad = 0;
  for (let i = desde; i <= hasta; i++) {
    for (let j = desdeZ; j <= hastaZ; j++) {
      const x = (i + azar(i, j, 1)) * CELDA;
      const z = (j + azar(i, j, 2)) * CELDA;
      const lugar = rejilla ? consultar(rejilla, x, z) : null;
      if (lugar && (lugar.camino < 0.8 || lugar.edificio < 0.8)) continue;
      if (excluir?.(x, z)) continue;
      posicion.set(x, alturaDelTerreno(x, z), z);
      cuaternion.setFromAxisAngle(EJE, azar(i, j, 3) * Math.PI * 2);
      const alto = 0.13 + azar(i, j, 4) * 0.17;
      escala.set(0.8 + azar(i, j, 5) * 0.6, alto, 0.8 + azar(i, j, 6) * 0.4);
      malla.setMatrixAt(cantidad, matriz.compose(posicion, cuaternion, escala));
      const tono = 0.82 + azar(i, j, 7) * 0.32;
      malla.setColorAt(cantidad, color.setRGB(tono, tono * (0.96 + azar(i, j, 8) * 0.08), tono * 0.9));
      cantidad++;
      if (cantidad >= malla.instanceMatrix.count) break;
    }
  }
  malla.count = cantidad;
  malla.instanceMatrix.needsUpdate = true;
  if (malla.instanceColor) malla.instanceColor.needsUpdate = true;
  return cantidad;
}

export function crearMaterialDePasto() {
  const uniformes = { uTiempo: { value: 0 }, uCentro: { value: new THREE.Vector3() } };
  const material = new THREE.MeshStandardMaterial({
    name: 'Pasto',
    vertexColors: true,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTiempo = uniformes.uTiempo;
    shader.uniforms.uCentro = uniformes.uCentro;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTiempo;\nuniform vec3 uCentro;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec3 raiz = vec3( instanceMatrix[3].x, 0.0, instanceMatrix[3].z );
        float lejos = distance( raiz.xz, uCentro.xz );
        float encoger = smoothstep( ${(MITAD - 1).toFixed(1)}, ${(MITAD - 7).toFixed(1)}, lejos );
        transformed *= encoger;
        float viento = sin( uTiempo * 1.8 + raiz.x * 0.35 + raiz.z * 0.27 ) * 0.5 + sin( uTiempo * 3.1 + raiz.x * 1.3 ) * 0.2;
        transformed.z += viento * 0.18 * position.y * position.y;`,
      );
  };
  material.customProgramCacheKey = () => 'pasto-viento';
  return { material, uniformes };
}
