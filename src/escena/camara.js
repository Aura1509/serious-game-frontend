import * as THREE from 'three';

const ARRIBA = new THREE.Vector3(0, 1, 0);
const mirar = new THREE.Vector3();
const deseada = new THREE.Vector3();
const direccion = new THREE.Vector3();
const lateral = new THREE.Vector3();
const origen = new THREE.Vector3();
const rayo = new THREE.Ray();
const cabeza = new THREE.Vector3();
const MARGEN = 0.3;
const TECHO_INTERIOR = 3.4;

export const limitar = (valor, minimo, maximo) => Math.min(maximo, Math.max(minimo, valor));

export function crearEstadoCamara() {
  return {
    yaw: 0,
    pitch: 0.32,
    distancia: 6,
    interior: 0,
    arrastrando: false,
    iniciada: false,
    mirando: new THREE.Vector3(),
  };
}

export function alturaDelTecho(bvh, punto, maximo = 6) {
  if (!bvh) return Infinity;
  rayo.origin.copy(punto);
  rayo.direction.copy(ARRIBA);
  return bvh.raycastFirst(rayo, THREE.DoubleSide, 0, maximo)?.distance ?? Infinity;
}

export function distanciaLibre(bvh, desde, hacia, maximo) {
  if (!bvh || maximo <= 0) return maximo;
  lateral.crossVectors(hacia, ARRIBA);
  if (lateral.lengthSq() < 1e-6) lateral.set(1, 0, 0);
  lateral.normalize();
  let libre = maximo;
  for (const desvio of [0, 0.18, -0.18]) {
    origen.copy(desde).addScaledVector(lateral, desvio);
    rayo.set(origen, hacia);
    const impacto = bvh.raycastFirst(rayo, THREE.DoubleSide, 0, maximo + MARGEN);
    if (impacto && (desvio === 0 || impacto.distance > 0.15))
      libre = Math.min(libre, impacto.distance - MARGEN);
  }
  return Math.max(0.5, libre);
}

function seguirAlJugador(estado, { objetivo, bvh, teclas, giro, delta }) {
  if (giro.current) {
    estado.yaw += giro.current * 0.5;
    giro.current = 0;
  }
  if (teclas.has('KeyQ')) estado.yaw += delta * 1.8;
  if (teclas.has('KeyE')) estado.yaw -= delta * 1.8;
  if (teclas.has('+') || teclas.has('NumpadAdd')) estado.distancia -= delta * 4;
  if (teclas.has('-') || teclas.has('NumpadSubtract')) estado.distancia += delta * 4;
  estado.distancia = limitar(estado.distancia, 2.5, 10);
  mirar.copy(objetivo);
  mirar.y += 1.5;
  const techo = alturaDelTecho(bvh, mirar);
  estado.interior += (Number(techo < TECHO_INTERIOR) - estado.interior) * (1 - Math.exp(-delta * 3));
  const distancia = THREE.MathUtils.lerp(estado.distancia, Math.min(estado.distancia, 3.2), estado.interior);
  let pitch = THREE.MathUtils.lerp(estado.pitch, Math.min(estado.pitch, 0.22), estado.interior);
  if (techo < Infinity) pitch = Math.min(pitch, Math.asin(limitar((techo - 0.35) / distancia, 0.05, 1)));
  direccion.set(
    Math.sin(estado.yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(estado.yaw) * Math.cos(pitch),
  );
  deseada.copy(mirar).addScaledVector(direccion, distancia);
}

export function actualizarCamara(camara, estado, opciones) {
  const { vista, delta, reducirMovimiento, bvh } = opciones;
  if (vista) {
    deseada.copy(vista.posicion);
    mirar.copy(vista.mirar);
  } else {
    seguirAlJugador(estado, opciones);
  }
  const mezcla = reducirMovimiento || !estado.iniciada ? 1 : 1 - Math.exp(-delta * 8);
  estado.iniciada = true;
  camara.position.lerp(deseada, mezcla);
  estado.mirando.lerp(mirar, mezcla);
  if (!vista) {
    direccion.subVectors(camara.position, estado.mirando);
    const largo = direccion.length();
    if (largo > 1e-3) {
      direccion.divideScalar(largo);
      const libre = distanciaLibre(bvh, estado.mirando, direccion, largo);
      if (libre < largo) camara.position.copy(estado.mirando).addScaledVector(direccion, libre);
    }
  }
  camara.lookAt(estado.mirando);
}

const proyectado = new THREE.Vector3();

export function desplazarVista(camara, estado, vista, ancho, alto, delta) {
  const objetivo = vista && ancho > 900 ? 0.09 : 0;
  estado.desplazamiento =
    (estado.desplazamiento ?? 0) + (objetivo - (estado.desplazamiento ?? 0)) * (1 - Math.exp(-delta * 4));
  if (estado.desplazamiento > 0.002)
    camara.setViewOffset(ancho, alto, -ancho * estado.desplazamiento, 0, ancho, alto);
  else if (camara.view?.enabled) camara.clearViewOffset();
}

export function proyectarTablero(marco, vista, camara, ancho, alto) {
  if (!marco) return;
  if (!vista?.esquinas) {
    marco.style.visibility = 'hidden';
    return;
  }
  let izquierda = Infinity;
  let derecha = -Infinity;
  let arriba = Infinity;
  let abajo = -Infinity;
  for (const esquina of vista.esquinas) {
    proyectado.copy(esquina).project(camara);
    if (proyectado.z > 1) {
      marco.style.visibility = 'hidden';
      return;
    }
    const x = ((proyectado.x + 1) / 2) * ancho;
    const y = ((1 - proyectado.y) / 2) * alto;
    izquierda = Math.min(izquierda, x);
    derecha = Math.max(derecha, x);
    arriba = Math.min(arriba, y);
    abajo = Math.max(abajo, y);
  }
  const anchoMarco = Math.max(1, derecha - izquierda);
  marco.style.visibility = 'visible';
  marco.style.left = `${izquierda}px`;
  marco.style.top = `${arriba}px`;
  marco.style.width = `${anchoMarco}px`;
  marco.style.height = `${abajo - arriba}px`;
  marco.style.setProperty('--escala', String(anchoMarco / 960));
  marco.style.setProperty('--alto-pagina', `${(960 * (abajo - arriba)) / anchoMarco}px`);
}

export function atenuarAvatar(avatar, camara, vista) {
  cabeza.copy(avatar.position);
  cabeza.y += 1.4;
  const opacidad = vista ? 1 : limitar((camara.position.distanceTo(cabeza) - 0.6) / 0.9, 0.15, 1);
  for (const material of avatar.userData.partes?.materiales ?? []) material.opacity = opacidad;
}
