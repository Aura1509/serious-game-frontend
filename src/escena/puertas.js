import * as THREE from 'three';

export const PUERTA = /^(HTML|CSS|JS|GENAI)_Puerta$/;
export const COLISION_PUERTA = /^COL_\w+_Puerta$/;
const APERTURA = 1.75;
const ALCANCE = 4;
const centro = new THREE.Vector3();

function mitad(geometria, izquierda) {
  const resultado = geometria.index ? geometria.toNonIndexed() : geometria.clone();
  const posicion = resultado.attributes.position;
  const conservar = [];
  for (let t = 0; t < posicion.count; t += 3) {
    const x = (posicion.getX(t) + posicion.getX(t + 1) + posicion.getX(t + 2)) / 3;
    if (x < 0 === izquierda) conservar.push(t, t + 1, t + 2);
  }
  const salida = new THREE.BufferGeometry();
  for (const [nombre, atributo] of Object.entries(resultado.attributes)) {
    const datos = new atributo.array.constructor(conservar.length * atributo.itemSize);
    conservar.forEach((indice, i) => {
      for (let k = 0; k < atributo.itemSize; k++)
        datos[i * atributo.itemSize + k] = atributo.array[indice * atributo.itemSize + k];
    });
    salida.setAttribute(nombre, new THREE.BufferAttribute(datos, atributo.itemSize, atributo.normalized));
  }
  return salida;
}

function hoja(objeto, izquierda, ancho) {
  const bisagra = new THREE.Group();
  bisagra.name = `${objeto.name}_${izquierda ? 'Izquierda' : 'Derecha'}`;
  bisagra.position.x = izquierda ? -ancho : ancho;
  const mallas = objeto.isMesh ? [objeto] : objeto.children.filter((hijo) => hijo.isMesh);
  for (const malla of mallas) {
    const geometria = mitad(malla.geometry, izquierda);
    geometria.translate(izquierda ? ancho : -ancho, 0, 0);
    const parte = new THREE.Mesh(geometria, malla.material);
    parte.position.copy(malla.isMesh && malla !== objeto ? malla.position : new THREE.Vector3());
    parte.castShadow = true;
    parte.receiveShadow = true;
    bisagra.add(parte);
  }
  return bisagra;
}

export function prepararPuertas(escena) {
  const encontradas = [];
  escena.traverse((objeto) => {
    if (PUERTA.test(objeto.name)) encontradas.push(objeto);
  });
  return encontradas.map((objeto) => {
    const caja = new THREE.Box3();
    objeto.traverse((hijo) => {
      if (!hijo.isMesh) return;
      hijo.geometry.computeBoundingBox();
      caja.union(hijo.geometry.boundingBox);
    });
    const ancho = Math.max(Math.abs(caja.min.x), Math.abs(caja.max.x));
    const izquierda = hoja(objeto, true, ancho);
    const derecha = hoja(objeto, false, ancho);
    for (const hijo of [...objeto.children]) if (hijo.isMesh) objeto.remove(hijo);
    if (objeto.isMesh) {
      objeto.geometry = new THREE.BufferGeometry();
      objeto.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    }
    objeto.add(izquierda, derecha);
    objeto.updateWorldMatrix(true, true);
    return { objeto, izquierda, derecha, centro: objeto.getWorldPosition(new THREE.Vector3()), abierta: 0 };
  });
}

export function animarPuertas(puertas, posiciones, dt, reducirMovimiento) {
  for (const puerta of puertas) {
    centro.copy(puerta.centro);
    const cerca = posiciones.some((posicion) => {
      const dx = posicion.x - centro.x;
      const dz = posicion.z - centro.z;
      return dx * dx + dz * dz < ALCANCE * ALCANCE && Math.abs(posicion.y - centro.y) < 2.5;
    });
    const objetivo = cerca ? 1 : 0;
    puerta.abierta = reducirMovimiento
      ? objetivo
      : puerta.abierta + (objetivo - puerta.abierta) * (1 - Math.exp(-dt * 5));
    puerta.izquierda.rotation.y = puerta.abierta * APERTURA;
    puerta.derecha.rotation.y = -puerta.abierta * APERTURA;
  }
}
