import * as THREE from 'three';
import { clone as clonarConEsqueleto } from 'three/addons/utils/SkeletonUtils.js';
import { animarGesto, crearCara } from './caras.js';
import { marchasDe } from './personajes.js';
import { REPOSO_EN_T } from './reposoRocketbox.js';

export const RUTA_ELENCO = './models/personas/quaternius/';
export const MODELOS = [
  'jugadora',
  'mujer_casual',
  'mujer_vestido',
  'mujer_traje',
  'mujer_traje_largo',
  'mujer_blusa_larga',
  'hombre_casual',
  'hombre_hoodie',
  'hombre_traje',
  'hombre_traje_b',
  'hombre_barba',
];

const FUENTE = {
  hips: 'Bip01_Pelvis',
  spine: 'Bip01_Spine',
  chest: 'Bip01_Spine1',
  upperChest: 'Bip01_Spine2',
  neck: 'Bip01_Neck',
  head: 'Bip01_Head',
  leftShoulder: 'Bip01_L_Clavicle',
  leftUpperArm: 'Bip01_L_UpperArm',
  leftLowerArm: 'Bip01_L_Forearm',
  leftHand: 'Bip01_L_Hand',
  rightShoulder: 'Bip01_R_Clavicle',
  rightUpperArm: 'Bip01_R_UpperArm',
  rightLowerArm: 'Bip01_R_Forearm',
  rightHand: 'Bip01_R_Hand',
  leftUpperLeg: 'Bip01_L_Thigh',
  leftLowerLeg: 'Bip01_L_Calf',
  leftFoot: 'Bip01_L_Foot',
  rightUpperLeg: 'Bip01_R_Thigh',
  rightLowerLeg: 'Bip01_R_Calf',
  rightFoot: 'Bip01_R_Foot',
};

export const DESTINO = {
  Body: 'hips',
  Hips: 'hips',
  Abdomen: 'spine',
  Torso: 'chest',
  Chest: 'upperChest',
  Neck: 'neck',
  Head: 'head',
  Shoulder_L: 'leftShoulder',
  UpperArm_L: 'leftUpperArm',
  LowerArm_L: 'leftLowerArm',
  Wrist_L: 'leftHand',
  Shoulder_R: 'rightShoulder',
  UpperArm_R: 'rightUpperArm',
  LowerArm_R: 'rightLowerArm',
  Wrist_R: 'rightHand',
  UpperLeg_L: 'leftUpperLeg',
  LowerLeg_L: 'leftLowerLeg',
  Foot_L: 'leftFoot',
  UpperLeg_R: 'rightUpperLeg',
  LowerLeg_R: 'rightLowerLeg',
  Foot_R: 'rightFoot',
};

const ALTURA_PELVIS = { f: 0.923, m: 0.895 };
const IZQUIERDA = [1, 0, 0];
const DERECHA = [-1, 0, 0];
const ABAJO = [0, -1, 0];
const EN_T_FUENTE = {
  leftUpperArm: ['Bip01_L_UpperArm', 'Bip01_L_Forearm', IZQUIERDA],
  leftLowerArm: ['Bip01_L_Forearm', 'Bip01_L_Hand', IZQUIERDA],
  leftHand: ['Bip01_L_Forearm', 'Bip01_L_Hand', IZQUIERDA],
  rightUpperArm: ['Bip01_R_UpperArm', 'Bip01_R_Forearm', DERECHA],
  rightLowerArm: ['Bip01_R_Forearm', 'Bip01_R_Hand', DERECHA],
  rightHand: ['Bip01_R_Forearm', 'Bip01_R_Hand', DERECHA],
  leftUpperLeg: ['Bip01_L_Thigh', 'Bip01_L_Calf', ABAJO],
  leftLowerLeg: ['Bip01_L_Calf', 'Bip01_L_Foot', ABAJO],
  rightUpperLeg: ['Bip01_R_Thigh', 'Bip01_R_Calf', ABAJO],
  rightLowerLeg: ['Bip01_R_Calf', 'Bip01_R_Foot', ABAJO],
};
const EN_T_DESTINO = {
  UpperArm_L: ['UpperArm_L', 'LowerArm_L', IZQUIERDA],
  LowerArm_L: ['LowerArm_L', 'Wrist_L', IZQUIERDA],
  Wrist_L: ['Wrist_L', 'Middle2_L', IZQUIERDA],
  UpperArm_R: ['UpperArm_R', 'LowerArm_R', DERECHA],
  LowerArm_R: ['LowerArm_R', 'Wrist_R', DERECHA],
  Wrist_R: ['Wrist_R', 'Middle2_R', DERECHA],
  UpperLeg_L: ['UpperLeg_L', 'LowerLeg_L', ABAJO],
  LowerLeg_L: ['LowerLeg_L', 'Foot_L', ABAJO],
  UpperLeg_R: ['UpperLeg_R', 'LowerLeg_R', ABAJO],
  LowerLeg_R: ['LowerLeg_R', 'Foot_R', ABAJO],
};
const DERIVADOS = { cejas: ['pelo', 0.55] };
const CON_PASO = ['caminar', 'pasear', 'caminarRapido', 'correr', 'correrRapido', 'aire'];
const CUADROS_POR_SEGUNDO = 30;
const desde = new THREE.Vector3();
const hacia = new THREE.Vector3();
const objetivo = new THREE.Vector3();
const punto = new THREE.Vector3();
const correccion = new THREE.Quaternion();
const q = new THREE.Quaternion();
const descansos = new WeakMap();
const referencias = new WeakMap();
let materialComun = null;

export function urlsDelElenco() {
  return MODELOS.map((modelo) => `${RUTA_ELENCO}${modelo}.glb`);
}

export function modelosPorNombre(gltfs, urls = urlsDelElenco()) {
  const resultado = {};
  urls.forEach((url, i) => {
    resultado[url.split('/').pop().replace('.glb', '')] = gltfs[i];
  });
  return resultado;
}

export function sexoDelModelo(modelo) {
  return modelo.startsWith('hombre') ? 'm' : 'f';
}

function restaurar(fuente, sexo) {
  let guardado = descansos.get(fuente);
  if (!guardado) {
    guardado = [];
    fuente.traverse((nodo) => guardado.push([nodo, nodo.position.clone(), nodo.quaternion.clone()]));
    descansos.set(fuente, guardado);
  }
  for (const [nodo, posicion, rotacion] of guardado) {
    nodo.position.copy(posicion);
    const enT = REPOSO_EN_T[sexo][nodo.name];
    if (enT) nodo.quaternion.fromArray(enT);
    else nodo.quaternion.copy(rotacion);
  }
}

function enT(mundo, ajuste, buscar) {
  if (!ajuste) return mundo;
  buscar(ajuste[0]).getWorldPosition(desde);
  buscar(ajuste[1]).getWorldPosition(hacia);
  hacia.sub(desde).normalize();
  return mundo.premultiply(correccion.setFromUnitVectors(hacia, objetivo.fromArray(ajuste[2])));
}

export function retargetear(clip, fuente, sexo) {
  restaurar(fuente, sexo);
  const nodos = {};
  for (const [hueso, nombre] of Object.entries(FUENTE)) {
    const nodo = fuente.getObjectByName(nombre);
    if (nodo) nodos[hueso] = nodo;
  }
  fuente.getObjectByName('Bip01').position.set(0, ALTURA_PELVIS[sexo], 0);
  fuente.updateMatrixWorld(true);
  const buscar = (nombre) => fuente.getObjectByName(nombre);
  const reposo = {};
  for (const [hueso, nodo] of Object.entries(nodos)) {
    reposo[hueso] = enT(nodo.getWorldQuaternion(new THREE.Quaternion()), EN_T_FUENTE[hueso], buscar).invert();
  }
  const alturaDeReposo = nodos.hips.getWorldPosition(punto).y;
  const cadera = nodos.leftUpperLeg.getWorldPosition(punto).y;
  const mixer = new THREE.AnimationMixer(fuente);
  mixer.clipAction(clip).play();
  const cuadros = Math.max(2, Math.round(clip.duration * CUADROS_POR_SEGUNDO) + 1);
  const tiempos = new Float32Array(cuadros);
  const deltas = Object.fromEntries(
    Object.keys(nodos).map((hueso) => [hueso, new Float32Array(cuadros * 4)]),
  );
  const alturas = new Float32Array(cuadros);
  for (let f = 0; f < cuadros; f++) {
    const t = Math.min(clip.duration, f / CUADROS_POR_SEGUNDO);
    tiempos[f] = t;
    mixer.setTime(t);
    fuente.updateMatrixWorld(true);
    for (const [hueso, nodo] of Object.entries(nodos)) {
      nodo
        .getWorldQuaternion(q)
        .multiply(reposo[hueso])
        .toArray(deltas[hueso], f * 4);
    }
    alturas[f] = nodos.hips.getWorldPosition(punto).y - alturaDeReposo;
  }
  mixer.stopAllAction();
  mixer.uncacheRoot(fuente);
  return { nombre: clip.name, duracion: clip.duration, tiempos, deltas, alturas, cadera };
}

export function prepararAnimaciones(clips) {
  const resultado = {};
  for (const [sexo, lista] of Object.entries(clips)) {
    resultado[sexo] = {};
    for (const [nombre, { clip, escena }] of Object.entries(lista)) {
      resultado[sexo][nombre] = retargetear(clip, escena, sexo);
    }
  }
  return resultado;
}

function huesosDe(raiz) {
  const huesos = {};
  raiz.traverse((objeto) => {
    if (objeto.isBone) huesos[objeto.name] = objeto;
  });
  return huesos;
}

export function referenciaDe(escena) {
  escena.updateMatrixWorld(true);
  const huesos = huesosDe(escena);
  const orden = [];
  escena.traverse((objeto) => {
    if (objeto.isBone && DESTINO[objeto.name]) orden.push(objeto.name);
  });
  const buscar = (nombre) => huesos[nombre];
  const reposo = {};
  const padres = {};
  const fijos = {};
  for (const nombre of orden) {
    const hueso = huesos[nombre];
    reposo[nombre] = enT(hueso.getWorldQuaternion(new THREE.Quaternion()), EN_T_DESTINO[nombre], buscar);
    padres[nombre] = DESTINO[hueso.parent?.name] ? hueso.parent.name : null;
    if (!padres[nombre]) fijos[nombre] = hueso.parent.getWorldQuaternion(new THREE.Quaternion());
  }
  return {
    orden,
    reposo,
    padres,
    fijos,
    cuerpo: huesos.Body.getWorldPosition(new THREE.Vector3()),
    inversa: huesos.Body.parent.matrixWorld.clone().invert(),
    cadera: huesos.UpperLeg_L.getWorldPosition(new THREE.Vector3()).y,
  };
}

export function clipParaModelo(datos, referencia) {
  const { orden, reposo, padres, fijos } = referencia;
  const cuadros = datos.tiempos.length;
  const valores = Object.fromEntries(orden.map((nombre) => [nombre, new Float32Array(cuadros * 4)]));
  const mundo = Object.fromEntries(orden.map((nombre) => [nombre, new THREE.Quaternion()]));
  const local = new THREE.Quaternion();
  for (let f = 0; f < cuadros; f++) {
    for (const nombre of orden) {
      mundo[nombre].fromArray(datos.deltas[DESTINO[nombre]], f * 4).multiply(reposo[nombre]);
      local
        .copy(padres[nombre] ? mundo[padres[nombre]] : fijos[nombre])
        .invert()
        .multiply(mundo[nombre])
        .toArray(valores[nombre], f * 4);
    }
  }
  const pistas = orden.map(
    (nombre) => new THREE.QuaternionKeyframeTrack(`${nombre}.quaternion`, datos.tiempos, valores[nombre]),
  );
  const escala = referencia.cadera / datos.cadera;
  const posiciones = new Float32Array(cuadros * 3);
  for (let f = 0; f < cuadros; f++) {
    punto.copy(referencia.cuerpo);
    punto.y += datos.alturas[f] * escala;
    punto.applyMatrix4(referencia.inversa).toArray(posiciones, f * 3);
  }
  pistas.push(new THREE.VectorKeyframeTrack('Body.position', datos.tiempos, posiciones));
  return new THREE.AnimationClip(datos.nombre, datos.duracion, pistas);
}

function animacionesDelModelo(gltf, animaciones, sexo) {
  let guardado = referencias.get(gltf);
  if (!guardado) {
    guardado = { referencia: referenciaDe(gltf.scene), clips: {} };
    referencias.set(gltf, guardado);
  }
  if (!guardado.clips[sexo]) {
    guardado.clips[sexo] = Object.fromEntries(
      Object.entries(animaciones[sexo] ?? {}).map(([nombre, datos]) => [
        nombre,
        clipParaModelo(datos, guardado.referencia),
      ]),
    );
  }
  return { referencia: guardado.referencia, clips: guardado.clips[sexo] };
}

export function paletaDe(partes, tintes = {}) {
  return partes.map((parte) => {
    const color = new THREE.Color();
    const derivado = DERIVADOS[parte.grupo];
    const tinte = tintes[parte.grupo] ?? (derivado && tintes[derivado[0]] ? tintes[derivado[0]] : null);
    if (!tinte) return color.setRGB(...parte.color);
    color.set(tinte).multiplyScalar(parte.factor ?? 1);
    if (!tintes[parte.grupo] && derivado) color.multiplyScalar(derivado[1]);
    return color;
  });
}

function colorear(geometria, partes, tintes) {
  const paleta = paletaDe(partes, tintes);
  const indices = geometria.getAttribute('_parte');
  const colores = new Float32Array(indices.count * 3);
  for (let i = 0; i < indices.count; i++) paleta[indices.getX(i)].toArray(colores, i * 3);
  const propia = new THREE.BufferGeometry();
  for (const [nombre, atributo] of Object.entries(geometria.attributes))
    propia.setAttribute(nombre, atributo);
  propia.setIndex(geometria.index);
  propia.setAttribute('color', new THREE.BufferAttribute(colores, 3));
  propia.boundingBox = geometria.boundingBox;
  propia.boundingSphere = geometria.boundingSphere;
  return propia;
}

function materialDe(jugador) {
  if (jugador) {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0,
      alphaHash: true,
    });
  }
  materialComun ??= new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
  return materialComun;
}

function materialDeCara(cara) {
  return new THREE.MeshStandardMaterial({
    map: cara.textura,
    transparent: true,
    depthWrite: false,
    roughness: 0.75,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -2,
  });
}

export function crearPersonaje(gltf, animaciones, opciones = {}) {
  const {
    modelo = 'mujer_casual',
    tintes = {},
    rasgos = {},
    altura = 1.65,
    marchas = 'caminar',
    jugador = false,
  } = opciones;
  const sexo = sexoDelModelo(modelo);
  const escena = clonarConEsqueleto(gltf.scene);
  const datos = gltf.scene.children[0]?.userData ?? {};
  const material = materialDe(jugador);
  const cara = crearCara(datos.cara, { cejas: oscurecerPelo(tintes.pelo), ...rasgos });
  const materialCara = cara.textura ? materialDeCara(cara) : null;
  let malla = null;
  let mallaCara = null;
  escena.traverse((objeto) => {
    if (!objeto.isSkinnedMesh) return;
    objeto.receiveShadow = true;
    objeto.frustumCulled = !jugador;
    if (objeto.geometry.getAttribute('_parte')) {
      malla = objeto;
      objeto.geometry = colorear(objeto.geometry, datos.partes ?? [], tintes);
      objeto.material = material;
      objeto.castShadow = jugador;
      return;
    }
    mallaCara = objeto;
    objeto.castShadow = false;
    objeto.renderOrder = 1;
    objeto.visible = Boolean(materialCara);
    if (materialCara) objeto.material = materialCara;
  });
  const alto = malla.geometry.boundingBox?.max.y ?? 1.85;
  const proporcion = altura / alto;
  escena.scale.setScalar(proporcion);
  if (!jugador) {
    const esfera = new THREE.Sphere(new THREE.Vector3(0, alto / 2, 0), alto * 0.8);
    malla.boundingSphere = esfera;
    if (mallaCara) mallaCara.boundingSphere = esfera;
  }
  const grupo = new THREE.Group();
  grupo.name = `Personaje_${modelo}`;
  grupo.add(escena);
  const { referencia, clips } = animacionesDelModelo(gltf, animaciones, sexo);
  const mixer = new THREE.AnimationMixer(escena);
  const acciones = {};
  for (const [nombre, clip] of Object.entries(clips)) {
    const accion = mixer.clipAction(clip);
    accion.setEffectiveWeight(0);
    accion.play();
    acciones[nombre] = accion;
  }
  for (const nombre of CON_PASO) {
    if (acciones[nombre]) acciones[nombre].timeScale = 0;
  }
  const cadera = Object.values(animaciones[sexo] ?? {})[0]?.cadera ?? referencia.cadera;
  const huesos = huesosDe(escena);
  return {
    modelo,
    sexo,
    grupo,
    escena,
    malla,
    mallaCara,
    material,
    materiales: [material, materialCara].filter(Boolean),
    mixer,
    acciones,
    marchas: marchasDe(marchas, acciones),
    escala: (proporcion * referencia.cadera) / cadera,
    huesos: {
      cabeza: huesos.Head,
      cuello: huesos.Neck,
      cabezaReal: huesos.Head,
      manoD: huesos.Wrist_R,
      manoI: huesos.Wrist_L,
      ojoD: huesos.Ojo_R,
      ojoI: huesos.Ojo_L,
    },
    altura,
    pesos: {},
    fase: 0,
    iniciado: false,
    saludando: false,
    variacion: 6,
    mirando: 0,
    cara,
    estadoCara: { parpadeo: 1 + Math.random() * 3, cierre: 0, reloj: Math.random() * 10 },
  };
}

function oscurecerPelo(pelo) {
  if (!pelo) return undefined;
  return `#${new THREE.Color(pelo).multiplyScalar(0.7).getHexString()}`;
}

export function animarCara(personaje, opciones = {}, dt = 0) {
  if (!personaje.cara) return false;
  return animarGesto(personaje.cara, personaje.estadoCara, opciones, dt);
}
