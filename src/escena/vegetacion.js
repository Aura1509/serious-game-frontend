import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { tarjetasDeCopa } from './follaje.js';
import { consultar, haciaElCamino } from './ocupacion.js';

export function crearAzar(semilla) {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lineal = (hex) => new THREE.Color(hex);
const ARRIBA = new THREE.Vector3(0, 1, 0);
const temporal = new THREE.Vector3();

const ESPECIES = {
  saman: {
    altura: [6.5, 8.5],
    tronco: 0.42,
    ramas: [5, 6],
    largoRama: [3.4, 4.6],
    inclinacion: [0.95, 1.2],
    radioBola: [1.9, 2.4],
    aplanar: 0.55,
    nucleo: '#2b5321',
    tarjeta: 2.1,
    densidad: 6,
  },
  guayacan: {
    altura: [5, 6.5],
    tronco: 0.3,
    ramas: [4, 5],
    largoRama: [1.6, 2.3],
    inclinacion: [0.55, 0.85],
    radioBola: [1.4, 1.8],
    aplanar: 0.8,
    nucleo: '#7d3f60',
    tarjeta: 1.6,
    densidad: 8,
  },
  gualanday: {
    altura: [5.5, 7],
    tronco: 0.3,
    ramas: [4, 5],
    largoRama: [1.7, 2.4],
    inclinacion: [0.6, 0.9],
    radioBola: [1.45, 1.85],
    aplanar: 0.75,
    nucleo: '#4a3b72',
    tarjeta: 1.6,
    densidad: 8,
  },
};

function limpiar(geometria) {
  const resultado = geometria.index ? geometria.toNonIndexed() : geometria;
  resultado.deleteAttribute('uv');
  return resultado;
}

function pintar(geometria, color, variacion = 0.12) {
  const posicion = geometria.attributes.position;
  const colores = new Float32Array(posicion.count * 3);
  for (let i = 0; i < posicion.count; i++) {
    const tono =
      1 -
      variacion +
      variacion *
        2 *
        (0.5 + 0.5 * Math.sin(posicion.getX(i) * 7 + posicion.getY(i) * 5 + posicion.getZ(i) * 3));
    colores.set([color.r * tono, color.g * tono, color.b * tono], i * 3);
  }
  geometria.setAttribute('color', new THREE.BufferAttribute(colores, 3));
  return geometria;
}

function cilindro(desde, hacia, radioArriba, radioAbajo, color, lados = 10, cortes = 4) {
  const largo = desde.distanceTo(hacia);
  const geometria = new THREE.CylinderGeometry(radioArriba, radioAbajo, largo, lados, cortes, true);
  geometria.translate(0, largo / 2, 0);
  const direccion = temporal.subVectors(hacia, desde).normalize();
  geometria.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(ARRIBA, direccion));
  geometria.translate(desde.x, desde.y, desde.z);
  return pintar(limpiar(geometria), color, 0.18);
}

function bulto(azar, radio, aplanar, detalle) {
  const geometria = new THREE.IcosahedronGeometry(radio, detalle);
  const posicion = geometria.attributes.position;
  const s = [azar() * 10, azar() * 10, azar() * 10];
  for (let i = 0; i < posicion.count; i++) {
    temporal.fromBufferAttribute(posicion, i);
    const ruido =
      Math.sin(temporal.x * 2.1 + s[0]) *
      Math.sin(temporal.y * 2.7 + s[1]) *
      Math.sin(temporal.z * 2.3 + s[2]);
    temporal.multiplyScalar(1 + 0.2 * ruido);
    temporal.y *= aplanar;
    posicion.setXYZ(i, temporal.x, temporal.y, temporal.z);
  }
  geometria.computeVertexNormals();
  return limpiar(geometria);
}

export function crearArbolFrondoso(nombre, semilla) {
  const especie = ESPECIES[nombre];
  const azar = crearAzar(semilla);
  const entre = ([a, b]) => a + (b - a) * azar();
  const altura = entre(especie.altura);
  const alturaTronco = altura * 0.45;
  const corteza = lineal('#5b4a3a');
  const nucleo = lineal(especie.nucleo);
  const partes = [];
  const curva = (azar() - 0.5) * 0.5;
  const tope = new THREE.Vector3(curva, alturaTronco, curva * 0.4);
  partes.push(cilindro(new THREE.Vector3(), tope, especie.tronco * 0.7, especie.tronco, corteza, 12, 5));
  const puntas = [];
  const ramas = Math.round(entre(especie.ramas));
  for (let i = 0; i < ramas; i++) {
    const angulo = (i / ramas) * Math.PI * 2 + azar() * 0.6;
    const inclinacion = entre(especie.inclinacion);
    const largo = entre(especie.largoRama);
    const direccion = new THREE.Vector3(
      Math.sin(inclinacion) * Math.cos(angulo),
      Math.cos(inclinacion),
      Math.sin(inclinacion) * Math.sin(angulo),
    );
    const fin = tope.clone().addScaledVector(direccion, largo);
    partes.push(cilindro(tope, fin, especie.tronco * 0.25, especie.tronco * 0.5, corteza, 8, 3));
    puntas.push(fin);
  }
  puntas.push(tope.clone().add(new THREE.Vector3(0, altura * 0.35, 0)));
  const centroCopa = puntas
    .reduce((suma, punta) => suma.add(punta), new THREE.Vector3())
    .divideScalar(puntas.length);
  const bolas = [];
  for (const punta of puntas) {
    const extra = nombre === 'saman' ? 2 : 1;
    for (let k = 0; k < extra; k++) {
      const radio = entre(especie.radioBola) * (k ? 0.8 : 1);
      const centro = punta.clone();
      if (k) centro.add(new THREE.Vector3((azar() - 0.5) * 2, 0.4, (azar() - 0.5) * 2));
      bolas.push({ centro, radio });
      partes.push(
        pintar(
          bulto(azar, radio * 0.42, especie.aplanar, 2).translate(centro.x, centro.y, centro.z),
          nucleo,
          0.15,
        ),
      );
    }
  }
  const alturaMinima = Math.min(...bolas.map((bola) => bola.centro.y - bola.radio * especie.aplanar));
  const alturaMaxima = Math.max(...bolas.map((bola) => bola.centro.y + bola.radio * especie.aplanar));
  const hojas = tarjetasDeCopa(azar, {
    centros: bolas,
    centroCopa,
    tamano: especie.tarjeta,
    densidad: especie.densidad,
    alturaMinima,
    alturaMaxima,
    aplanar: especie.aplanar,
  });
  const solido = mergeGeometries(partes, false);
  solido.computeBoundingSphere();
  return { solido, hojas };
}

export function crearPalma(semilla) {
  const azar = crearAzar(semilla);
  const altura = 7 + azar() * 2.5;
  const curva = 0.5 + azar() * 0.9;
  const tronco = new THREE.CylinderGeometry(0.15, 0.24, altura, 12, 16, true);
  tronco.translate(0, altura / 2, 0);
  const posicion = tronco.attributes.position;
  const colores = new Float32Array(posicion.count * 3);
  const gris = lineal('#8a8173');
  for (let i = 0; i < posicion.count; i++) {
    const y = posicion.getY(i);
    const t = y / altura;
    posicion.setX(i, posicion.getX(i) + t * t * curva);
    const anillo = 0.82 + 0.18 * Math.abs(Math.sin(y * 9));
    colores.set([gris.r * anillo, gris.g * anillo, gris.b * anillo], i * 3);
  }
  tronco.setAttribute('color', new THREE.BufferAttribute(colores, 3));
  tronco.computeVertexNormals();
  const corona = new THREE.Vector3(curva, altura, 0);
  const frondas = [];
  const cantidad = 12;
  for (let h = 0; h < cantidad; h++) {
    const angulo = (h / cantidad) * Math.PI * 2 + azar() * 0.4;
    const largo = 3 + azar() * 0.8;
    const subida = 0.25 + azar() * 0.25;
    const dir = new THREE.Vector3(Math.cos(angulo), 0, Math.sin(angulo));
    const lado = new THREE.Vector3(-dir.z, 0, dir.x);
    const tramos = 10;
    const filas = [];
    for (let s = 0; s <= tramos; s++) {
      const t = s / tramos;
      const centro = corona
        .clone()
        .addScaledVector(dir, t * largo * 0.92)
        .add(new THREE.Vector3(0, largo * (subida * t - 0.75 * t * t), 0));
      const ancho = 0.75 * Math.sin(Math.PI * Math.pow(t, 0.7)) + 0.05;
      filas.push([
        centro
          .clone()
          .addScaledVector(lado, -ancho)
          .add(new THREE.Vector3(0, -0.14 * ancho, 0)),
        centro.clone().add(new THREE.Vector3(0, 0.05, 0)),
        centro
          .clone()
          .addScaledVector(lado, ancho)
          .add(new THREE.Vector3(0, -0.14 * ancho, 0)),
      ]);
    }
    const vertices = [];
    const uvs = [];
    const tonos = [];
    for (let s = 0; s < tramos; s++) {
      for (const [a, b] of [
        [0, 1],
        [1, 2],
      ]) {
        const p = [filas[s][a], filas[s][b], filas[s + 1][b], filas[s + 1][a]];
        const u = [a * 0.5, b * 0.5, b * 0.5, a * 0.5];
        const v = [s / tramos, s / tramos, (s + 1) / tramos, (s + 1) / tramos];
        for (const k of [0, 1, 2, 0, 2, 3]) {
          vertices.push(p[k].x, p[k].y, p[k].z);
          uvs.push(u[k], v[k]);
          const luz = 0.7 + 0.3 * v[k];
          tonos.push(luz, luz, luz);
        }
      }
    }
    const fronda = new THREE.BufferGeometry();
    fronda.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    fronda.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    fronda.setAttribute('color', new THREE.Float32BufferAttribute(tonos, 3));
    fronda.computeVertexNormals();
    frondas.push(fronda);
  }
  const hojas = mergeGeometries(frondas, false);
  hojas.computeBoundingSphere();
  const solido = limpiar(tronco);
  solido.computeBoundingSphere();
  return { solido, hojas };
}

export function crearArbusto(semilla) {
  const azar = crearAzar(semilla);
  const partes = [];
  const bolas = [];
  const cantidad = 2 + Math.floor(azar() * 3);
  const nucleo = lineal('#2c5524');
  for (let b = 0; b < cantidad; b++) {
    const radio = 0.45 + azar() * 0.35;
    const centro = new THREE.Vector3((azar() - 0.5) * 0.9, radio * 0.7, (azar() - 0.5) * 0.9);
    bolas.push({ centro, radio: radio * 1.05 });
    partes.push(
      pintar(bulto(azar, radio * 0.45, 0.8, 1).translate(centro.x, centro.y, centro.z), nucleo, 0.12),
    );
  }
  const centroCopa = bolas
    .reduce((suma, bola) => suma.add(bola.centro), new THREE.Vector3())
    .divideScalar(bolas.length);
  const hojas = tarjetasDeCopa(azar, {
    centros: bolas,
    centroCopa,
    tamano: 0.62,
    densidad: 34,
    alturaMinima: 0,
    alturaMaxima: 1.3,
    aplanar: 0.8,
  });
  const solido = mergeGeometries(partes, false);
  solido.computeBoundingSphere();
  return { solido, hojas };
}

const REGLAS = [
  { tipo: 'saman', cantidad: 16, edificio: [7, 60], camino: [5, 60], separacion: 15, radio: 0.45 },
  { tipo: 'guayacan', cantidad: 14, edificio: [4, 40], camino: [3, 30], separacion: 8, radio: 0.32 },
  { tipo: 'gualanday', cantidad: 12, edificio: [4, 40], camino: [3, 30], separacion: 8, radio: 0.32 },
  { tipo: 'palma', cantidad: 22, edificio: [3.5, 30], camino: [1.6, 3.2], separacion: 7, radio: 0.25 },
  { tipo: 'arbusto', cantidad: 90, edificio: [1.2, 3.5], camino: [1.2, 40], separacion: 2.4, radio: 0.5 },
  { tipo: 'flor', cantidad: 70, edificio: [1, 6], camino: [0.9, 2.2], separacion: 1.8, radio: 0.45 },
];

export function ubicarVegetacion(rejilla, semilla = 7, alcance = 85) {
  const azar = crearAzar(semilla);
  const ubicados = [];
  const resultado = {};
  for (const regla of REGLAS) {
    const lista = [];
    for (let intento = 0; intento < regla.cantidad * 60 && lista.length < regla.cantidad; intento++) {
      const angulo = azar() * Math.PI * 2;
      const distancia = Math.sqrt(azar()) * alcance;
      const x = Math.cos(angulo) * distancia;
      const z = Math.sin(angulo) * distancia;
      const { edificio, camino } = consultar(rejilla, x, z);
      if (edificio < regla.edificio[0] || edificio > regla.edificio[1]) continue;
      if (camino < regla.camino[0] || camino > regla.camino[1]) continue;
      if (Math.abs(x) < 3 && z > 16) continue;
      const cerca = ubicados.some(
        (otro) =>
          (otro.x - x) ** 2 + (otro.z - z) ** 2 < Math.max(otro.separacion, regla.separacion) ** 2 / 4,
      );
      if (cerca || lista.some((otro) => (otro.x - x) ** 2 + (otro.z - z) ** 2 < regla.separacion ** 2))
        continue;
      const elemento = {
        x,
        z,
        giro: azar() * Math.PI * 2,
        escala: 0.85 + azar() * 0.3,
        variante: Math.floor(azar() * 3),
        radio: regla.radio,
        separacion: regla.separacion,
      };
      lista.push(elemento);
      ubicados.push(elemento);
    }
    resultado[regla.tipo] = lista;
  }
  return resultado;
}

export function ubicarBancas(rejilla, semilla = 11, cantidad = 18, alcance = 70) {
  const azar = crearAzar(semilla);
  const candidatas = [];
  const { lado, celda } = rejilla;
  for (let k = 0; k < lado * lado; k++) {
    const x = ((k % lado) + 0.5) * celda - rejilla.alcance;
    const z = (Math.floor(k / lado) + 0.5) * celda - rejilla.alcance;
    if (Math.abs(x) > alcance || Math.abs(z) > alcance) continue;
    const { edificio, camino, bloqueo } = consultar(rejilla, x, z);
    if (camino >= 0.9 && camino <= 2.1 && edificio >= 0.8 && bloqueo >= 2) candidatas.push([x, z, azar()]);
  }
  candidatas.sort((a, b) => a[2] - b[2]);
  const bancas = [];
  const direccion = new THREE.Vector3();
  for (const [x, z] of candidatas) {
    if (bancas.length >= cantidad) break;
    if (Math.abs(x) < 3 && z > 18) continue;
    if (bancas.some((otra) => (otra.x - x) ** 2 + (otra.z - z) ** 2 < 121)) continue;
    haciaElCamino(rejilla, x, z, direccion);
    bancas.push({ x, z, giro: Math.atan2(direccion.x, direccion.z), conCaneca: bancas.length % 2 === 0 });
  }
  return bancas;
}
