import * as THREE from 'three';
import { buscarRuta, consultar } from './ocupacion.js';
import { ENTRADA, ESTUDIO, PERSONAJES, PROFESORES, SENTADOS } from './conversaciones.js';
import { crearHumano, posarHumano } from './humano.js';
import { animarPersonaje, ponerGafas } from './personajes.js';
import { animarCara, crearPersonaje } from './elenco.js';
import { crearBaston, crearSillaDeRuedas, rodarSilla } from './ayudas.js';
import { crearAzar } from './vegetacion.js';

const ASIENTO_BANCA = 0.47;
const ASIENTO_SILLA = 0.5;
const ASIENTO_DEL_CLIP = 0.48;
const ZANCADA = 1.3;
const SALUDO = 2.6;
const VISIBLE = 75;
const LETRERO = 14;
const CARA_VISIBLE = 30;
const SILLAS_OCUPADAS = [0, 3, 6, 9, 10, 13];
const rayo = new THREE.Ray(new THREE.Vector3(), new THREE.Vector3(0, -1, 0));
const direccion = new THREE.Vector3();
const hastaJugador = new THREE.Vector3();
const mano = new THREE.Vector3();
const suavizar = (ritmo, dt) => 1 - Math.exp(-ritmo * dt);
const envolver = (angulo) => Math.atan2(Math.sin(angulo), Math.cos(angulo));

export function tramoValido(rejilla, a, b) {
  const pasos = Math.max(1, Math.ceil(a.distanceTo(b)));
  let fuera = 0;
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    const { camino, edificio } = consultar(rejilla, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
    if (edificio < 0.5 && t < 0.85) return false;
    if (camino > 1.2) fuera++;
  }
  return fuera / (pasos + 1) <= 0.15;
}

function anilloDeLaPlaza(rejilla) {
  for (let radio = 16; radio <= 30; radio += 0.5) {
    const puntos = [];
    for (let i = 0; i < 16; i++) {
      const angulo = (i / 16) * Math.PI * 2;
      puntos.push(new THREE.Vector3(Math.sin(angulo) * radio, 0, Math.cos(angulo) * radio));
    }
    const valido = puntos.every((punto, i) => tramoValido(rejilla, punto, puntos[(i + 1) % puntos.length]));
    if (valido) return [...puntos, puntos[0].clone()];
  }
  return null;
}

export function crearRutas(puntos, rejilla) {
  const rutas = [];
  const anillo = anilloDeLaPlaza(rejilla);
  if (anillo) rutas.push({ puntos: anillo, vuelta: true });
  const puertas = Object.entries(puntos)
    .filter(([nombre]) => /^INT_\w+_Puerta$/.test(nombre))
    .map(([, punto]) => punto);
  const entrada = puntos.SPAWN_Jugador;
  const pares = puertas.map((puerta) => [entrada ?? new THREE.Vector3(), puerta]);
  for (let i = 0; i < puertas.length; i++) pares.push([puertas[i], puertas[(i + 1) % puertas.length]]);
  for (const [desde, hasta] of pares) {
    if (!desde || !hasta || desde === hasta) continue;
    const ruta = buscarRuta(rejilla, desde, hasta);
    if (ruta && ruta.length > 1) rutas.push({ puntos: ruta, vuelta: false });
  }
  return rutas;
}

function prepararPersona(datos, id, azar, recursos) {
  const grupo = new THREE.Group();
  grupo.name = `Persona_${datos.nombre}`;
  let personaje = null;
  let humano = null;
  const modelo = recursos?.modelos?.[datos.aspecto.modelo];
  if (modelo) {
    personaje = crearPersonaje(modelo, recursos.animaciones, {
      ...datos.aspecto,
      altura: datos.perfil.altura,
    });
    personaje.fase = azar();
    if (datos.perfil.gafas)
      ponerGafas(personaje, { oscuras: datos.perfil.gafas === 'oscuras', adelante: 0.024 });
  } else {
    humano = crearHumano(datos.perfil);
    grupo.add(humano.grupo);
  }
  return {
    id,
    datos,
    humano,
    personaje,
    grupo,
    altura: personaje ? personaje.altura : humano.escala * 1.65,
    rapidez: 0,
    tipo: 'camina',
    fase: azar() * Math.PI * 2,
    tiempo: azar() * 10,
    andar: 0,
    mirar: 0,
    saludo: 0,
    hablar: 0,
    temporizadorSaludo: 0,
    ultimoSaludo: -100,
    espera: azar() * 2,
    conversando: false,
  };
}

function sentarEnSilla(persona) {
  const silla = crearSillaDeRuedas();
  persona.grupo.add(silla.grupo);
  persona.silla = silla;
  const cuerpo = persona.personaje?.grupo ?? persona.humano.grupo;
  cuerpo.position.z = -0.08;
  if (persona.personaje) cuerpo.position.y = silla.asiento - ASIENTO_DEL_CLIP * persona.personaje.escala;
}

function darBaston(persona) {
  const baston = crearBaston();
  if (!persona.personaje) {
    baston.grupo.position.set(0, -0.04, 0.04);
    baston.grupo.rotation.x = -0.12;
    persona.humano.huesos.manoD.add(baston.grupo);
    return;
  }
  baston.grupo.rotation.order = 'YXZ';
  persona.grupo.add(baston.grupo);
  persona.baston = { pivote: baston.grupo, largo: baston.largo };
}

function moverBaston(persona) {
  const { pivote, largo } = persona.baston;
  persona.personaje.huesos.manoD.getWorldPosition(mano);
  persona.grupo.worldToLocal(mano);
  pivote.position.copy(mano);
  const inclinacion = Math.acos(THREE.MathUtils.clamp(mano.y / largo, 0.2, 1));
  pivote.rotation.set(
    -inclinacion,
    0,
    Math.sin(persona.personaje.fase * Math.PI * 2) * 0.3 * persona.rapidez,
  );
}

function lugarDeProfesor(lugar, indice, puntos) {
  if (lugar === 'plaza') {
    const entrada = puntos.SPAWN_Jugador ?? new THREE.Vector3(0, 0, 24);
    const angulo = Math.atan2(entrada.x, entrada.z) + (indice % 2 ? 0.2 : -0.2);
    const x = Math.sin(angulo) * 17;
    const z = Math.cos(angulo) * 17;
    return { x, y: 0, z, giro: Math.atan2(entrada.x - x, entrada.z - z) };
  }
  const puerta = puntos[`INT_${lugar}_Puerta`];
  if (!puerta) return null;
  const hacia = new THREE.Vector3(-puerta.x, 0, -puerta.z).normalize();
  const lado = (indice % 2 ? 1.6 : -1.6) * (indice > 1 ? 2 : 1);
  return {
    x: puerta.x + hacia.x * 3.2 + hacia.z * lado,
    y: puerta.y,
    z: puerta.z + hacia.z * 3.2 - hacia.x * lado,
    giro: Math.atan2(hacia.x, hacia.z),
  };
}

function colocar(persona, lugar) {
  persona.grupo.position.set(lugar.x, lugar.y ?? 0, lugar.z);
  persona.grupo.rotation.y = lugar.giro;
  persona.giroBase = lugar.giro;
}

export function crearPersonas({
  extras = {},
  rutas,
  bancas,
  cantidad,
  puntos = null,
  estudio = null,
  semilla = 21,
}) {
  const azar = crearAzar(semilla);
  const lista = [];
  const caminantes = rutas.length ? PERSONAJES.slice(0, cantidad) : [];
  caminantes.forEach((datos, i) => {
    const persona = prepararPersona(datos, i, azar, extras.personajes);
    const ruta = rutas[i % rutas.length];
    persona.tipo = datos.tipo === 'silla' ? 'silla' : 'camina';
    persona.ruta = ruta;
    persona.tramo = Math.floor(azar() * (ruta.puntos.length - 1));
    persona.sentido = 1;
    persona.velocidad = persona.tipo === 'silla' ? 0.9 : 1.05 + azar() * 0.3;
    persona.grupo.position.lerpVectors(ruta.puntos[persona.tramo], ruta.puntos[persona.tramo + 1], azar());
    persona.obstaculo = { x: 0, y: 0, z: 0, radio: persona.tipo === 'silla' ? 0.5 : 0.3 };
    if (persona.tipo === 'silla') sentarEnSilla(persona);
    if (datos.tipo === 'baston') darBaston(persona);
    lista.push(persona);
  });
  const sentar = (persona, banca) => {
    persona.tipo = 'sentada';
    colocar(persona, { x: banca.x, z: banca.z, giro: banca.giro });
    persona.grupo.translateZ(0.06);
    persona.obstaculo = null;
  };
  const comunes = bancas.filter((banca) => !banca.entrada);
  SENTADOS.slice(0, comunes.length).forEach((datos, i) => {
    const persona = prepararPersona(datos, PERSONAJES.length + i, azar, extras.personajes);
    sentar(persona, comunes[i]);
    lista.push(persona);
  });
  if (puntos) {
    const porLugar = {};
    PROFESORES.forEach((datos, i) => {
      const indice = (porLugar[datos.lugar] = (porLugar[datos.lugar] ?? -1) + 1);
      const lugar = lugarDeProfesor(datos.lugar, indice, puntos);
      if (!lugar) return;
      const persona = prepararPersona(
        datos,
        PERSONAJES.length + SENTADOS.length + i,
        azar,
        extras.personajes,
      );
      persona.tipo = 'fija';
      colocar(persona, lugar);
      persona.obstaculo = { x: lugar.x, y: lugar.y, z: lugar.z, radio: 0.35 };
      lista.push(persona);
    });
    const deEntrada = bancas.filter((banca) => banca.entrada);
    const entrada = puntos.SPAWN_Jugador ?? new THREE.Vector3(0, 0, 24);
    let asiento = 0;
    ENTRADA.forEach((datos, i) => {
      const id = PERSONAJES.length + SENTADOS.length + PROFESORES.length + i;
      if (datos.tipo === 'sentada') {
        const banca = deEntrada[asiento++];
        if (!banca) return;
        const persona = prepararPersona(datos, id, azar, extras.personajes);
        sentar(persona, banca);
        lista.push(persona);
        return;
      }
      const persona = prepararPersona(datos, id, azar, extras.personajes);
      persona.tipo = 'fija';
      const lugar = { x: entrada.x + 2.4, y: entrada.y, z: entrada.z - 3.5 };
      colocar(persona, { ...lugar, giro: Math.atan2(entrada.x - lugar.x, entrada.z - lugar.z) });
      persona.obstaculo = { ...lugar, radio: 0.35 };
      lista.push(persona);
    });
  }
  if (estudio) {
    const base = PERSONAJES.length + SENTADOS.length + PROFESORES.length + ENTRADA.length;
    let sentados = 0;
    ESTUDIO.forEach((datos, i) => {
      const persona = prepararPersona(datos, base + i, azar, extras.personajes);
      if (datos.tipo === 'sentada') {
        const silla = estudio.sillas[SILLAS_OCUPADAS[sentados++ % SILLAS_OCUPADAS.length]];
        persona.tipo = 'sentada';
        colocar(persona, silla);
        persona.grupo.translateZ(0.03);
        persona.obstaculo = null;
      } else {
        const mesa = estudio.mesas[1];
        const lugar = { x: mesa.x + estudio.lado.x * 1.35, y: 0, z: mesa.z + estudio.lado.z * 1.35 };
        persona.tipo = 'fija';
        colocar(persona, { ...lugar, giro: Math.atan2(mesa.x - lugar.x, mesa.z - lugar.z) });
        persona.obstaculo = { ...lugar, radio: 0.35 };
      }
      lista.push(persona);
    });
  }
  moverPersonas(lista, new THREE.Vector3(1e4, 0, 1e4), null, 0, true, null);
  return lista;
}

function alturaDelSuelo(bvh, x, y, z) {
  if (!bvh) return y;
  rayo.origin.set(x, y + 1.2, z);
  const impacto = bvh.raycastFirst(rayo, THREE.DoubleSide, 0, 4);
  return impacto ? impacto.point.y : y;
}

function girarHacia(grupo, objetivo, dt) {
  grupo.rotation.y += envolver(objetivo - grupo.rotation.y) * suavizar(8, dt);
}

function avanzar(persona, jugador, bvh, dt) {
  const { puntos, vuelta } = persona.ruta;
  const posicion = persona.grupo.position;
  let moverse = !persona.conversando;
  if (moverse && persona.temporizadorSaludo > 0 && persona.personaje) moverse = false;
  if (moverse && persona.espera > 0) {
    persona.espera -= dt;
    moverse = false;
  }
  const destino = puntos[persona.sentido > 0 ? persona.tramo + 1 : persona.tramo];
  direccion.subVectors(destino, posicion).setY(0);
  const distancia = direccion.length();
  if (moverse && distancia < 0.25) {
    persona.tramo += persona.sentido;
    if (vuelta && persona.tramo >= puntos.length - 1) persona.tramo = 0;
    if (!vuelta && (persona.tramo >= puntos.length - 1 || persona.tramo < 0)) {
      persona.sentido *= -1;
      persona.tramo = Math.min(Math.max(persona.tramo, 0), puntos.length - 2);
      persona.espera = 1 + Math.random() * 2.5;
    }
    moverse = false;
  }
  if (moverse) {
    direccion.divideScalar(distancia || 1);
    hastaJugador.subVectors(jugador, posicion).setY(0);
    if (hastaJugador.length() < 1.4 && hastaJugador.normalize().dot(direccion) > 0.3) moverse = false;
  }
  if (moverse) {
    const paso = Math.min(distancia, persona.velocidad * dt);
    posicion.addScaledVector(direccion, paso);
    if (persona.silla) rodarSilla(persona.silla, paso);
    posicion.y = alturaDelSuelo(bvh, posicion.x, posicion.y, posicion.z);
    persona.fase += (paso / ZANCADA) * Math.PI * 2;
    girarHacia(persona.grupo, Math.atan2(direccion.x, direccion.z), dt);
  }
  const objetivo = moverse ? Math.min(1, persona.velocidad / ZANCADA) : 0;
  persona.andar += (objetivo - persona.andar) * suavizar(6, dt);
  persona.rapidez += ((moverse ? persona.velocidad : 0) - persona.rapidez) * suavizar(6, dt);
}

function atender(persona, jugador, dt) {
  hastaJugador.subVectors(jugador, persona.grupo.position).setY(0);
  const distancia = hastaJugador.length();
  const hacia = Math.atan2(hastaJugador.x, hastaJugador.z);
  if (persona.conversando && persona.tipo !== 'sentada') girarHacia(persona.grupo, hacia, dt);
  else if (persona.tipo === 'fija')
    girarHacia(persona.grupo, distancia < 5 ? hacia : persona.giroBase, dt * 0.6);
  const angulo = envolver(hacia - persona.grupo.rotation.y);
  const visible = distancia < 4.5 && Math.abs(angulo) < 1.9;
  const mirar = visible ? THREE.MathUtils.clamp(angulo, -1.1, 1.1) : 0;
  persona.mirar += (mirar - persona.mirar) * suavizar(4, dt);
  const puedeSaludar = !persona.conversando && persona.tiempo - persona.ultimoSaludo > 25;
  if (puedeSaludar && distancia < 3.2 && Math.abs(angulo) < 1.2) {
    persona.ultimoSaludo = persona.tiempo;
    persona.temporizadorSaludo = persona.personaje ? SALUDO : 1.8;
  }
  persona.temporizadorSaludo -= dt;
  const saludo = persona.temporizadorSaludo > 0 && !persona.conversando ? 1 : 0;
  persona.saludo += (saludo - persona.saludo) * suavizar(6, dt);
  persona.hablar += (Number(persona.conversando) - persona.hablar) * suavizar(5, dt);
}

export function moverPersonas(lista, jugador, bvh, dt, reducirMovimiento, conversando) {
  for (const persona of lista) {
    persona.conversando = persona.id === conversando;
    const distancia = Math.hypot(persona.grupo.position.x - jugador.x, persona.grupo.position.z - jugador.z);
    const visible = distancia < VISIBLE || persona.conversando;
    persona.grupo.visible = visible;
    if (reducirMovimiento) {
      persona.andar = 0;
      persona.rapidez = 0;
      persona.saludo = 0;
      persona.mirar = 0;
      persona.hablar = Number(persona.conversando);
    } else {
      persona.tiempo += dt;
      if (persona.tipo === 'camina' || persona.tipo === 'silla') avanzar(persona, jugador, bvh, dt);
      atender(persona, jugador, dt);
    }
    const sentada = persona.tipo === 'sentada' || persona.tipo === 'silla';
    if (persona.personaje && !visible) {
      persona.personaje.iniciado = false;
    } else if (persona.personaje) {
      animarPersonaje(
        persona.personaje,
        {
          rapidez: sentada ? 0 : persona.rapidez,
          sentado: sentada ? 1 : 0,
          hablar: persona.conversando ? 1 : 0,
          saludar: persona.temporizadorSaludo > 0 && !persona.conversando ? 1 : 0,
          mirar: persona.mirar,
          reducir: reducirMovimiento,
        },
        dt,
      );
      if (distancia < CARA_VISIBLE || persona.conversando) {
        animarCara(
          persona.personaje,
          {
            hablando: persona.conversando,
            alegria: persona.saludo > 0.5 ? 0.75 : 0.4,
            reducir: reducirMovimiento,
          },
          dt,
        );
      }
      if (persona.baston) moverBaston(persona);
    } else
      posarHumano(persona.humano, {
        fase: persona.fase,
        andar: sentada ? 0 : persona.andar,
        tiempo: persona.tiempo,
        mirar: persona.mirar,
        saludo: persona.saludo,
        hablar: persona.hablar,
        sentado: sentada ? 1 : 0,
        asiento: persona.tipo === 'silla' ? ASIENTO_SILLA : ASIENTO_BANCA,
        empujar: persona.tipo === 'silla' ? persona.andar : 0,
      });
    if (persona.obstaculo) {
      persona.obstaculo.x = persona.grupo.position.x;
      persona.obstaculo.y = persona.grupo.position.y;
      persona.obstaculo.z = persona.grupo.position.z;
    }
  }
}

export function mostrarLetrero(persona, jugador) {
  if (!persona.datos.curso || !persona.grupo.visible) return false;
  const { x, y, z } = persona.grupo.position;
  return Math.abs(y - jugador.y) < 3 && Math.hypot(x - jugador.x, z - jugador.z) < LETRERO;
}

export function registrarObstaculos(obstaculos, lista) {
  const propios = lista.map((persona) => persona.obstaculo).filter(Boolean);
  obstaculos.push(...propios);
  return () => {
    for (const obstaculo of propios) {
      const indice = obstaculos.indexOf(obstaculo);
      if (indice >= 0) obstaculos.splice(indice, 1);
    }
  };
}

export function registrarPersonas(registro, lista) {
  registro.lista = lista;
  return () => {
    if (registro.lista === lista) registro.lista = [];
  };
}

export function buscarPersonaCercana(posicion, lista, radio = 1.9) {
  let mejor = null;
  let mejorDistancia = radio;
  for (const persona of lista ?? []) {
    const p = persona.grupo.position;
    if (Math.abs(p.y - posicion.y) > 1.2) continue;
    const distancia = Math.hypot(p.x - posicion.x, p.z - posicion.z);
    if (distancia < mejorDistancia) {
      mejor = persona;
      mejorDistancia = distancia;
    }
  }
  return mejor ? `PERSONA_${mejor.id}` : null;
}
