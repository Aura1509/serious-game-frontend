import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshBVH } from 'three-mesh-bvh';

const INICIO = 100;
const CERCA = 330;
const LEJOS = 1000;

function azar2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function ruido(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = azar2(xi, yi);
  const b = azar2(xi + 1, yi);
  const c = azar2(xi, yi + 1);
  const d = azar2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, y, octavas = 5) {
  let valor = 0;
  let amplitud = 0.5;
  let frecuencia = 1;
  for (let i = 0; i < octavas; i++) {
    valor += amplitud * ruido(x * frecuencia, y * frecuencia);
    frecuencia *= 2.03;
    amplitud *= 0.5;
  }
  return valor;
}

const lisa = (a, b, t) => {
  const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};

export function alturaDelTerreno(x, z) {
  const r = Math.hypot(x, z);
  if (r < INICIO) return 0;
  const angulo = Math.atan2(x, z);
  const diferencia = Math.atan2(Math.sin(angulo - Math.PI), Math.cos(angulo - Math.PI));
  const oeste = Math.exp(-(diferencia * diferencia) / 0.5);
  const colinas = (fbm(x * 0.011 + 10, z * 0.011 - 4) - 0.32) * 70 * lisa(INICIO, 240, r);
  const cordillera = oeste * lisa(240, 560, r) * (150 + 170 * fbm(x * 0.005 + 3, z * 0.005 + 7, 6));
  const lomas = (1 - oeste) * lisa(400, 800, r) * 90 * fbm(x * 0.004 - 2, z * 0.004 + 5);
  return Math.max(0.03, colinas + 0.05) + cordillera + lomas;
}

function anillo(radioInterior, radioExterior, anillos, segmentos, conColor) {
  const posiciones = [];
  const uvs = [];
  const colores = [];
  const indices = [];
  const pasto = new THREE.Color('#6f9a4e');
  const bosque = new THREE.Color('#2f5a2a');
  const roca = new THREE.Color('#5b6b52');
  const color = new THREE.Color();
  for (let j = 0; j <= anillos; j++) {
    const t = j / anillos;
    const radio = radioInterior + (radioExterior - radioInterior) * t * t;
    for (let i = 0; i <= segmentos; i++) {
      const angulo = (i / segmentos) * Math.PI * 2;
      const x = Math.sin(angulo) * radio;
      const z = Math.cos(angulo) * radio;
      const y = alturaDelTerreno(x, z);
      posiciones.push(x, y, z);
      uvs.push(x, z);
      if (conColor) {
        const altura = THREE.MathUtils.clamp(y / 160, 0, 1);
        const mancha = fbm(x * 0.02, z * 0.02, 3);
        color.copy(pasto).lerp(bosque, THREE.MathUtils.clamp((mancha - 0.35) * 2.2 + altura * 0.5, 0, 1));
        color.lerp(roca, Math.max(0, altura - 0.7) * 1.5);
        colores.push(color.r, color.g, color.b);
      }
    }
  }
  for (let j = 0; j < anillos; j++) {
    for (let i = 0; i < segmentos; i++) {
      const a = j * (segmentos + 1) + i;
      const b = a + segmentos + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geometria.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  if (conColor) geometria.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
  geometria.setIndex(indices);
  geometria.computeVertexNormals();
  geometria.computeBoundingSphere();
  return geometria;
}

export function crearTerreno() {
  return {
    cerca: anillo(INICIO - 2, CERCA, 46, 220, false),
    lejos: anillo(CERCA - 10, LEJOS, 40, 200, true),
  };
}

function arbolLejano(semilla) {
  const azar = () => {
    semilla = (semilla * 16807) % 2147483647;
    return semilla / 2147483647;
  };
  const altura = 6 + azar() * 6;
  const tronco = new THREE.CylinderGeometry(0.18, 0.3, altura * 0.45, 6, 1).translate(0, altura * 0.22, 0);
  const copa = new THREE.IcosahedronGeometry(altura * 0.32, 0)
    .scale(1, 0.85, 1)
    .translate(0, altura * 0.62, 0);
  const pintar = (geometria, hex) => {
    const plano = geometria.index ? geometria.toNonIndexed() : geometria;
    plano.deleteAttribute('uv');
    const color = new THREE.Color(hex);
    const colores = new Float32Array(plano.attributes.position.count * 3);
    for (let i = 0; i < plano.attributes.position.count; i++) {
      const y = plano.attributes.position.getY(i);
      const luz = 0.75 + 0.35 * THREE.MathUtils.clamp((y - altura * 0.4) / (altura * 0.6), 0, 1);
      colores.set([color.r * luz, color.g * luz, color.b * luz], i * 3);
    }
    plano.setAttribute('color', new THREE.BufferAttribute(colores, 3));
    return plano;
  };
  return mergeGeometries([pintar(tronco, '#5b4a3a'), pintar(copa, '#3f7334')], false);
}

export function crearBosque(cantidad = 3200, semilla = 91) {
  let estado = semilla;
  const azar = () => {
    estado = (estado * 16807) % 2147483647;
    return estado / 2147483647;
  };
  const geometria = arbolLejano(7);
  const material = new THREE.MeshStandardMaterial({ name: 'Bosque', vertexColors: true, roughness: 0.95 });
  const malla = new THREE.InstancedMesh(geometria, material, cantidad);
  const matriz = new THREE.Matrix4();
  const cuaternion = new THREE.Quaternion();
  const escala = new THREE.Vector3();
  const posicion = new THREE.Vector3();
  const color = new THREE.Color();
  const tonos = ['#3f7334', '#4c8a3c', '#35602c', '#5a8f3e', '#6e8a3a'];
  let colocados = 0;
  for (let intento = 0; intento < cantidad * 4 && colocados < cantidad; intento++) {
    const angulo = azar() * Math.PI * 2;
    const radio = INICIO + 8 + Math.pow(azar(), 1.6) * 620;
    const x = Math.sin(angulo) * radio;
    const z = Math.cos(angulo) * radio;
    const densidad = fbm(x * 0.015 + 4, z * 0.015 - 9, 3);
    if (densidad < 0.36) continue;
    posicion.set(x, alturaDelTerreno(x, z) - 0.3, z);
    cuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), azar() * Math.PI * 2);
    escala.setScalar(0.9 + azar() * 1.1 + radio / 500);
    malla.setMatrixAt(colocados, matriz.compose(posicion, cuaternion, escala));
    malla.setColorAt(colocados, color.set(tonos[Math.floor(azar() * tonos.length)]));
    colocados++;
  }
  malla.count = colocados;
  malla.instanceMatrix.needsUpdate = true;
  if (malla.instanceColor) malla.instanceColor.needsUpdate = true;
  malla.computeBoundingSphere();
  malla.receiveShadow = true;
  return malla;
}

function texturaDeVentanas() {
  if (typeof document === 'undefined' || /jsdom/.test(globalThis.navigator?.userAgent ?? '')) return null;
  const lienzo = document.createElement('canvas');
  lienzo.width = 128;
  lienzo.height = 128;
  const c = lienzo.getContext?.('2d');
  if (!c) return null;
  c.fillStyle = '#efe9dd';
  c.fillRect(0, 0, 128, 128);
  c.fillStyle = '#2f4a62';
  c.fillRect(16, 26, 96, 52);
  c.fillStyle = 'rgba(255, 255, 255, 0.35)';
  c.fillRect(16, 26, 96, 8);
  c.fillStyle = '#b8b0a2';
  c.fillRect(0, 100, 128, 10);
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.wrapS = THREE.RepeatWrapping;
  textura.wrapT = THREE.RepeatWrapping;
  return textura;
}

export function crearEdificiosLejanos(semilla = 17) {
  let estado = semilla;
  const azar = () => {
    estado = (estado * 16807) % 2147483647;
    return estado / 2147483647;
  };
  const partes = [];
  const techos = [];
  for (let i = 0; i < 14; i++) {
    const angulo = (i / 14) * Math.PI * 2 + azar() * 0.25;
    if (Math.abs(Math.atan2(Math.sin(angulo - Math.PI), Math.cos(angulo - Math.PI))) < 0.5) continue;
    const radio = INICIO + 6 + azar() * 22;
    const pisos = 2 + Math.floor(azar() * 3);
    const ancho = 18 + azar() * 16;
    const fondo = 10 + azar() * 6;
    const alto = pisos * 3.6;
    const x = Math.sin(angulo) * radio;
    const z = Math.cos(angulo) * radio;
    const base = alturaDelTerreno(x, z);
    const caja = new THREE.BoxGeometry(ancho, alto, fondo).toNonIndexed();
    const posicion = caja.attributes.position;
    const normal = caja.attributes.normal;
    const uv = caja.attributes.uv;
    for (let k = 0; k < posicion.count; k++) {
      const nx = Math.abs(normal.getX(k));
      const lado = nx > 0.5 ? fondo : ancho;
      uv.setXY(k, (uv.getX(k) * lado) / 4, (uv.getY(k) * alto) / 3.6);
    }
    caja.rotateY(angulo + Math.PI / 2 + (azar() - 0.5) * 0.3);
    caja.translate(x, base + alto / 2 - 0.2, z);
    partes.push(caja);
    const techo = new THREE.BoxGeometry(ancho + 0.6, 0.5, fondo + 0.6).toNonIndexed();
    techo.rotateY(angulo + Math.PI / 2);
    techo.translate(x, base + alto + 0.05, z);
    techos.push(techo);
  }
  const fachadas = new THREE.Mesh(
    mergeGeometries(partes, false),
    new THREE.MeshStandardMaterial({ name: 'Edificios', map: texturaDeVentanas(), roughness: 0.85 }),
  );
  const cubiertas = new THREE.Mesh(
    mergeGeometries(techos, false),
    new THREE.MeshStandardMaterial({ name: 'Cubiertas', color: '#9a948a', roughness: 0.9 }),
  );
  for (const malla of [fachadas, cubiertas]) {
    malla.castShadow = true;
    malla.receiveShadow = true;
  }
  return [fachadas, cubiertas];
}

function soloPosiciones(geometria) {
  const plana = geometria.index ? geometria.toNonIndexed() : geometria;
  const resultado = new THREE.BufferGeometry();
  resultado.setAttribute('position', plana.getAttribute('position'));
  return resultado;
}

export function extenderColision(campus, geometria) {
  if (campus.terrenoEnColision) return;
  const extra = soloPosiciones(geometria);
  const fisica = mergeGeometries([soloPosiciones(campus.colisionador.geometry), extra], false);
  fisica.boundsTree = new MeshBVH(fisica);
  campus.colisionador.geometry = fisica;
  if (campus.bvhCamara) {
    const camara = mergeGeometries([soloPosiciones(campus.bvhCamara.geometry), extra], false);
    camara.boundsTree = new MeshBVH(camara);
    campus.bvhCamara = camara.boundsTree;
  }
  campus.terrenoEnColision = true;
}
