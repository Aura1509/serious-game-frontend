import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const COLOR_OJOS = '#45f08a';
const ESCALA = 0.9;
const RADIO = 0.28;
const ALTO_LIBRE = 0.6;
const EXPRESIONES = { feliz: 'uFeliz', pensar: 'uPensar', preocupado: 'uPreocupado' };

const VERTICES = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENTOS = /* glsl */ `
uniform vec3 uColor;
uniform float uAbierto;
uniform float uBoca;
uniform float uFeliz;
uniform float uPensar;
uniform float uPreocupado;
uniform vec2 uMirada;
uniform float uTiempo;
varying vec2 vUv;

float caja(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float arco(vec2 p, float radio, float grosor, float lado) {
  return max(abs(length(p) - radio) - grosor, -p.y * lado);
}

float ojo(vec2 p, float lado) {
  vec2 q = p - uMirada * vec2(0.045, 0.03);
  float alto = mix(0.012, 0.11, uAbierto);
  float d = caja(q, vec2(0.068, alto), 0.062);
  d = mix(d, arco(q + vec2(0.0, 0.03), 0.068, 0.022, 1.0), uFeliz);
  float parpado = (q.y - 0.035 + 0.5 * lado * q.x) / 1.118;
  d = mix(d, max(caja(q, vec2(0.066, alto * 0.85), 0.058), parpado), uPreocupado);
  return mix(d, caja(q - vec2(0.022, 0.035), vec2(0.06, alto * 0.75 + 0.01), 0.05), uPensar);
}

float boca(vec2 p) {
  vec2 q = p - vec2(0.0, -0.2);
  float abre = smoothstep(0.03, 0.25, uBoca);
  float d = mix(arco(q - vec2(0.0, 0.065), 0.085, 0.014, -1.0), caja(q, vec2(0.08, mix(0.016, 0.06, uBoca)), 0.035), abre);
  d = mix(d, max(length(q * vec2(1.0, 1.3)) - 0.095, q.y - 0.012), uFeliz * (1.0 - abre));
  d = mix(d, length(q - vec2(0.05, 0.005)) - 0.03, uPensar * (1.0 - abre));
  return mix(d, arco(q + vec2(0.0, 0.05), 0.07, 0.014, 1.0), uPreocupado * (1.0 - abre));
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(1.42, 1.0);
  float marco = caja(p, vec2(0.68, 0.47), 0.13);
  if (marco > 0.0) discard;
  float d = min(min(ojo(p - vec2(-0.21, 0.07), -1.0), ojo(p - vec2(0.21, 0.07), 1.0)), boca(p));
  float borde = fwidth(d) * 0.8;
  float trazo = 1.0 - smoothstep(-borde, borde, d);
  float halo = exp(-max(d, 0.0) * 26.0) * 0.4;
  float lineas = 0.88 + 0.12 * sin(vUv.y * 150.0 - uTiempo * 3.0);
  vec3 color = vec3(0.006, 0.018, 0.024) + vec3(0.0, 0.03, 0.028) * (1.0 - length(p));
  color += uColor * (trazo * 2.6 + halo) * lineas;
  color += vec3(0.07) * smoothstep(0.55, 0.0, length(p - vec2(-0.5, 0.38)));
  color *= 1.0 - smoothstep(-0.05, 0.0, marco) * 0.6;
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const ARRIBA = new THREE.Vector3(0, 1, 0);
const REPOSO = [new THREE.Vector3(-0.205, -0.02, 0.02), new THREE.Vector3(0.205, -0.02, 0.02)];
const FESTEJO = [new THREE.Vector3(-0.2, 0.25, 0.05), new THREE.Vector3(0.2, 0.25, 0.05)];
const SALUDO = new THREE.Vector3(0.21, 0.26, 0.07);
const SENAL = new THREE.Vector3(0.15, 0.1, 0.23);
const rayo = new THREE.Ray();
const hacia = new THREE.Vector3();
const derecha = new THREE.Vector3();
const atras = new THREE.Vector3();
const meta = new THREE.Vector3();
const lado = new THREE.Vector3();
const frente = new THREE.Vector3();

const limitar = (valor, minimo, maximo) => Math.min(maximo, Math.max(minimo, valor));
const diferencia = (angulo) => Math.atan2(Math.sin(angulo), Math.cos(angulo));
const suave = (k) => k * k * (3 - 2 * k);

function crearMateriales() {
  const ojos = new THREE.Color(COLOR_OJOS);
  const luz = new THREE.MeshBasicMaterial({ color: ojos.clone().multiplyScalar(2.4) });
  luz.userData.base = luz.color.clone();
  return {
    marfil: new THREE.MeshPhysicalMaterial({
      color: '#f1ece2',
      roughness: 0.34,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
    }),
    rojo: new THREE.MeshPhysicalMaterial({
      color: '#c8102e',
      roughness: 0.4,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
    }),
    grafito: new THREE.MeshStandardMaterial({ color: '#2b3139', roughness: 0.42, metalness: 0.55 }),
    luz,
    chorro: new THREE.MeshBasicMaterial({
      color: ojos.clone().multiplyScalar(1.4),
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    pantalla: new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: ojos },
        uAbierto: { value: 1 },
        uBoca: { value: 0 },
        uFeliz: { value: 0 },
        uPensar: { value: 0 },
        uPreocupado: { value: 0 },
        uMirada: { value: new THREE.Vector2() },
        uTiempo: { value: 0 },
      },
      vertexShader: VERTICES,
      fragmentShader: FRAGMENTOS,
    }),
  };
}

function pieza(geometria, material, padre, posicion = [0, 0, 0], sombra = true) {
  const malla = new THREE.Mesh(geometria, material);
  malla.position.set(...posicion);
  malla.castShadow = sombra;
  padre.add(malla);
  return malla;
}

export function crearRobot() {
  const materiales = crearMateriales();
  const grupo = new THREE.Group();
  grupo.name = 'Robot';
  const cuerpo = new THREE.Group();
  cuerpo.scale.setScalar(ESCALA);
  cuerpo.rotation.order = 'YXZ';
  grupo.add(cuerpo);

  const perfil = [
    [0, -0.13],
    [0.06, -0.125],
    [0.105, -0.095],
    [0.13, -0.045],
    [0.136, 0.01],
    [0.128, 0.055],
    [0.105, 0.095],
    [0.065, 0.122],
    [0, 0.13],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  pieza(new THREE.LatheGeometry(perfil, 40), materiales.marfil, cuerpo);
  pieza(new THREE.TorusGeometry(0.133, 0.013, 10, 48), materiales.rojo, cuerpo, [0, -0.03, 0]).rotation.x =
    Math.PI / 2;
  pieza(new THREE.CircleGeometry(0.024, 24), materiales.luz, cuerpo, [0, 0.035, 0.134], false);
  pieza(new THREE.TorusGeometry(0.032, 0.006, 8, 24), materiales.grafito, cuerpo, [0, 0.035, 0.132]);
  pieza(new THREE.CylinderGeometry(0.034, 0.042, 0.06, 18), materiales.grafito, cuerpo, [0, 0.15, 0]);

  const cabeza = new THREE.Group();
  cabeza.position.y = 0.3;
  cabeza.rotation.order = 'YXZ';
  cuerpo.add(cabeza);
  pieza(new RoundedBoxGeometry(0.4, 0.29, 0.27, 4, 0.045), materiales.marfil, cabeza);
  const pantalla = pieza(
    new THREE.PlaneGeometry(0.32, 0.225),
    materiales.pantalla,
    cabeza,
    [0, 0, 0.137],
    false,
  );
  for (const lado of [-1, 1]) {
    pieza(new THREE.CylinderGeometry(0.058, 0.058, 0.045, 28), materiales.rojo, cabeza, [
      lado * 0.205,
      0,
      0,
    ]).rotation.z = Math.PI / 2;
    pieza(
      new THREE.TorusGeometry(0.036, 0.0065, 8, 28),
      materiales.luz,
      cabeza,
      [lado * 0.229, 0, 0],
      false,
    ).rotation.y = Math.PI / 2;
  }
  pieza(new THREE.SphereGeometry(0.02, 16, 12), materiales.grafito, cabeza, [0.09, 0.145, 0]);
  const antena = new THREE.Group();
  antena.position.set(0.09, 0.15, 0);
  cabeza.add(antena);
  pieza(new THREE.CylinderGeometry(0.0055, 0.0055, 0.1, 8), materiales.grafito, antena, [0, 0.05, 0]);
  pieza(new THREE.SphereGeometry(0.02, 16, 12), materiales.luz, antena, [0, 0.108, 0], false);

  const manos = REPOSO.map((posicion) => {
    const mano = new THREE.Group();
    mano.position.copy(posicion);
    cuerpo.add(mano);
    pieza(new THREE.SphereGeometry(0.042, 20, 14), materiales.marfil, mano).scale.set(0.85, 1.05, 0.85);
    pieza(new THREE.TorusGeometry(0.03, 0.008, 8, 20), materiales.rojo, mano, [0, 0.038, 0]).rotation.x =
      Math.PI / 2;
    return mano;
  });

  const propulsor = new THREE.Group();
  propulsor.position.y = -0.135;
  cuerpo.add(propulsor);
  pieza(new THREE.CylinderGeometry(0.05, 0.036, 0.04, 22), materiales.grafito, propulsor);
  pieza(new THREE.CircleGeometry(0.03, 20), materiales.luz, propulsor, [0, -0.021, 0], false).rotation.x =
    Math.PI / 2;
  const cono = new THREE.ConeGeometry(0.034, 0.17, 18, 1, true).rotateX(Math.PI).translate(0, -0.085, 0);
  const chorro = pieza(cono, materiales.chorro, propulsor, [0, -0.021, 0], false);

  const robot = { grupo, cuerpo, cabeza, antena, manos, chorro, pantalla, materiales };
  grupo.userData.partes = robot;
  return robot;
}

export function liberarRobot(robot) {
  robot.grupo.traverse((objeto) => {
    if (objeto.isMesh) objeto.geometry.dispose();
  });
  for (const material of Object.values(robot.materiales)) material.dispose();
}

export function crearEstadoRobot() {
  return {
    iniciado: false,
    posicion: new THREE.Vector3(),
    velocidad: new THREE.Vector3(),
    previa: new THREE.Vector3(),
    yaw: 0,
    cabeza: new THREE.Vector2(),
    inclinacion: new THREE.Vector2(),
    antena: { x: 0, z: 0, vx: 0, vz: 0 },
    tiempo: 0,
    reloj: 0,
    parpadeo: 2,
    cierre: 0,
    boca: 0,
    giro: 0,
    saludo: 0,
    senal: 0,
    festejo: 0,
    expresion: { feliz: 0, pensar: 0, preocupado: 0 },
  };
}

export function puntoDeVuelo(salida, jugador, camara, interior = 0) {
  derecha.setFromMatrixColumn(camara.matrixWorld, 0).setY(0);
  atras.setFromMatrixColumn(camara.matrixWorld, 2).setY(0);
  if (derecha.lengthSq() < 1e-6) derecha.set(1, 0, 0);
  if (atras.lengthSq() < 1e-6) atras.set(0, 0, 1);
  derecha.normalize();
  atras.normalize();
  salida
    .copy(jugador)
    .addScaledVector(derecha, THREE.MathUtils.lerp(0.95, 0.65, interior))
    .addScaledVector(atras, 0.25);
  salida.y = jugador.y + THREE.MathUtils.lerp(1.62, 1.5, interior);
  return salida;
}

export function puntoEnElAula(salida, vista) {
  const [izquierda, derechaArriba] = vista.esquinas;
  lado.subVectors(derechaArriba, izquierda).normalize();
  frente.subVectors(vista.posicion, vista.mirar).setY(0).normalize();
  return salida.copy(derechaArriba).addScaledVector(lado, 0.34).addScaledVector(frente, 0.35);
}

function suavizar(actual, objetivo, velocidad, tiempo, dt) {
  const omega = 2 / tiempo;
  const x = omega * dt;
  const factor = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  for (const eje of ['x', 'y', 'z']) {
    const cambio = actual[eje] - objetivo[eje];
    const temporal = (velocidad[eje] + omega * cambio) * dt;
    velocidad[eje] = (velocidad[eje] - omega * temporal) * factor;
    actual[eje] = objetivo[eje] + (cambio + temporal) * factor;
  }
}

function despejar(bvh, desde, posicion) {
  hacia.subVectors(posicion, desde);
  const largo = hacia.length();
  if (largo > 1e-4) {
    hacia.divideScalar(largo);
    rayo.set(desde, hacia);
    const impacto = bvh.raycastFirst(rayo, THREE.DoubleSide, 0, largo + RADIO);
    if (impacto) posicion.copy(desde).addScaledVector(hacia, Math.max(0.15, impacto.distance - RADIO));
  }
  rayo.set(posicion, ARRIBA);
  const techo = bvh.raycastFirst(rayo, THREE.DoubleSide, 0, ALTO_LIBRE);
  if (techo) posicion.y -= ALTO_LIBRE - techo.distance;
}

function acercar(actual, objetivo, dt, rapidez) {
  return actual + (objetivo - actual) * (1 - Math.exp(-dt * rapidez));
}

export function moverRobot(robot, estado, entrada) {
  const {
    objetivo,
    origen = null,
    mirar = null,
    bvh = null,
    dt,
    reducir = false,
    hablando = false,
    expresion = null,
    gesto = null,
    fiesta = false,
  } = entrada;
  const paso = Math.min(dt, 0.05);
  if (!estado.iniciado || estado.posicion.distanceToSquared(objetivo) > 600) {
    estado.posicion.copy(objetivo);
    estado.velocidad.set(0, 0, 0);
    estado.iniciado = true;
  }
  estado.previa.copy(estado.velocidad);
  suavizar(estado.posicion, objetivo, estado.velocidad, reducir ? 0.2 : 0.34, paso);
  if (bvh && origen) despejar(bvh, origen, estado.posicion);
  robot.grupo.position.copy(estado.posicion);
  estado.reloj += paso;
  if (!reducir) estado.tiempo += paso;
  const t = estado.tiempo;
  const v = estado.velocidad;
  const rapidez = Math.hypot(v.x, v.z);

  let rumbo = estado.yaw;
  if (mirar) rumbo = Math.atan2(mirar.x - estado.posicion.x, mirar.z - estado.posicion.z);
  if (rapidez > 1.2 && !hablando && gesto !== 'senalar') rumbo = Math.atan2(v.x, v.z);
  estado.yaw += diferencia(rumbo - estado.yaw) * (1 - Math.exp(-paso * (reducir ? 12 : 5)));

  const seno = Math.sin(estado.yaw);
  const coseno = Math.cos(estado.yaw);
  const adelante = v.x * seno + v.z * coseno;
  const lateral = v.x * coseno - v.z * seno;
  estado.inclinacion.x = acercar(
    estado.inclinacion.x,
    reducir ? 0 : limitar(adelante * 0.08, -0.32, 0.32),
    paso,
    6,
  );
  estado.inclinacion.y = acercar(
    estado.inclinacion.y,
    reducir ? 0 : limitar(-lateral * 0.08, -0.32, 0.32),
    paso,
    6,
  );

  estado.giro = fiesta && !reducir ? Math.min(1, estado.giro + paso / 0.95) : fiesta ? estado.giro : 0;
  const vuelta = suave(estado.giro) * Math.PI * 2;
  const bote = reducir ? 0 : Math.sin(t * 2.3) * 0.035 + Math.sin(t * 0.83 + 1.3) * 0.018;
  robot.cuerpo.position.set(0, bote + Math.sin(estado.giro * Math.PI) * 0.14, 0);
  robot.cuerpo.rotation.set(estado.inclinacion.x, estado.yaw + vuelta, estado.inclinacion.y);

  let giroCabeza = reducir ? 0 : Math.sin(t * 0.5) * 0.3;
  let cabeceo = 0;
  if (mirar) {
    hacia.subVectors(mirar, estado.posicion);
    giroCabeza = limitar(diferencia(Math.atan2(hacia.x, hacia.z) - estado.yaw - vuelta), -1.1, 1.1);
    cabeceo = limitar(-Math.atan2(hacia.y - 0.3, Math.hypot(hacia.x, hacia.z)), -0.45, 0.45);
  }
  const restoGiro = giroCabeza - estado.cabeza.x;
  const restoCabeceo = cabeceo - estado.cabeza.y;
  estado.cabeza.x = acercar(estado.cabeza.x, giroCabeza, paso, 7);
  estado.cabeza.y = acercar(estado.cabeza.y, cabeceo, paso, 7);
  robot.cabeza.rotation.set(estado.cabeza.y, estado.cabeza.x, 0);

  const a = estado.antena;
  if (reducir) {
    a.x = 0;
    a.z = 0;
  } else {
    const ax = (v.x - estado.previa.x) / paso;
    const az = (v.z - estado.previa.z) / paso;
    a.vx += (-90 * a.x - 8 * a.vx - (ax * seno + az * coseno) * 1.2) * paso;
    a.vz += (-90 * a.z - 8 * a.vz + (ax * coseno - az * seno) * 1.2) * paso;
    a.x += a.vx * paso;
    a.z += a.vz * paso;
  }
  robot.antena.rotation.set(limitar(a.x, -0.7, 0.7), 0, limitar(a.z, -0.7, 0.7));

  estado.saludo = acercar(estado.saludo, gesto === 'saludar' && !reducir ? 1 : 0, paso, 6);
  estado.senal = acercar(estado.senal, gesto === 'senalar' ? 1 : 0, paso, 6);
  estado.festejo = acercar(estado.festejo, fiesta ? 1 : 0, paso, 6);
  robot.manos.forEach((mano, i) => {
    mano.position.copy(REPOSO[i]);
    if (!reducir) {
      mano.position.y += Math.sin(t * 2.3 + 0.9 + i * 0.6) * 0.022;
      if (hablando) {
        mano.position.y += Math.sin(estado.reloj * 4 + i * 2) * 0.025;
        mano.position.z += Math.cos(estado.reloj * 4 + i * 2) * 0.02;
      }
    }
    if (i === 1) {
      meta.copy(SALUDO);
      meta.x += Math.sin(estado.reloj * 11) * 0.05;
      mano.position.lerp(meta, estado.saludo);
      mano.position.lerp(SENAL, estado.senal);
    }
    mano.position.lerp(FESTEJO[i], estado.festejo);
  });

  const u = robot.materiales.pantalla.uniforms;
  const deseada = fiesta ? 'feliz' : expresion;
  for (const [nombre, uniforme] of Object.entries(EXPRESIONES)) {
    estado.expresion[nombre] = acercar(estado.expresion[nombre], deseada === nombre ? 1 : 0, paso, 9);
    u[uniforme].value = estado.expresion[nombre];
  }
  estado.parpadeo -= paso;
  if (estado.parpadeo <= 0) {
    estado.parpadeo = 2.4 + Math.random() * 3.2;
    estado.cierre = 0.18;
  }
  estado.cierre = Math.max(0, estado.cierre - paso);
  u.uAbierto.value = estado.cierre > 0 ? Math.abs(estado.cierre / 0.09 - 1) : 1;
  const habla = Math.abs(Math.sin(estado.reloj * 14.5) * Math.sin(estado.reloj * 5.1 + 0.7));
  estado.boca = acercar(estado.boca, hablando ? (reducir ? 0.5 : 0.18 + 0.82 * habla) : 0, paso, 22);
  u.uBoca.value = estado.boca;
  u.uMirada.value.set(
    limitar(restoGiro * 2.2 + (reducir ? 0 : Math.sin(t * 0.7) * 0.25), -1, 1),
    limitar(-restoCabeceo * 2.2, -1, 1),
  );
  u.uTiempo.value = estado.reloj;

  const { luz } = robot.materiales;
  luz.color.copy(luz.userData.base).multiplyScalar(1 + estado.boca * 0.6);
  const llama = reducir ? 0 : Math.sin(estado.reloj * 47) * 0.07 + Math.sin(estado.reloj * 31) * 0.05;
  robot.chorro.scale.set(1, 1 + llama + Math.min(0.6, rapidez * 0.08) + Math.max(0, v.y) * 0.25, 1);
}
