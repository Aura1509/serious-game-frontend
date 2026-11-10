import * as THREE from 'three';

const CAMINABLE = new Set(['Superficie_caminos', 'Superficie_losas', 'Superficie_adoquin']);
const punto = new THREE.Vector3();

export function crearRejilla(alcance = 120, celda = 1) {
  const lado = Math.round((alcance * 2) / celda);
  const capa = () => new Uint8Array(lado * lado);
  return { alcance, celda, lado, edificio: capa(), caminable: capa(), bloqueo: capa() };
}

const indice = (rejilla, x, z) => {
  const i = Math.floor((x + rejilla.alcance) / rejilla.celda);
  const j = Math.floor((z + rejilla.alcance) / rejilla.celda);
  if (i < 0 || j < 0 || i >= rejilla.lado || j >= rejilla.lado) return -1;
  return j * rejilla.lado + i;
};

function marcarTriangulo(rejilla, capa, a, b, c) {
  const { celda, alcance, lado } = rejilla;
  const minX = Math.max(0, Math.floor((Math.min(a.x, b.x, c.x) + alcance) / celda));
  const maxX = Math.min(lado - 1, Math.floor((Math.max(a.x, b.x, c.x) + alcance) / celda));
  const minZ = Math.max(0, Math.floor((Math.min(a.z, b.z, c.z) + alcance) / celda));
  const maxZ = Math.min(lado - 1, Math.floor((Math.max(a.z, b.z, c.z) + alcance) / celda));
  const area = (b.x - a.x) * (c.z - a.z) - (c.x - a.x) * (b.z - a.z);
  for (let j = minZ; j <= maxZ; j++) {
    for (let i = minX; i <= maxX; i++) {
      if (Math.abs(area) < 1e-9 || maxX - minX < 1 || maxZ - minZ < 1) {
        capa[j * lado + i] = 1;
        continue;
      }
      const x = (i + 0.5) * celda - alcance;
      const z = (j + 0.5) * celda - alcance;
      const w0 = ((b.x - x) * (c.z - z) - (c.x - x) * (b.z - z)) / area;
      const w1 = ((c.x - x) * (a.z - z) - (a.x - x) * (c.z - z)) / area;
      const w2 = 1 - w0 - w1;
      if (w0 >= -0.02 && w1 >= -0.02 && w2 >= -0.02) capa[j * lado + i] = 1;
    }
  }
}

function recorrerTriangulos(malla, alVisitar) {
  const posicion = malla.geometry.attributes.position;
  if (!posicion) return;
  const indices = malla.geometry.index;
  const cantidad = indices ? indices.count : posicion.count;
  const vertices = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const lado1 = new THREE.Vector3();
  const lado2 = new THREE.Vector3();
  malla.updateWorldMatrix(true, false);
  for (let t = 0; t < cantidad; t += 3) {
    for (let k = 0; k < 3; k++) {
      const id = indices ? indices.getX(t + k) : t + k;
      vertices[k].fromBufferAttribute(posicion, id).applyMatrix4(malla.matrixWorld);
    }
    lado1.subVectors(vertices[1], vertices[0]);
    lado2.subVectors(vertices[2], vertices[0]);
    const normalY = Math.abs(lado1.cross(lado2).normalize().y);
    const minY = Math.min(vertices[0].y, vertices[1].y, vertices[2].y);
    const maxY = Math.max(vertices[0].y, vertices[1].y, vertices[2].y);
    alVisitar(vertices, normalY, minY, maxY);
  }
}

export function marcarMalla(rejilla, malla, capa) {
  recorrerTriangulos(malla, (vertices) => marcarTriangulo(rejilla, capa, ...vertices));
}

export function ocupacionDelCampus(escena, alcance = 120, celda = 1, margen = 0.8) {
  const rejilla = crearRejilla(alcance, celda);
  rejilla.margen = margen;
  escena.traverseVisible((objeto) => {
    if (!objeto.isMesh || objeto.name === 'Superficie_cesped') return;
    const pisable = CAMINABLE.has(objeto.name);
    recorrerTriangulos(objeto, (vertices, normalY, minY, maxY) => {
      const bajo = maxY < 0.65;
      if (bajo && (pisable || normalY > 0.85)) marcarTriangulo(rejilla, rejilla.caminable, ...vertices);
      else marcarTriangulo(rejilla, rejilla.edificio, ...vertices);
      if (!bajo && minY < 2) marcarTriangulo(rejilla, rejilla.bloqueo, ...vertices);
    });
  });
  rejilla.distanciaEdificio = distancias(rejilla, rejilla.edificio);
  rejilla.distanciaCamino = distancias(rejilla, rejilla.caminable);
  rejilla.distanciaBloqueo = distancias(rejilla, rejilla.bloqueo);
  return rejilla;
}

export function distancias(rejilla, capa) {
  const { lado, celda } = rejilla;
  const infinito = 1e6;
  const d = new Float32Array(lado * lado);
  for (let k = 0; k < d.length; k++) d[k] = capa[k] ? 0 : infinito;
  const recto = celda;
  const diagonal = celda * Math.SQRT2;
  for (let j = 0; j < lado; j++) {
    for (let i = 0; i < lado; i++) {
      const k = j * lado + i;
      if (i > 0) d[k] = Math.min(d[k], d[k - 1] + recto);
      if (j > 0) d[k] = Math.min(d[k], d[k - lado] + recto);
      if (i > 0 && j > 0) d[k] = Math.min(d[k], d[k - lado - 1] + diagonal);
      if (i < lado - 1 && j > 0) d[k] = Math.min(d[k], d[k - lado + 1] + diagonal);
    }
  }
  for (let j = lado - 1; j >= 0; j--) {
    for (let i = lado - 1; i >= 0; i--) {
      const k = j * lado + i;
      if (i < lado - 1) d[k] = Math.min(d[k], d[k + 1] + recto);
      if (j < lado - 1) d[k] = Math.min(d[k], d[k + lado] + recto);
      if (i < lado - 1 && j < lado - 1) d[k] = Math.min(d[k], d[k + lado + 1] + diagonal);
      if (i > 0 && j < lado - 1) d[k] = Math.min(d[k], d[k + lado - 1] + diagonal);
    }
  }
  return d;
}

export function consultar(rejilla, x, z) {
  const k = indice(rejilla, x, z);
  if (k < 0) return { edificio: Infinity, camino: Infinity, bloqueo: Infinity };
  return {
    edificio: rejilla.distanciaEdificio[k],
    camino: rejilla.distanciaCamino[k],
    bloqueo: rejilla.distanciaBloqueo?.[k] ?? rejilla.distanciaEdificio[k],
  };
}

export function haciaElCamino(rejilla, x, z, salida = punto) {
  const paso = rejilla.celda;
  const muestra = (dx, dz) => consultar(rejilla, x + dx, z + dz).camino;
  salida.set(muestra(paso, 0) - muestra(-paso, 0), 0, muestra(0, paso) - muestra(0, -paso));
  return salida.lengthSq() > 0 ? salida.normalize().negate() : salida.set(0, 0, 1);
}

const transitable = (rejilla, k) =>
  rejilla.caminable[k] === 1 && rejilla.distanciaBloqueo[k] >= (rejilla.margen ?? 0.8);

function celdaMasCercana(rejilla, x, z, radio = 8) {
  const { lado, celda, alcance } = rejilla;
  const ci = Math.floor((x + alcance) / celda);
  const cj = Math.floor((z + alcance) / celda);
  let mejor = -1;
  let mejorDistancia = Infinity;
  const pasos = Math.ceil(radio / celda);
  for (let j = cj - pasos; j <= cj + pasos; j++) {
    for (let i = ci - pasos; i <= ci + pasos; i++) {
      if (i < 0 || j < 0 || i >= lado || j >= lado) continue;
      const k = j * lado + i;
      const distancia = (i - ci) ** 2 + (j - cj) ** 2;
      if (transitable(rejilla, k) && distancia < mejorDistancia) {
        mejor = k;
        mejorDistancia = distancia;
      }
    }
  }
  return mejor;
}

function centroDeCelda(rejilla, k) {
  const { lado, celda, alcance } = rejilla;
  return new THREE.Vector3(
    ((k % lado) + 0.5) * celda - alcance,
    0,
    (Math.floor(k / lado) + 0.5) * celda - alcance,
  );
}

function libre(rejilla, a, b) {
  const pasos = Math.ceil(a.distanceTo(b) / (rejilla.celda * 0.5));
  for (let s = 0; s <= pasos; s++) {
    const t = s / pasos;
    const k = indice(rejilla, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
    if (k < 0 || !transitable(rejilla, k)) return false;
  }
  return true;
}

export function buscarRuta(rejilla, desde, hasta) {
  const inicio = celdaMasCercana(rejilla, desde.x, desde.z);
  const meta = celdaMasCercana(rejilla, hasta.x, hasta.z);
  if (inicio < 0 || meta < 0) return null;
  const { lado } = rejilla;
  const costo = new Float32Array(lado * lado).fill(Infinity);
  const previo = new Int32Array(lado * lado).fill(-1);
  const cerrado = new Uint8Array(lado * lado);
  const metaX = meta % lado;
  const metaZ = Math.floor(meta / lado);
  const estimar = (k) => Math.hypot((k % lado) - metaX, Math.floor(k / lado) - metaZ);
  const abiertos = [[estimar(inicio), inicio]];
  costo[inicio] = 0;
  const vecinos = [-1, 1, -lado, lado, -lado - 1, -lado + 1, lado - 1, lado + 1];
  while (abiertos.length) {
    let mejor = 0;
    for (let a = 1; a < abiertos.length; a++) if (abiertos[a][0] < abiertos[mejor][0]) mejor = a;
    const [, actual] = abiertos.splice(mejor, 1)[0];
    if (actual === meta) break;
    if (cerrado[actual]) continue;
    cerrado[actual] = 1;
    const ci = actual % lado;
    for (const salto of vecinos) {
      const vecino = actual + salto;
      if (vecino < 0 || vecino >= lado * lado || Math.abs((vecino % lado) - ci) > 1) continue;
      if (cerrado[vecino] || !transitable(rejilla, vecino)) continue;
      const paso = Math.abs(salto) === 1 || Math.abs(salto) === lado ? 1 : Math.SQRT2;
      const nuevo = costo[actual] + paso * (1 + 2 / (1 + rejilla.distanciaBloqueo[vecino]));
      if (nuevo < costo[vecino]) {
        costo[vecino] = nuevo;
        previo[vecino] = actual;
        abiertos.push([nuevo + estimar(vecino), vecino]);
      }
    }
  }
  if (previo[meta] < 0 && meta !== inicio) return null;
  const celdas = [];
  for (let k = meta; k >= 0; k = previo[k]) celdas.unshift(k);
  const puntos = celdas.map((k) => centroDeCelda(rejilla, k));
  const simplificada = [puntos[0]];
  let ancla = 0;
  for (let i = 2; i < puntos.length; i++) {
    if (!libre(rejilla, puntos[ancla], puntos[i])) {
      simplificada.push(puntos[i - 1]);
      ancla = i - 1;
    }
  }
  if (puntos.length > 1) simplificada.push(puntos[puntos.length - 1]);
  return simplificada;
}
