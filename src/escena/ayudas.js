import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const RADIO_RUEDA = 0.3;
const LARGO_BASTON = 1.25;
const eje = new THREE.Vector3();

function tubo(desde, hasta, radio) {
  const direccion = new THREE.Vector3().subVectors(hasta, desde);
  const geometria = new THREE.CylinderGeometry(radio, radio, direccion.length(), 10);
  geometria.applyQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direccion.clone().normalize()),
  );
  const medio = desde.clone().add(hasta).multiplyScalar(0.5);
  return geometria.translate(medio.x, medio.y, medio.z);
}

const v = (x, y, z) => new THREE.Vector3(x, y, z);

function caja(ancho, alto, fondo, x, y, z, inclinacion = 0) {
  return new THREE.BoxGeometry(ancho, alto, fondo).rotateX(inclinacion).translate(x, y, z);
}

function crearRueda(radio, materiales, lado = 0) {
  const llanta = new THREE.TorusGeometry(radio - 0.018, 0.018, 10, 40).rotateY(Math.PI / 2);
  const piezas = [new THREE.CylinderGeometry(0.035, 0.035, 0.06, 16).rotateZ(Math.PI / 2)];
  if (lado) {
    piezas.push(new THREE.TorusGeometry(radio - 0.04, 0.008, 6, 40).rotateY(Math.PI / 2));
    for (let i = 0; i < 12; i++) {
      const angulo = (i / 12) * Math.PI * 2;
      const punta = v(0, Math.cos(angulo) * (radio - 0.04), Math.sin(angulo) * (radio - 0.04));
      piezas.push(tubo(v(i % 2 ? 0.02 : -0.02, 0, 0), punta, 0.0025));
    }
    piezas.push(
      new THREE.TorusGeometry(radio - 0.01, 0.006, 6, 40).rotateY(Math.PI / 2).translate(0.035 * lado, 0, 0),
    );
  }
  const rueda = new THREE.Group();
  rueda.add(
    new THREE.Mesh(llanta, materiales.caucho),
    new THREE.Mesh(mergeGeometries(piezas), materiales.metal),
  );
  rueda.traverse((parte) => {
    if (parte.isMesh) parte.castShadow = true;
  });
  return rueda;
}

export function crearSillaDeRuedas() {
  const materiales = {
    metal: new THREE.MeshStandardMaterial({ color: '#b9c0c8', metalness: 0.85, roughness: 0.32 }),
    tela: new THREE.MeshStandardMaterial({ color: '#1e2126', roughness: 0.92 }),
    caucho: new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.85 }),
  };
  const marco = [];
  for (const lado of [-1, 1]) {
    const x = lado * 0.23;
    marco.push(
      tubo(v(x, 0.46, 0.24), v(x, 0.46, -0.22), 0.012),
      tubo(v(x, 0.46, -0.22), v(x, 0.98, -0.3), 0.012),
      tubo(v(x, 0.98, -0.3), v(x, 0.99, -0.42), 0.011),
      tubo(v(x, 0.46, 0.24), v(x, 0.14, 0.34), 0.012),
      tubo(v(x, 0.3, -0.12), v(x * 1.2, 0.3, -0.12), 0.01),
      tubo(v(x, 0.46, 0.2), v(x, 0.13, 0.27), 0.01),
      tubo(v(x, 0.66, -0.25), v(x, 0.66, 0.16), 0.01),
    );
  }
  marco.push(tubo(v(-0.23, 0.3, -0.12), v(0.23, 0.3, -0.12), 0.01));
  const tela = [
    caja(0.44, 0.05, 0.44, 0, 0.48, 0.02),
    caja(0.44, 0.4, 0.03, 0, 0.74, -0.26, -0.12),
    caja(0.16, 0.012, 0.14, -0.12, 0.13, 0.37),
    caja(0.16, 0.012, 0.14, 0.12, 0.13, 0.37),
  ];
  const caucho = [];
  for (const lado of [-1, 1]) {
    caucho.push(
      new THREE.CylinderGeometry(0.016, 0.016, 0.12, 10)
        .rotateX(Math.PI / 2)
        .translate(lado * 0.23, 0.99, -0.48),
      caja(0.05, 0.03, 0.3, lado * 0.23, 0.68, -0.04),
    );
  }
  const grupo = new THREE.Group();
  grupo.name = 'SillaDeRuedas';
  for (const [geometrias, material] of [
    [marco, materiales.metal],
    [tela, materiales.tela],
    [caucho, materiales.caucho],
  ]) {
    const malla = new THREE.Mesh(mergeGeometries(geometrias), material);
    malla.castShadow = true;
    grupo.add(malla);
  }
  const ruedas = [];
  for (const lado of [-1, 1]) {
    const rueda = crearRueda(RADIO_RUEDA, materiales, lado);
    rueda.position.set(lado * 0.31, RADIO_RUEDA, -0.12);
    grupo.add(rueda);
    ruedas.push(rueda);
    const giratoria = crearRueda(0.075, materiales);
    giratoria.position.set(lado * 0.23, 0.075, 0.36);
    grupo.add(giratoria);
  }
  return { grupo, ruedas, radio: RADIO_RUEDA, asiento: 0.505 };
}

export function rodarSilla(silla, distancia) {
  for (const rueda of silla.ruedas) {
    eje.set(1, 0, 0);
    rueda.rotateOnAxis(eje, distancia / silla.radio);
  }
}

export function crearBaston() {
  const blanco = new THREE.MeshStandardMaterial({ color: '#f3f3f0', roughness: 0.35 });
  const rojo = new THREE.MeshStandardMaterial({ color: '#c4161c', roughness: 0.4 });
  const negro = new THREE.MeshStandardMaterial({ color: '#16171a', roughness: 0.8 });
  const grupo = new THREE.Group();
  grupo.name = 'Baston';
  const partes = [
    [
      new THREE.CylinderGeometry(0.0065, 0.0065, LARGO_BASTON - 0.2, 10),
      blanco,
      -0.1 - (LARGO_BASTON - 0.2) / 2,
    ],
    [new THREE.CylinderGeometry(0.0069, 0.0069, 0.1, 10), rojo, -LARGO_BASTON + 0.16],
    [new THREE.CylinderGeometry(0.0069, 0.0069, 0.05, 10), rojo, -LARGO_BASTON + 0.32],
    [new THREE.CylinderGeometry(0.011, 0.01, 0.2, 12), negro, -0.1],
    [new THREE.SphereGeometry(0.011, 10, 8), blanco, -LARGO_BASTON],
  ];
  for (const [geometria, material, y] of partes) {
    const malla = new THREE.Mesh(geometria, material);
    malla.position.y = y;
    malla.castShadow = true;
    grupo.add(malla);
  }
  return { grupo, largo: LARGO_BASTON };
}
