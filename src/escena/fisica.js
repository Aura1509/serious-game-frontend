import * as THREE from 'three';
import { POSE_QUIETA, posarHumano } from './humano.js';
import { animarPersonaje } from './personajes.js';
import { animarCara } from './elenco.js';

const RADIO = 0.35;
const ALTURA = 1.72;
export const CAMINAR = 1.9;
export const CORRER = 5.4;
const ACELERACION = 8;
const FRENADO = 11;
const CONTROL_EN_EL_AIRE = 0.2;
const GRAVEDAD = -25;
const SALTO = 6.4;
export const LIMITE = 140;
const MARGEN_SALTO = 0.12;
const SUBPASOS = 5;
const ESCALON = 0.45;
const TECLAS = {
  adelante: ['KeyW', 'ArrowUp'],
  atras: ['KeyS', 'ArrowDown'],
  izquierda: ['KeyA', 'ArrowLeft'],
  derecha: ['KeyD', 'ArrowRight'],
  correr: ['ShiftLeft', 'ShiftRight'],
  saltar: ['Space'],
};

const ARRIBA = new THREE.Vector3(0, 1, 0);
const base = new THREE.Line3(new THREE.Vector3(0, RADIO, 0), new THREE.Vector3(0, ALTURA - RADIO, 0));
const segmento = new THREE.Line3();
const caja = new THREE.Box3();
const puntoTriangulo = new THREE.Vector3();
const puntoCapsula = new THREE.Vector3();
const correccion = new THREE.Vector3();
const total = new THREE.Vector3();
const adelante = new THREE.Vector3();
const lado = new THREE.Vector3();
const direccion = new THREE.Vector3();
const deseada = new THREE.Vector3();
const inicio = new THREE.Vector3();
const rayo = new THREE.Ray(new THREE.Vector3(), new THREE.Vector3(0, -1, 0));

const pulsada = (teclas, accion) => TECLAS[accion].some((tecla) => teclas.has(tecla));
const suavizar = (ritmo, dt) => 1 - Math.exp(-ritmo * dt);
const { clamp, lerp } = THREE.MathUtils;

export function crearEstadoJugador() {
  return {
    velocidad: new THREE.Vector3(),
    caida: 0,
    enSuelo: false,
    tiempoEnElAire: 0,
    impacto: 0,
    saltoPulsado: false,
    corriendo: false,
    movido: 0,
    rapidez: 0,
    rapidezPrevia: 0,
    fase: 0,
    aire: 0,
    inclinacion: 0,
    ladeo: 0,
    desfase: 0,
    tiempo: 0,
    cercano: null,
    zona: null,
    enElBorde: false,
  };
}

export function colocarEnInicio(campus) {
  campus.avatar.position.copy(campus.puntos.SPAWN_Jugador ?? new THREE.Vector3());
  campus.avatar.rotation.set(0, Math.PI, 0);
}

export function direccionDeMovimiento(teclas, camara, salida) {
  salida.set(0, 0, 0);
  if (!teclas) return salida;
  const z = Number(pulsada(teclas, 'adelante')) - Number(pulsada(teclas, 'atras'));
  const x = Number(pulsada(teclas, 'derecha')) - Number(pulsada(teclas, 'izquierda'));
  if (!z && !x) return salida;
  camara.getWorldDirection(adelante).setY(0).normalize();
  lado.crossVectors(adelante, ARRIBA).normalize();
  return salida.addScaledVector(adelante, z).addScaledVector(lado, x).normalize();
}

export function tocaElSuelo(empujeVertical, caida, dt) {
  return empujeVertical > Math.max(1e-5, Math.abs(dt * caida * 0.25));
}

function resolverColision(posicion, estado, bvh, dt) {
  segmento.start.copy(base.start).add(posicion);
  segmento.end.copy(base.end).add(posicion);
  caja.makeEmpty().expandByPoint(segmento.start).expandByPoint(segmento.end);
  caja.min.addScalar(-RADIO);
  caja.max.addScalar(RADIO);
  bvh.shapecast({
    intersectsBounds: (limites) => limites.intersectsBox(caja),
    intersectsTriangle: (triangulo) => {
      const distancia = triangulo.closestPointToSegment(segmento, puntoTriangulo, puntoCapsula);
      if (distancia < RADIO) {
        const empuje = puntoCapsula.sub(puntoTriangulo).normalize();
        segmento.start.addScaledVector(empuje, RADIO - distancia);
        segmento.end.addScaledVector(empuje, RADIO - distancia);
      }
    },
  });
  correccion.copy(segmento.start).sub(base.start).sub(posicion);
  estado.enSuelo = tocaElSuelo(correccion.y, estado.caida, dt);
  const desplazamiento = Math.max(0, correccion.length() - 1e-5);
  correccion.normalize();
  posicion.addScaledVector(correccion, desplazamiento);
  return desplazamiento;
}

function chocarEnElAire(estado) {
  total.set(estado.velocidad.x, estado.caida, estado.velocidad.z);
  const contra = total.dot(correccion);
  if (contra >= 0) return;
  total.addScaledVector(correccion, -contra);
  estado.velocidad.set(total.x, 0, total.z);
  estado.caida = total.y;
}

function pegarAlSuelo(posicion, estado, bvh, dt) {
  rayo.origin.set(posicion.x, posicion.y + RADIO, posicion.z);
  const impacto = bvh.raycastFirst(rayo, THREE.DoubleSide, 0, RADIO + ESCALON);
  const bajada = impacto ? impacto.distance - RADIO : 0;
  if (bajada <= 0) return;
  posicion.y -= bajada + 1e-4;
  estado.caida = 0;
  resolverColision(posicion, estado, bvh, dt);
  estado.enSuelo = true;
  if (bajada > 0.08) estado.desfase += bajada;
}

function esquivar(posicion, obstaculos) {
  for (const obstaculo of obstaculos) {
    if (Math.abs(posicion.y - obstaculo.y) > 1.5) continue;
    const dx = posicion.x - obstaculo.x;
    const dz = posicion.z - obstaculo.z;
    const minimo = obstaculo.radio + RADIO;
    const distancia2 = dx * dx + dz * dz;
    if (distancia2 >= minimo * minimo) continue;
    const distancia = Math.sqrt(distancia2) || 1e-4;
    posicion.x = obstaculo.x + (dx / distancia) * minimo;
    posicion.z = obstaculo.z + (dz / distancia) * minimo;
  }
}

export function moverJugador(campus, estado, teclas, camara, dtTotal, opciones = {}) {
  const { correr = false, obstaculos = [], saltar = true } = opciones;
  if (dtTotal <= 0) return;
  const { avatar, colisionador } = campus;
  const bvh = colisionador.geometry.boundsTree;
  direccionDeMovimiento(teclas, camara, direccion);
  estado.corriendo = correr !== Boolean(teclas && pulsada(teclas, 'correr'));
  deseada.copy(direccion).multiplyScalar(estado.corriendo ? CORRER : CAMINAR);
  const ritmo = (direccion.lengthSq() ? ACELERACION : FRENADO) * (estado.enSuelo ? 1 : CONTROL_EN_EL_AIRE);
  estado.velocidad.lerp(deseada, suavizar(ritmo, dtTotal));
  const quiereSaltar = Boolean(teclas && pulsada(teclas, 'saltar'));
  if (
    saltar &&
    quiereSaltar &&
    !estado.saltoPulsado &&
    estado.tiempoEnElAire < MARGEN_SALTO &&
    estado.caida <= 0
  ) {
    estado.caida = SALTO;
    estado.enSuelo = false;
    estado.tiempoEnElAire = MARGEN_SALTO;
  }
  estado.saltoPulsado = quiereSaltar;
  inicio.copy(avatar.position);
  const estabaEnSuelo = estado.enSuelo;
  const dt = dtTotal / SUBPASOS;
  for (let i = 0; i < SUBPASOS; i++) {
    const enElAire = !estado.enSuelo;
    if (enElAire) estado.caida += dt * GRAVEDAD;
    avatar.position.addScaledVector(estado.velocidad, dt);
    avatar.position.y += estado.caida * dt;
    const empuje = resolverColision(avatar.position, estado, bvh, dt);
    if (estado.enSuelo) {
      if (enElAire) estado.impacto = Math.min(estado.impacto, estado.caida);
      estado.caida = 0;
    } else if (empuje > 0) chocarEnElAire(estado);
  }
  esquivar(avatar.position, obstaculos);
  const radio = Math.hypot(avatar.position.x, avatar.position.z);
  estado.enElBorde = radio > LIMITE - 0.5;
  if (radio > LIMITE) {
    avatar.position.x *= LIMITE / radio;
    avatar.position.z *= LIMITE / radio;
  }
  if (estabaEnSuelo && !estado.enSuelo && estado.caida <= 0) pegarAlSuelo(avatar.position, estado, bvh, dt);
  if (estado.enSuelo) {
    if (estado.tiempoEnElAire > 0.2 && estado.impacto < -3)
      estado.desfase -= Math.min(0.12, -estado.impacto * 0.012);
    estado.tiempoEnElAire = 0;
    estado.impacto = 0;
  } else {
    estado.tiempoEnElAire += dtTotal;
  }
  if (avatar.position.y < -20) {
    colocarEnInicio(campus);
    estado.velocidad.set(0, 0, 0);
    estado.caida = 0;
    estado.desfase = 0;
    inicio.copy(avatar.position);
  }
  estado.movido = Math.hypot(avatar.position.x - inicio.x, avatar.position.z - inicio.z);
  estado.rapidez += (estado.movido / dtTotal - estado.rapidez) * suavizar(12, dtTotal);
}

function girarHaciaElMovimiento(avatar, estado, dt, reducirMovimiento) {
  if (Math.hypot(estado.velocidad.x, estado.velocidad.z) < 0.2) return 0;
  const objetivo = Math.atan2(estado.velocidad.x, estado.velocidad.z);
  const diferencia = Math.atan2(
    Math.sin(objetivo - avatar.rotation.y),
    Math.cos(objetivo - avatar.rotation.y),
  );
  const giro = reducirMovimiento ? diferencia : diferencia * suavizar(12, dt);
  avatar.rotation.y += giro;
  return giro;
}

function posturaQuieta(partes) {
  partes.cuerpo.position.copy(partes.reposo);
  partes.cuerpo.rotation.set(0, 0, 0);
  for (const parte of [...partes.brazos, ...partes.piernas]) parte.rotation.set(0, 0, 0);
}

export function animarAvatar(avatar, estado, dt, reducirMovimiento) {
  if (dt <= 0) return;
  estado.tiempo += dt;
  const giro = girarHaciaElMovimiento(avatar, estado, dt, reducirMovimiento);
  const personaje = avatar.userData.personaje;
  if (personaje) {
    const enElAire = !estado.enSuelo && estado.tiempoEnElAire > 0.08 && !reducirMovimiento;
    estado.aire += (Number(enElAire) - estado.aire) * suavizar(10, dt);
    const ladear = reducirMovimiento ? 0 : clamp((-giro / dt) * estado.rapidez * 0.003, -0.15, 0.15);
    estado.ladeo += (ladear - estado.ladeo) * suavizar(6, dt);
    estado.desfase *= Math.exp(-dt * 14);
    animarPersonaje(
      personaje,
      { rapidez: estado.rapidez, aire: estado.aire, reducir: reducirMovimiento },
      dt,
    );
    animarCara(personaje, { alegria: 0.3, reducir: reducirMovimiento }, dt);
    personaje.grupo.position.y = reducirMovimiento ? 0 : estado.desfase;
    personaje.grupo.rotation.z = estado.ladeo * 0.6;
    return;
  }
  const humano = avatar.userData.humano;
  const partes = avatar.userData.partes;
  if (!humano && !partes?.cuerpo) return;
  if (reducirMovimiento) {
    estado.desfase = 0;
    if (humano) posarHumano(humano, POSE_QUIETA);
    else posturaQuieta(partes);
    return;
  }
  const andar = Math.min(1, estado.rapidez / CAMINAR);
  const trote = clamp((estado.rapidez - CAMINAR) / (CORRER - CAMINAR), 0, 1);
  estado.fase += (estado.movido / lerp(1.35, 2.4, trote)) * Math.PI * 2;
  estado.aire += (Number(!estado.enSuelo) - estado.aire) * suavizar(10, dt);
  const aceleracion = (estado.rapidez - estado.rapidezPrevia) / dt;
  estado.rapidezPrevia = estado.rapidez;
  const inclinar = 0.05 * andar + 0.1 * trote + clamp(aceleracion * 0.01, -0.06, 0.08);
  estado.inclinacion += (inclinar - estado.inclinacion) * suavizar(6, dt);
  const ladear = clamp((-giro / dt) * estado.rapidez * 0.003, -0.15, 0.15);
  estado.ladeo += (ladear - estado.ladeo) * suavizar(6, dt);
  estado.desfase *= Math.exp(-dt * 14);

  if (humano) {
    posarHumano(humano, {
      fase: estado.fase,
      andar,
      trote,
      aire: estado.aire,
      tiempo: estado.tiempo,
      inclinacion: estado.inclinacion,
      ladeo: estado.ladeo,
      desfase: estado.desfase,
    });
    return;
  }

  const vaiven = Math.sin(estado.fase);
  const pierna = andar * lerp(0.5, 0.85, trote) * vaiven * (1 - estado.aire);
  const brazo = andar * lerp(0.35, 0.9, trote) * vaiven * (1 - estado.aire);
  const respiracion = (1 - andar) * 0.03 * Math.sin(estado.tiempo * 2.2);
  for (const parte of partes.piernas) {
    const ladoX = Math.sign(parte.position.x) || 1;
    parte.rotation.x = ladoX * pierna + estado.aire * (ladoX > 0 ? 0.2 : -0.35);
  }
  for (const parte of partes.brazos) {
    const ladoX = Math.sign(parte.position.x) || 1;
    parte.rotation.x = -ladoX * brazo - 0.18 * trote;
    parte.rotation.z = ladoX * (0.1 * trote + 0.5 * estado.aire + respiracion);
  }
  const caidaDelPaso = -partes.largoPierna * (1 - Math.cos(pierna)) * (1 - 0.5 * trote);
  const rebote = 0.045 * trote * Math.abs(vaiven);
  partes.cuerpo.position.set(
    partes.reposo.x,
    partes.reposo.y + caidaDelPaso + rebote + estado.desfase,
    partes.reposo.z,
  );
  partes.cuerpo.rotation.set(
    estado.inclinacion,
    0,
    estado.ladeo + (1 - andar) * 0.012 * Math.sin(estado.tiempo * 1.3),
  );
}
