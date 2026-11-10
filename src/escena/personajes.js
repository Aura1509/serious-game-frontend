import * as THREE from 'three';

export const RUTA_ANIMACIONES = './models/personas/rocketbox/';

const ARCHIVOS = {
  f: {
    quieto: 'f_idle_neutral_01',
    mirar: 'f_idle_look_around_01',
    sentado: 'f_sit_chair_idle_neutral_01',
    sentadoHablar: 'f_sit_chair_gestic_thoughtful',
    hablar: 'f_gestic_talk_neutral_01',
    saludar: 'f_wave_01',
    caminar: 'f_walk_neutral_01',
    pasear: 'f_walk_stroll_01',
    caminarRapido: 'f_walk_fast_01',
    correr: 'f_run_neutral_01',
    correrRapido: 'f_run_fast_01',
  },
  m: {
    quieto: 'm_idle_neutral_01',
    mirar: 'm_idle_look_around_01',
    sentado: 'm_sit_chair_idle_neutral_01',
    sentadoHablar: 'm_sit_chair_gestic_thoughtful',
    hablar: 'm_gestic_talk_neutral_01',
    saludar: 'm_wave_01',
    caminar: 'm_walk_neutral_01',
    pasear: 'm_walk_stroll_01',
  },
};

export const VELOCIDAD_NATURAL = {
  f: { caminar: 1.214, pasear: 0.926, caminarRapido: 1.531, correr: 2.764, correrRapido: 5.379 },
  m: { caminar: 1.012, pasear: 0.693 },
};

export const MARCHAS = {
  jugador: [
    ['caminarRapido', 2],
    ['correr', 3.2],
    ['correrRapido', 5],
  ],
  caminar: [['caminar', 0]],
  pasear: [['pasear', 0]],
};
const CUADRO_EN_EL_AIRE = 5;
const qPadre = new THREE.Quaternion();
const qGiro = new THREE.Quaternion();
const eje = new THREE.Vector3();

export function urlsDeAnimaciones() {
  const nombres = new Set(Object.values(ARCHIVOS).flatMap((archivos) => Object.values(archivos)));
  return [...nombres].map((nombre) => `${RUTA_ANIMACIONES}${nombre}.glb`);
}

export function limpiarClip(clip, nombre) {
  const pistas = [];
  for (const pista of clip.tracks) {
    const [nodo, propiedad] = pista.name.split('.');
    if (propiedad === 'quaternion') pistas.push(pista);
    else if (propiedad === 'position' && nodo === 'Bip01') {
      const vertical = pista.clone();
      for (let i = 0; i < vertical.values.length; i += 3) {
        vertical.values[i] = 0;
        vertical.values[i + 2] = 0;
      }
      pistas.push(vertical);
    }
  }
  return new THREE.AnimationClip(nombre, clip.duration, pistas);
}

export function clipsPorSexo(gltfs, urls = urlsDeAnimaciones()) {
  const porArchivo = {};
  urls.forEach((url, i) => {
    porArchivo[url.split('/').pop().replace('.glb', '')] = gltfs[i];
  });
  const resultado = {};
  for (const [sexo, archivos] of Object.entries(ARCHIVOS)) {
    resultado[sexo] = {};
    for (const [nombre, archivo] of Object.entries(archivos)) {
      const gltf = porArchivo[archivo];
      if (!gltf?.animations[0]) continue;
      resultado[sexo][nombre] = { clip: limpiarClip(gltf.animations[0], nombre), escena: gltf.scene };
    }
    const carrera = resultado[sexo].correrRapido;
    if (carrera) {
      resultado[sexo].aire = {
        clip: THREE.AnimationUtils.subclip(carrera.clip, 'aire', CUADRO_EN_EL_AIRE, CUADRO_EN_EL_AIRE + 1),
        escena: carrera.escena,
      };
    }
  }
  return resultado;
}

export function mezclaDeMarchas(marchas, rapidez) {
  for (let i = 0; i < marchas.length - 1; i++) {
    const [nombre, desde] = marchas[i];
    const [siguiente, hasta] = marchas[i + 1];
    if (rapidez <= desde) return [[nombre, 1]];
    if (rapidez < hasta) {
      const t = (rapidez - desde) / (hasta - desde);
      return [
        [nombre, 1 - t],
        [siguiente, t],
      ];
    }
  }
  return [[marchas.at(-1)[0], 1]];
}

export function marchasDe(tipo, acciones) {
  const propias = MARCHAS[tipo].filter(([nombre]) => acciones[nombre]);
  return propias.length ? propias : MARCHAS.caminar;
}

export function girarHueso(hueso, angulo) {
  if (!hueso?.parent || !angulo) return;
  hueso.parent.getWorldQuaternion(qPadre).invert();
  eje.set(0, 1, 0).applyQuaternion(qPadre).normalize();
  hueso.quaternion.premultiply(qGiro.setFromAxisAngle(eje, angulo));
}

export function animarPersonaje(personaje, entrada, dt) {
  const { rapidez = 0, sentado = 0, hablar = 0, saludar = 0, aire = 0, mirar = 0, reducir = false } = entrada;
  const { acciones, marchas } = personaje;
  const velocidades = VELOCIDAD_NATURAL[personaje.sexo];
  const escala = personaje.escala ?? 1;
  const metas = {};
  const sumar = (nombre, peso) => {
    if (acciones[nombre] && peso > 0) metas[nombre] = (metas[nombre] ?? 0) + peso;
  };
  const tiempo = reducir ? 0 : dt;
  if (sentado) {
    sumar(hablar > 0.5 && acciones.sentadoHablar ? 'sentadoHablar' : 'sentado', 1);
  } else {
    const suelo = acciones.aire ? 1 - aire : 1;
    const mezcla = mezclaDeMarchas(marchas, rapidez);
    const movimiento = reducir ? 0 : Math.min(1, rapidez / 0.35);
    for (const [nombre, peso] of mezcla) sumar(nombre, peso * movimiento * suelo);
    const quieto = (1 - movimiento) * suelo;
    personaje.variacion -= tiempo;
    if (personaje.variacion < 0) {
      personaje.mirando = personaje.mirando ? 0 : 1;
      personaje.variacion = personaje.mirando
        ? (acciones.mirar?.getClip().duration ?? 4)
        : 7 + Math.random() * 8;
    }
    if (saludar) sumar('saludar', quieto);
    else if (hablar) sumar('hablar', quieto);
    else sumar(personaje.mirando && !reducir ? 'mirar' : 'quieto', quieto);
    sumar('aire', aire);
    const zancada = mezcla.reduce(
      (suma, [nombre, peso]) =>
        suma + peso * velocidades[nombre] * escala * acciones[nombre].getClip().duration,
      0,
    );
    personaje.fase = (personaje.fase + (tiempo * rapidez) / zancada) % 1;
    for (const [nombre] of marchas)
      acciones[nombre].time = personaje.fase * acciones[nombre].getClip().duration;
  }
  if (saludar && !personaje.saludando) acciones.saludar?.reset();
  personaje.saludando = Boolean(saludar);
  const k = personaje.iniciado && !reducir ? 1 - Math.exp(-dt * 7) : 1;
  personaje.iniciado = true;
  for (const [nombre, accion] of Object.entries(acciones)) {
    const actual = personaje.pesos[nombre] ?? 0;
    personaje.pesos[nombre] = actual + ((metas[nombre] ?? 0) - actual) * k;
    accion.setEffectiveWeight(personaje.pesos[nombre]);
  }
  personaje.mixer.update(tiempo);
  if (mirar) {
    girarHueso(personaje.huesos.cuello, mirar * 0.35);
    girarHueso(personaje.huesos.cabeza, mirar * 0.5);
  }
}

export function ponerGafas(personaje, { oscuras = true, adelante = 0.028 } = {}) {
  const { cabezaReal, cabeza, ojoD, ojoI } = personaje.huesos;
  const ancla = cabezaReal ?? cabeza;
  if (!ancla || !ojoD || !ojoI) return null;
  const previas = ancla.getObjectByName('Gafas');
  if (previas) return previas;
  personaje.grupo.updateMatrixWorld(true);
  const derecho = ojoD.getWorldPosition(new THREE.Vector3());
  const izquierdo = ojoI.getWorldPosition(new THREE.Vector3());
  const centro = derecho.clone().add(izquierdo).multiplyScalar(0.5);
  centro.z += adelante;
  const separacion = derecho.distanceTo(izquierdo);
  const material = new THREE.MeshStandardMaterial({
    color: oscuras ? '#141414' : '#9fc6e0',
    roughness: 0.15,
    metalness: 0.3,
    transparent: !oscuras,
    depthWrite: oscuras,
    opacity: oscuras ? 1 : 0.25,
  });
  const marco = new THREE.MeshStandardMaterial({ color: '#1b1b1f', roughness: 0.4 });
  const gafas = new THREE.Group();
  gafas.name = 'Gafas';
  const radio = Math.max(0.018, separacion * 0.34);
  for (const lado of [-1, 1]) {
    const lente = new THREE.Mesh(new THREE.CircleGeometry(radio, 20), material);
    lente.renderOrder = 2;
    lente.scale.y = 0.82;
    lente.position.x = (lado * separacion) / 2;
    const aro = new THREE.Mesh(new THREE.TorusGeometry(radio, 0.0022, 6, 24), marco);
    aro.scale.y = 0.82;
    aro.position.x = lente.position.x;
    gafas.add(lente, aro);
  }
  gafas.add(
    new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.006, separacion - radio * 2), 0.004, 0.004), marco),
  );
  const enMundo = new THREE.Matrix4().makeTranslation(centro.x, centro.y, centro.z);
  ancla.matrixWorld
    .clone()
    .invert()
    .multiply(enMundo)
    .decompose(gafas.position, gafas.quaternion, gafas.scale);
  ancla.add(gafas);
  return gafas;
}
