import * as THREE from 'three';
import { mergeGeometries, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshBVH } from 'three-mesh-bvh';
import { COLISION_PUERTA, PUERTA, prepararPuertas } from './puertas.js';
import { POR_MATERIAL, clasificarTriangulo, leerPaleta } from './superficies.js';

const SOLIDO = /^(COL|WALK)_/;
const PUNTO = /^(INT|SPAWN|EDIFICIO)_/;
const PARTE_AVATAR = /^Avatar/;
const EXTREMIDAD = /^Avatar_(arm|leg)/;
const ANIMADO = /^(FLOAT|SPIN|PULSE)_/;
const SENALADO = /^(Rotulo|SCREEN)_/;
const PILAR_DEL_ARCO = /^Arco_Pilar[LR]$/;
export const INICIO_FUERA_DEL_ARCO = 11;
const PLIEGUE = THREE.MathUtils.degToRad(35);
const ZONAS = {
  HTML: 'el edificio HTML',
  CSS: 'el edificio CSS',
  JS: 'el edificio JavaScript',
  GENAI: 'el laboratorio de IA',
};

function geometriaDeColision(mallas) {
  const geometrias = mallas.map((malla) => {
    const geometria = malla.geometry.clone().applyMatrix4(malla.matrixWorld);
    for (const nombre of Object.keys(geometria.attributes)) {
      if (nombre !== 'position') geometria.deleteAttribute(nombre);
    }
    return geometria.index ? geometria.toNonIndexed() : geometria;
  });
  const unida = mergeGeometries(geometrias, false);
  unida.boundsTree = new MeshBVH(unida);
  return unida;
}

function prepararMallaDelAvatar(malla, materiales) {
  malla.castShadow = true;
  if (Array.isArray(malla.material)) return;
  if (!materiales.has(malla.material)) {
    const copia = malla.material.clone();
    copia.alphaHash = true;
    materiales.set(malla.material, copia);
  }
  malla.material = materiales.get(malla.material);
}

function armarAvatar(partes) {
  const avatar = new THREE.Group();
  avatar.name = 'Jugador';
  const cuerpo = partes.find((parte) => parte.name === 'Avatar') ?? partes[0];
  if (!cuerpo) return avatar;
  cuerpo.getWorldPosition(avatar.position);
  avatar.attach(cuerpo);
  for (const parte of partes) if (parte !== cuerpo) cuerpo.attach(parte);
  const materiales = new Map();
  const brazos = [];
  const piernas = [];
  let largoPierna = 0.58;
  cuerpo.traverse((parte) => {
    if (parte.isMesh) prepararMallaDelAvatar(parte, materiales);
    if (!parte.isMesh || !EXTREMIDAD.test(parte.name)) return;
    parte.geometry.computeBoundingBox();
    const { min, max } = parte.geometry.boundingBox;
    parte.geometry.translate(0, -max.y, 0);
    parte.position.y += max.y * parte.scale.y;
    if (parte.name.includes('arm')) {
      brazos.push(parte);
    } else {
      piernas.push(parte);
      largoPierna = (max.y - min.y) * parte.scale.y;
    }
  });
  avatar.position.set(0, 0, 0);
  avatar.userData.partes = {
    cuerpo,
    brazos,
    piernas,
    largoPierna,
    reposo: cuerpo.position.clone(),
    materiales: [...materiales.values()],
  };
  return avatar;
}

function vistaDeTablero(objeto, bvh) {
  const caja = new THREE.Box3().setFromObject(objeto);
  const centro = caja.getCenter(new THREE.Vector3());
  const tamano = caja.getSize(new THREE.Vector3());
  const eje = tamano.x < tamano.z ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
  const rayo = new THREE.Ray();
  let mejor = eje;
  let libre = -1;
  for (const direccion of [eje, eje.clone().negate()]) {
    rayo.origin.copy(centro).addScaledVector(direccion, 0.1);
    rayo.direction.copy(direccion);
    const distancia = bvh.raycastFirst(rayo, THREE.DoubleSide)?.distance ?? 20;
    if (distancia > libre) {
      libre = distancia;
      mejor = direccion;
    }
  }
  const posicion = centro.clone().addScaledVector(mejor, Math.min(5, Math.max(1.5, libre - 0.6)));
  posicion.y = centro.y + 0.2;
  const arriba = new THREE.Vector3(0, 1, 0);
  const derecha = new THREE.Vector3().crossVectors(mejor.clone().negate(), arriba).normalize();
  const ancho = eje.x ? tamano.z : tamano.x;
  const alto = tamano.y;
  const frente = centro.clone().addScaledVector(mejor, (eje.x ? tamano.x : tamano.z) / 2 + 0.012);
  const esquinas = [
    [-1, 1],
    [1, 1],
    [1, -1],
    [-1, -1],
  ].map(([a, b]) =>
    frente
      .clone()
      .addScaledVector(derecha, (a * ancho) / 2)
      .addScaledVector(arriba, (b * alto) / 2),
  );
  return {
    posicion,
    mirar: centro,
    esquinas,
    ancho,
    alto,
  };
}

function fusionarEstaticos(escena, excluidos) {
  const grupos = new Map();
  escena.traverseVisible((objeto) => {
    if (!objeto.isMesh || excluidos.has(objeto) || Array.isArray(objeto.material)) return;
    const atributos = Object.keys(objeto.geometry.attributes).sort().join(',');
    const firma = `${objeto.material.uuid}|${atributos}|${objeto.geometry.index ? 1 : 0}`;
    if (!grupos.has(firma)) grupos.set(firma, []);
    grupos.get(firma).push(objeto);
  });
  const fusionados = new THREE.Group();
  fusionados.name = 'Fusionados';
  for (const mallas of grupos.values()) {
    if (mallas.length < 2) continue;
    const geometria = mergeGeometries(
      mallas.map((malla) => malla.geometry.clone().applyMatrix4(malla.matrixWorld)),
      false,
    );
    if (!geometria) continue;
    const unida = new THREE.Mesh(toCreasedNormals(geometria, PLIEGUE), mallas[0].material);
    unida.name = `Fusion_${mallas[0].material.name}`;
    fusionados.add(unida);
    for (const malla of mallas) malla.visible = false;
  }
  escena.add(fusionados);
  return fusionados.children.length;
}

const verticeA = new THREE.Vector3();
const verticeB = new THREE.Vector3();
const verticeC = new THREE.Vector3();
const caraNormal = new THREE.Vector3();
const lado1 = new THREE.Vector3();
const lado2 = new THREE.Vector3();
const normalVertice = new THREE.Vector3();
const matrizNormal = new THREE.Matrix3();
const BLANCO = [1, 1, 1];

function nombreDeObjeto(malla, escena) {
  let objeto = malla;
  while (objeto.parent && objeto.parent !== escena) objeto = objeto.parent;
  return objeto.name;
}

function colorLineal(rgb, cache) {
  const hex = `#${rgb.map((canal) => canal.toString(16).padStart(2, '0')).join('')}`;
  if (!cache.has(hex)) {
    const color = new THREE.Color().setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace);
    cache.set(hex, { hex, lineal: [color.r, color.g, color.b] });
  }
  return cache.get(hex);
}

function proyectarEnCaja(punto, normal, salida) {
  const x = Math.abs(normal.x);
  const y = Math.abs(normal.y);
  const z = Math.abs(normal.z);
  if (y >= x && y >= z) salida.push(punto.x, punto.z);
  else if (x >= z) salida.push(punto.z, punto.y);
  else salida.push(punto.x, punto.y);
}

function agregarTriangulos(malla, nombre, categoriaFija, muestrear, cubos, cache) {
  const geometria = malla.geometry;
  const posicion = geometria.attributes.position;
  const normal = geometria.attributes.normal;
  const uv = geometria.attributes.uv;
  const indice = geometria.index;
  const cantidad = indice ? indice.count : posicion.count;
  matrizNormal.getNormalMatrix(malla.matrixWorld);
  const vertices = [verticeA, verticeB, verticeC];
  for (let t = 0; t < cantidad; t += 3) {
    const ids = [0, 1, 2].map((k) => (indice ? indice.getX(t + k) : t + k));
    ids.forEach((id, k) => vertices[k].fromBufferAttribute(posicion, id).applyMatrix4(malla.matrixWorld));
    lado1.subVectors(verticeB, verticeA);
    lado2.subVectors(verticeC, verticeA);
    caraNormal.crossVectors(lado1, lado2).normalize();
    let categoria = categoriaFija;
    let color = BLANCO;
    if (categoriaFija === 'paleta') {
      const u = (uv.getX(ids[0]) + uv.getX(ids[1]) + uv.getX(ids[2])) / 3;
      const v = (uv.getY(ids[0]) + uv.getY(ids[1]) + uv.getY(ids[2])) / 3;
      const muestra = colorLineal(muestrear(u, v), cache);
      categoria = clasificarTriangulo(nombre, muestra.hex, caraNormal);
      color = muestra.lineal;
    }
    if (!cubos.has(categoria)) cubos.set(categoria, { posiciones: [], normales: [], colores: [], uvs: [] });
    const cubo = cubos.get(categoria);
    ids.forEach((id, k) => {
      cubo.posiciones.push(vertices[k].x, vertices[k].y, vertices[k].z);
      if (normal) normalVertice.fromBufferAttribute(normal, id).applyMatrix3(matrizNormal).normalize();
      else normalVertice.copy(caraNormal);
      cubo.normales.push(normalVertice.x, normalVertice.y, normalVertice.z);
      cubo.colores.push(...color);
      proyectarEnCaja(vertices[k], caraNormal, cubo.uvs);
    });
  }
}

function fusionarPorSuperficie(escena, excluidos, materiales, muestrear) {
  const cubos = new Map();
  const cache = new Map();
  escena.traverseVisible((objeto) => {
    if (!objeto.isMesh || excluidos.has(objeto) || Array.isArray(objeto.material)) return;
    const categoria = POR_MATERIAL[objeto.material.name];
    const sinPaleta = categoria === 'paleta' && !(muestrear && objeto.geometry.attributes.uv);
    if (!categoria || sinPaleta) return;
    if (categoria === 'vidrio' || categoria === 'cupula') {
      objeto.material = materiales[categoria];
      return;
    }
    agregarTriangulos(objeto, nombreDeObjeto(objeto, escena), categoria, muestrear, cubos, cache);
    objeto.visible = false;
  });
  const fusionados = new THREE.Group();
  fusionados.name = 'Superficies';
  for (const [categoria, cubo] of cubos) {
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute('position', new THREE.Float32BufferAttribute(cubo.posiciones, 3));
    geometria.setAttribute('normal', new THREE.Float32BufferAttribute(cubo.normales, 3));
    geometria.setAttribute('color', new THREE.Float32BufferAttribute(cubo.colores, 3));
    geometria.setAttribute('uv', new THREE.Float32BufferAttribute(cubo.uvs, 2));
    geometria.computeBoundingSphere();
    const malla = new THREE.Mesh(toCreasedNormals(geometria, PLIEGUE), materiales[categoria]);
    malla.name = `Superficie_${categoria}`;
    fusionados.add(malla);
  }
  escena.add(fusionados);
  const todasLasMallas = new Set(fusionados.children);
  const extra = fusionarEstaticos(escena, new Set([...excluidos, ...todasLasMallas]));
  return fusionados.children.length + extra;
}

const SIN_CAMARA = /^Superficie_(cesped|madera|metal|plastico|planta)$/;

function soloPosiciones(geometria) {
  const plana = geometria.index ? geometria.toNonIndexed() : geometria.clone();
  const resultado = new THREE.BufferGeometry();
  resultado.setAttribute('position', plana.getAttribute('position'));
  return resultado;
}

function geometriaParaCamara(escena, colisionador) {
  const partes = [soloPosiciones(colisionador.geometry)];
  escena.updateMatrixWorld(true);
  escena.traverseVisible((objeto) => {
    if (!objeto.isMesh || SIN_CAMARA.test(objeto.name)) return;
    if (!/^(Superficie_|Fusion_)/.test(objeto.name) || objeto.material.transparent) return;
    partes.push(soloPosiciones(objeto.geometry).applyMatrix4(objeto.matrixWorld));
  });
  const unida = mergeGeometries(partes, false);
  unida.boundsTree = new MeshBVH(unida);
  return unida;
}

export function ubicarEntrada(pilares, puntos) {
  if (pilares.length !== 2) return null;
  const arco = pilares[0].clone().add(pilares[1]).multiplyScalar(0.5).setY(0);
  const afuera = arco.clone().normalize();
  if (puntos.SPAWN_Jugador) {
    const altura = puntos.SPAWN_Jugador.y;
    puntos.SPAWN_Jugador = arco.clone().addScaledVector(afuera, INICIO_FUERA_DEL_ARCO).setY(altura);
  }
  return { arco, afuera };
}

export function procesarCampus(escena, opciones = {}) {
  if (escena.userData.campus) return escena.userData.campus;
  escena.updateMatrixWorld(true);
  const solidos = new Set();
  const excluidos = new Set();
  const puntos = {};
  const tableros = {};
  const partesAvatar = [];
  const animados = [];
  const pilares = [];

  escena.traverse((objeto) => {
    if (COLISION_PUERTA.test(objeto.name)) {
      objeto.visible = false;
    } else if (SOLIDO.test(objeto.name)) {
      objeto.visible = false;
      objeto.traverse((hijo) => hijo.isMesh && solidos.add(hijo));
    } else if (PUERTA.test(objeto.name)) {
      objeto.traverse((hijo) => excluidos.add(hijo));
    } else if (PUNTO.test(objeto.name)) {
      puntos[objeto.name] = objeto.getWorldPosition(new THREE.Vector3());
    } else if (PILAR_DEL_ARCO.test(objeto.name)) {
      pilares.push(objeto.getWorldPosition(new THREE.Vector3()));
    } else if (PARTE_AVATAR.test(objeto.name) && objeto.parent === escena) {
      partesAvatar.push(objeto);
    } else if (ANIMADO.test(objeto.name)) {
      objeto.traverse((hijo) => excluidos.add(hijo));
      animados.push({
        objeto,
        tipo: objeto.name.split('_')[0],
        posicion: objeto.position.clone(),
        rotacion: objeto.rotation.y,
        escala: objeto.scale.clone(),
        fase: animados.length * 0.7,
      });
    } else if (SENALADO.test(objeto.name)) {
      objeto.traverse((hijo) => excluidos.add(hijo));
      tableros[objeto.name] = objeto;
    }
  });

  const entrada = ubicarEntrada(pilares, puntos);
  const colisionador = new THREE.Mesh(geometriaDeColision([...solidos]));
  const avatar = armarAvatar(partesAvatar);
  const vistas = {};
  for (const nombre of Object.keys(puntos)) {
    const aula = /^INT_(\w+)_Aula_(A\d)$/.exec(nombre);
    const tablero = aula && tableros[`Rotulo_${aula[1]}_Tablero_${aula[2]}`];
    if (tablero) vistas[nombre] = vistaDeTablero(tablero, colisionador.geometry.boundsTree);
  }
  const zonas = [{ nombre: 'la plaza central', centro: new THREE.Vector3(), radio: 20 }];
  for (const [clave, nombre] of Object.entries(ZONAS)) {
    if (puntos[`EDIFICIO_${clave}`]) zonas.push({ nombre, centro: puntos[`EDIFICIO_${clave}`], radio: 16 });
  }
  const mallasFusionadas = opciones.materiales
    ? fusionarPorSuperficie(
        escena,
        excluidos,
        opciones.materiales,
        opciones.muestrearPaleta ?? leerPaleta(escena),
      )
    : fusionarEstaticos(escena, excluidos);
  escena.traverse((objeto) => {
    if (!objeto.isMesh) return;
    const transparente = [objeto.material].flat().some((material) => material.transparent);
    objeto.receiveShadow = true;
    objeto.castShadow = !transparente && objeto.name !== 'Superficie_cesped';
  });
  const puertas = prepararPuertas(escena);
  const camara = geometriaParaCamara(escena, colisionador);

  escena.userData.campus = {
    escenario: escena,
    colisionador,
    puntos,
    avatar,
    animados,
    vistas,
    zonas,
    mallasFusionadas,
    puertas,
    entrada,
    bvhCamara: camara.boundsTree,
  };
  return escena.userData.campus;
}
