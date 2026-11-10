import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { crearMaterialesVegetales, texturaDeFronda, texturaDeRacimo } from './follaje.js';
import { ocupacionDelCampus } from './ocupacion.js';
import { crearBosque, crearEdificiosLejanos, crearTerreno, extenderColision } from './terreno.js';
import {
  crearArbolFrondoso,
  crearArbusto,
  crearPalma,
  ubicarBancas,
  ubicarVegetacion,
} from './vegetacion.js';

const normalCara = new THREE.Vector3();
const lado1 = new THREE.Vector3();
const lado2 = new THREE.Vector3();
const vertices = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
const matriz = new THREE.Matrix4();
const cuaternion = new THREE.Quaternion();
const escala = new THREE.Vector3();
const posicion = new THREE.Vector3();
const EJE_Y = new THREE.Vector3(0, 1, 0);

export function uvEnCaja(geometria) {
  const resultado = geometria.index ? geometria.toNonIndexed() : geometria;
  const puntos = resultado.attributes.position;
  const uvs = new Float32Array(puntos.count * 2);
  for (let t = 0; t < puntos.count; t += 3) {
    for (let k = 0; k < 3; k++) vertices[k].fromBufferAttribute(puntos, t + k);
    lado1.subVectors(vertices[1], vertices[0]);
    lado2.subVectors(vertices[2], vertices[0]);
    normalCara.crossVectors(lado1, lado2);
    const x = Math.abs(normalCara.x);
    const y = Math.abs(normalCara.y);
    const z = Math.abs(normalCara.z);
    for (let k = 0; k < 3; k++) {
      const v = vertices[k];
      const par = y >= x && y >= z ? [v.x, v.z] : x >= z ? [v.z, v.y] : [v.x, v.y];
      uvs.set(par, (t + k) * 2);
    }
  }
  resultado.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return resultado;
}

function caja(ancho, alto, fondo, x, y, z) {
  return new THREE.BoxGeometry(ancho, alto, fondo).translate(x, y, z);
}

export function crearBanca() {
  const madera = [
    ...[-0.18, -0.06, 0.06, 0.18].map((z) => caja(1.9, 0.05, 0.1, 0, 0.46, z + 0.04)),
    ...[0.62, 0.76].map((y) => caja(1.9, 0.1, 0.05, 0, y, -0.2).rotateX(-0.12)),
  ];
  const concreto = [-0.75, 0.75].flatMap((x) => [
    caja(0.14, 0.44, 0.5, x, 0.22, 0.02),
    caja(0.14, 0.5, 0.08, x, 0.68, -0.21),
  ]);
  return {
    madera: uvEnCaja(
      mergeGeometries(
        madera.map((g) => g.toNonIndexed()),
        false,
      ),
    ),
    concreto: uvEnCaja(
      mergeGeometries(
        concreto.map((g) => g.toNonIndexed()),
        false,
      ),
    ),
  };
}

export function crearMesa() {
  const tapa = caja(1.6, 0.05, 0.8, 0, 0.74, 0);
  const patas = [-0.7, 0.7].flatMap((x) => [-0.32, 0.32].map((z) => caja(0.05, 0.72, 0.05, x, 0.36, z)));
  const travesanos = [-0.7, 0.7].map((x) => caja(0.04, 0.04, 0.64, x, 0.18, 0));
  return {
    tapa: uvEnCaja(tapa.toNonIndexed()),
    patas: mergeGeometries(
      [...patas, ...travesanos].map((g) => g.toNonIndexed()),
      false,
    ),
  };
}

export function crearSilla() {
  const asiento = caja(0.44, 0.04, 0.42, 0, 0.46, 0.02);
  const respaldo = caja(0.44, 0.3, 0.03, 0, 0.7, -0.19).rotateX(-0.12);
  const patas = [-0.19, 0.19].flatMap((x) => [-0.17, 0.19].map((z) => caja(0.03, 0.46, 0.03, x, 0.23, z)));
  const postes = [-0.19, 0.19].map((x) => caja(0.03, 0.42, 0.03, x, 0.66, -0.19));
  return {
    plastico: mergeGeometries([asiento.toNonIndexed(), respaldo.toNonIndexed()], false),
    patas: mergeGeometries(
      [...patas, ...postes].map((g) => g.toNonIndexed()),
      false,
    ),
  };
}

export function crearUtiles() {
  const base = caja(0.32, 0.016, 0.22, 0, 0.758, 0.36);
  const tapa = caja(0.32, 0.21, 0.012, 0, 0.105, 0).rotateX(0.25).translate(0, 0.766, 0.47);
  const pantalla = new THREE.PlaneGeometry(0.29, 0.18)
    .rotateY(Math.PI)
    .translate(0, 0.105, -0.007)
    .rotateX(0.25)
    .translate(0, 0.766, 0.47);
  const cuaderno = caja(0.3, 0.012, 0.21, 0, 0.757, 0.34);
  return {
    portatil: mergeGeometries([base.toNonIndexed(), tapa.toNonIndexed()], false),
    pantalla,
    cuaderno: cuaderno.toNonIndexed(),
  };
}

const MESAS_DE_ESTUDIO = [
  [-7.4, 5.4],
  [-9.8, 9.8],
  [7.4, 5.4],
  [9.8, 9.8],
];
const PUESTOS = [
  [-0.42, -0.66],
  [0.42, -0.66],
  [-0.42, 0.66],
  [0.42, 0.66],
];
const PISOS_DE_ESTUDIO = [
  { centro: [-8.6, 7.6], tamano: [7.6, 8.4] },
  { centro: [8.6, 7.6], tamano: [7.6, 8.4] },
  { centro: [0, 10], tamano: [6.4, 14] },
];
const COLORES_DE_SILLA = ['#e8743b', '#2bb5a8', '#e2b41c', '#2b3a67'];
const COLORES_DE_CUADERNO = ['#d8343c', '#3e7cb1', '#4f9a4a', '#f2c230'];

export function zonaDeEstudio(entrada) {
  if (!entrada) return null;
  const { arco, afuera } = entrada;
  const lado = new THREE.Vector3(afuera.z, 0, -afuera.x);
  const giro = Math.atan2(afuera.x, afuera.z);
  const enMundo = (lateral, distancia) => ({
    x: arco.x + lado.x * lateral + afuera.x * distancia,
    z: arco.z + lado.z * lateral + afuera.z * distancia,
  });
  const mesas = MESAS_DE_ESTUDIO.map(([lateral, distancia]) => ({ ...enMundo(lateral, distancia), giro }));
  const sillas = [];
  MESAS_DE_ESTUDIO.forEach(([lateral, distancia], mesa) => {
    PUESTOS.forEach(([dx, dz], puesto) => {
      sillas.push({
        ...enMundo(lateral + dx, distancia + dz),
        giro: dz < 0 ? giro : giro + Math.PI,
        mesa,
        color: COLORES_DE_SILLA[(mesa + puesto) % COLORES_DE_SILLA.length],
      });
    });
  });
  const pisos = PISOS_DE_ESTUDIO.map(({ centro, tamano }) => ({
    ...enMundo(...centro),
    ancho: tamano[0],
    largo: tamano[1],
    giro,
  }));
  const contiene = (x, z, margen = 0) => {
    const dx = x - arco.x;
    const dz = z - arco.z;
    const lateral = dx * lado.x + dz * lado.z;
    const distancia = dx * afuera.x + dz * afuera.z;
    return Math.abs(lateral) < 13.5 + margen && distancia > 1.2 - margen && distancia < 17.5 + margen;
  };
  const pisado = (x, z) => {
    const dx = x - arco.x;
    const dz = z - arco.z;
    const lateral = dx * lado.x + dz * lado.z;
    const distancia = dx * afuera.x + dz * afuera.z;
    return PISOS_DE_ESTUDIO.some(
      ({ centro, tamano }) =>
        Math.abs(lateral - centro[0]) < tamano[0] / 2 + 0.15 &&
        Math.abs(distancia - centro[1]) < tamano[1] / 2 + 0.15,
    );
  };
  return { mesas, sillas, pisos, giro, lado, afuera, contiene, pisado };
}

function instanciarConColores(geometria, material, elementos) {
  const malla = instanciar(geometria, material, elementos);
  const color = new THREE.Color();
  elementos.forEach((elemento, i) => malla.setColorAt(i, color.set(elemento.color)));
  malla.instanceColor.needsUpdate = true;
  return malla;
}

function mallasDeEstudio(estudio, materiales) {
  const losas = materiales?.losas ?? new THREE.MeshStandardMaterial({ color: '#c9c3b8' });
  const pisos = estudio.pisos.map(({ x, z, ancho, largo, giro }) => {
    const piso = new THREE.Mesh(
      uvEnCaja(new THREE.BoxGeometry(ancho, 0.024, largo).rotateY(giro).translate(x, 0, z)),
      losas,
    );
    piso.name = 'Zona_de_estudio_piso';
    piso.receiveShadow = true;
    return piso;
  });
  const mesa = crearMesa();
  const silla = crearSilla();
  const utiles = crearUtiles();
  const metal = new THREE.MeshStandardMaterial({
    name: 'Metal_mobiliario',
    color: '#3a3f45',
    roughness: 0.45,
    metalness: 0.5,
  });
  const plastico = new THREE.MeshStandardMaterial({
    name: 'Plastico_sillas',
    color: '#ffffff',
    roughness: 0.6,
  });
  const carcasa = new THREE.MeshStandardMaterial({
    name: 'Portatil',
    color: '#4a5058',
    roughness: 0.4,
    metalness: 0.3,
  });
  const pantalla = new THREE.MeshStandardMaterial({
    name: 'Pantalla',
    color: '#d7ecfa',
    emissive: '#8fc4ea',
    emissiveIntensity: 0.45,
    roughness: 0.3,
  });
  const papel = new THREE.MeshStandardMaterial({ name: 'Cuadernos', color: '#ffffff', roughness: 0.8 });
  const conPortatil = estudio.sillas.filter((_, i) => i % 2 === 0);
  const conCuaderno = estudio.sillas
    .filter((_, i) => i % 2 === 1)
    .map((s, i) => ({ ...s, color: COLORES_DE_CUADERNO[i % COLORES_DE_CUADERNO.length] }));
  return [
    ...pisos,
    instanciar(mesa.tapa, materiales?.maderaPropia ?? metal, estudio.mesas),
    instanciar(mesa.patas, metal, estudio.mesas),
    instanciarConColores(silla.plastico, plastico, estudio.sillas),
    instanciar(silla.patas, metal, estudio.sillas),
    instanciar(utiles.portatil, carcasa, conPortatil),
    instanciar(utiles.pantalla, pantalla, conPortatil),
    instanciarConColores(utiles.cuaderno, papel, conCuaderno),
  ];
}

export function crearCaneca() {
  const cuerpo = new THREE.CylinderGeometry(0.27, 0.24, 0.8, 16, 1).translate(0, 0.4, 0);
  const tapa = new THREE.CylinderGeometry(0.29, 0.29, 0.07, 16, 1).translate(0, 0.83, 0);
  return mergeGeometries([cuerpo.toNonIndexed(), tapa.toNonIndexed()], false);
}

function crearModelos() {
  const variantes = (crear) => [1, 2, 3].map(crear);
  return {
    saman: { variantes: variantes((s) => crearArbolFrondoso('saman', 100 + s)), hojas: ['saman'] },
    guayacan: { variantes: variantes((s) => crearArbolFrondoso('guayacan', 200 + s)), hojas: ['guayacan'] },
    gualanday: {
      variantes: variantes((s) => crearArbolFrondoso('gualanday', 300 + s)),
      hojas: ['gualanday'],
    },
    palma: { variantes: variantes((s) => crearPalma(400 + s)), hojas: ['palma'] },
    arbusto: { variantes: variantes((s) => crearArbusto(500 + s)), hojas: ['arbusto'] },
    flor: {
      variantes: variantes((s) => crearArbusto(600 + s)),
      hojas: ['florRoja', 'florAmarilla', 'florRosada'],
    },
  };
}

function crearTexturasVegetales() {
  const verdes = ['#3e7b2f', '#4c8c37', '#35692a', '#5a9a3e'];
  const arbusto = ['#3f7a35', '#4b8a3b', '#356f2e'];
  return {
    saman: texturaDeRacimo({ semilla: 11, hojas: verdes, tamano: 16 }),
    guayacan: texturaDeRacimo({
      semilla: 12,
      hojas: ['#5d9441'],
      flores: ['#f28ec2', '#e5679f', '#f7b5d6'],
      proporcionFlor: 0.75,
    }),
    gualanday: texturaDeRacimo({
      semilla: 13,
      hojas: ['#56903f'],
      flores: ['#9d7fd3', '#8b6cc6', '#b59de2'],
      proporcionFlor: 0.7,
    }),
    arbusto: texturaDeRacimo({ semilla: 14, hojas: arbusto }),
    florRoja: texturaDeRacimo({
      semilla: 15,
      hojas: arbusto,
      flores: ['#d8343c'],
      proporcionFlor: 0.35,
    }),
    florAmarilla: texturaDeRacimo({
      semilla: 16,
      hojas: arbusto,
      flores: ['#f2c230'],
      proporcionFlor: 0.35,
    }),
    florRosada: texturaDeRacimo({
      semilla: 17,
      hojas: arbusto,
      flores: ['#e04d9b'],
      proporcionFlor: 0.35,
    }),
    palma: texturaDeFronda(5),
  };
}

function instanciar(geometria, material, elementos, ajustarEscala = 1) {
  const malla = new THREE.InstancedMesh(geometria, material, elementos.length);
  elementos.forEach((elemento, i) => {
    cuaternion.setFromAxisAngle(EJE_Y, elemento.giro);
    escala.setScalar((elemento.escala ?? 1) * ajustarEscala);
    posicion.set(elemento.x, 0, elemento.z);
    malla.setMatrixAt(i, matriz.compose(posicion, cuaternion, escala));
  });
  malla.instanceMatrix.needsUpdate = true;
  malla.computeBoundingSphere();
  malla.castShadow = true;
  malla.receiveShadow = true;
  return malla;
}

export function crearPaisaje(campus, materiales) {
  const rejilla = ocupacionDelCampus(campus.escenario);
  const estudio = zonaDeEstudio(campus.entrada);
  const ubicacion = ubicarVegetacion(rejilla);
  if (estudio) {
    for (const tipo of Object.keys(ubicacion)) {
      ubicacion[tipo] = ubicacion[tipo].filter(
        (elemento) => !estudio.contiene(elemento.x, elemento.z, elemento.radio),
      );
    }
  }
  const bancas = ubicarBancas(rejilla).filter((banca) => !estudio?.contiene(banca.x, banca.z, 1));
  const entrada = campus.puntos?.SPAWN_Jugador;
  if (entrada) {
    for (const lado of [-1, 1]) {
      bancas.push({
        x: entrada.x + lado * 4.2,
        z: entrada.z + 1.5,
        giro: (lado * -Math.PI) / 2,
        conCaneca: lado > 0,
        entrada: true,
      });
    }
  }
  const modelos = crearModelos();
  const vegetales = crearMaterialesVegetales(crearTexturasVegetales());
  const mallas = [];
  const obstaculos = [];
  for (const [tipo, elementos] of Object.entries(ubicacion)) {
    const { variantes, hojas } = modelos[tipo];
    const escala = tipo === 'flor' ? 0.6 : 1;
    variantes.forEach((modelo, variante) => {
      const propios = elementos.filter((elemento) => elemento.variante === variante);
      if (!propios.length) return;
      mallas.push(instanciar(modelo.solido, vegetales.solido, propios, escala));
      mallas.push(instanciar(modelo.hojas, vegetales.hojas[hojas[variante % hojas.length]], propios, escala));
    });
    for (const elemento of elementos) {
      obstaculos.push({
        x: elemento.x,
        y: 0,
        z: elemento.z,
        radio: elemento.radio * escala * elemento.escala,
      });
    }
  }
  const banca = crearBanca();
  const caneca = crearCaneca();
  const concreto = new THREE.MeshStandardMaterial({ name: 'Concreto', color: '#b9b4aa', roughness: 0.92 });
  const azul = new THREE.MeshStandardMaterial({ name: 'Caneca', color: '#2f6db5', roughness: 0.5 });
  mallas.push(instanciar(banca.madera, materiales?.maderaPropia ?? concreto, bancas));
  mallas.push(instanciar(banca.concreto, concreto, bancas));
  const canecas = bancas
    .filter((b) => b.conCaneca)
    .map((b) => ({ x: b.x + Math.cos(b.giro) * 1.4, z: b.z - Math.sin(b.giro) * 1.4, giro: 0 }));
  if (canecas.length) mallas.push(instanciar(caneca, azul, canecas));
  for (const b of bancas) {
    for (const lado of [-0.6, 0.6]) {
      obstaculos.push({
        x: b.x + Math.cos(b.giro) * lado,
        y: 0,
        z: b.z - Math.sin(b.giro) * lado,
        radio: 0.45,
      });
    }
  }
  for (const c of canecas) obstaculos.push({ x: c.x, y: 0, z: c.z, radio: 0.3 });
  if (estudio) {
    mallas.push(...mallasDeEstudio(estudio, materiales));
    for (const m of estudio.mesas) {
      for (const lado of [-0.45, 0.45]) {
        obstaculos.push({
          x: m.x + estudio.lado.x * lado,
          y: 0,
          z: m.z + estudio.lado.z * lado,
          radio: 0.55,
        });
      }
    }
    for (const s of estudio.sillas) obstaculos.push({ x: s.x, y: 0, z: s.z, radio: 0.28 });
  }
  const terreno = crearTerreno();
  const cerca = new THREE.Mesh(
    terreno.cerca,
    materiales?.cesped ?? new THREE.MeshStandardMaterial({ color: '#6f9a4e' }),
  );
  const lejos = new THREE.Mesh(
    terreno.lejos,
    new THREE.MeshStandardMaterial({ name: 'Terreno', vertexColors: true, roughness: 0.95 }),
  );
  cerca.name = 'Terreno_cerca';
  lejos.name = 'Terreno_lejos';
  cerca.receiveShadow = true;
  lejos.receiveShadow = true;
  mallas.push(cerca, lejos, crearBosque(), ...crearEdificiosLejanos());
  extenderColision(campus, terreno.cerca);
  return { mallas, obstaculos, bancas, estudio, tiempo: vegetales.tiempo, rejilla };
}
