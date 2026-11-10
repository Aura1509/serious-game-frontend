import * as THREE from 'three';

const TAM = 256;
const SIN_LIENZO = typeof document === 'undefined' || /jsdom/.test(globalThis.navigator?.userAgent ?? '');

export const RASGOS_BASE = {
  iris: '#5a3a22',
  cejas: '#2b1d14',
  pestanas: false,
  rubor: 0.2,
  labios: '#a4545a',
  barba: null,
  grosorCejas: 1,
};

export function gestoNeutro() {
  return { ojos: 1, boca: 0, sonrisa: 0.35, cejas: 0, mirada: 0 };
}

export function claveDelGesto(gesto) {
  const paso = (valor, divisiones) => Math.round(valor * divisiones);
  return [
    paso(gesto.ojos, 4),
    paso(gesto.boca, 4),
    paso(gesto.sonrisa, 4),
    paso(gesto.cejas, 4),
    paso(gesto.mirada, 3),
  ].join('|');
}

export function crearCara(disposicion, rasgos = {}) {
  const cara = {
    disposicion,
    rasgos: { ...RASGOS_BASE, ...rasgos },
    gesto: gestoNeutro(),
    clave: '',
    contexto: null,
    textura: null,
  };
  if (!SIN_LIENZO && disposicion) {
    const lienzo = document.createElement('canvas');
    lienzo.width = TAM;
    lienzo.height = TAM;
    cara.contexto = lienzo.getContext?.('2d') ?? null;
    if (cara.contexto) {
      cara.textura = new THREE.CanvasTexture(lienzo);
      cara.textura.colorSpace = THREE.SRGBColorSpace;
      cara.textura.anisotropy = 4;
    }
  }
  dibujarCara(cara);
  return cara;
}

export function dibujarCara(cara) {
  const clave = claveDelGesto(cara.gesto);
  if (clave === cara.clave) return false;
  cara.clave = clave;
  const c = cara.contexto;
  if (!c) return true;
  const { disposicion, rasgos, gesto } = cara;
  const punto = ([u, v]) => [u * TAM, (1 - v) * TAM];
  const [dx, dy] = punto(disposicion.ojoD);
  const [ix, iy] = punto(disposicion.ojoI);
  const separacion = ix - dx;
  const ancho = separacion * 0.4;
  const alto = ancho * 0.74;
  c.clearRect(0, 0, TAM, TAM);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (rasgos.rubor > 0) {
    for (const [x, y] of [
      [dx - ancho * 0.05, dy + alto * 1.15],
      [ix + ancho * 0.05, iy + alto * 1.15],
    ]) {
      const brillo = c.createRadialGradient(x, y, 0, x, y, ancho * 0.55);
      brillo.addColorStop(0, `rgba(236, 112, 112, ${rasgos.rubor})`);
      brillo.addColorStop(1, 'rgba(236, 112, 112, 0)');
      c.fillStyle = brillo;
      c.fillRect(x - ancho, y - ancho, ancho * 2, ancho * 2);
    }
  }
  if (rasgos.barba === 'sombra') dibujarSombraDeBarba(c, punto(disposicion.boca), separacion, rasgos.cejas);
  dibujarCeja(c, dx, dy, ancho, alto, -1, gesto, rasgos);
  dibujarCeja(c, ix, iy, ancho, alto, 1, gesto, rasgos);
  dibujarOjo(c, dx, dy, ancho, alto, -1, gesto, rasgos);
  dibujarOjo(c, ix, iy, ancho, alto, 1, gesto, rasgos);
  dibujarNariz(c, punto(disposicion.nariz), separacion);
  dibujarBoca(c, punto(disposicion.boca), separacion, gesto, rasgos);
  cara.textura.needsUpdate = true;
  return true;
}

function dibujarCeja(c, x, y, ancho, alto, lado, gesto, rasgos) {
  const subir = gesto.cejas * alto * 0.28;
  const interior = [x - lado * ancho * 0.42, y - alto * 0.98 - subir * 0.6];
  const exterior = [x + lado * ancho * 0.6, y - alto * 0.88 - subir * 0.9];
  const control = [x + lado * ancho * 0.12, y - alto * 1.32 - subir];
  const grueso = ancho * 0.16 * rasgos.grosorCejas;
  const pasos = 12;
  const arriba = [];
  const abajo = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    const px = (1 - t) ** 2 * interior[0] + 2 * (1 - t) * t * control[0] + t * t * exterior[0];
    const py = (1 - t) ** 2 * interior[1] + 2 * (1 - t) * t * control[1] + t * t * exterior[1];
    const media = (grueso * (1 - t * 0.65)) / 2;
    arriba.push([px, py - media]);
    abajo.unshift([px, py + media * 0.8]);
  }
  c.fillStyle = rasgos.cejas;
  c.beginPath();
  [...arriba, ...abajo].forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py)));
  c.closePath();
  c.fill();
}

function esquinasDelOjo(x, y, ancho, alto, lado) {
  return {
    interior: [x - lado * ancho * 0.5, y + alto * 0.06],
    exterior: [x + lado * ancho * 0.52, y - alto * 0.08],
  };
}

function formaDelOjo(c, x, y, ancho, alto, lado, abierto) {
  const { interior, exterior } = esquinasDelOjo(x, y, ancho, alto, lado);
  c.beginPath();
  c.moveTo(...interior);
  c.bezierCurveTo(
    x - lado * ancho * 0.3,
    y - alto * 0.78 * abierto,
    x + lado * ancho * 0.32,
    y - alto * 0.8 * abierto,
    ...exterior,
  );
  c.bezierCurveTo(
    x + lado * ancho * 0.3,
    y + alto * 0.5 * abierto,
    x - lado * ancho * 0.3,
    y + alto * 0.55 * abierto,
    ...interior,
  );
  c.closePath();
}

function dibujarOjo(c, x, y, ancho, alto, lado, gesto, rasgos) {
  const abierto = THREE.MathUtils.clamp(gesto.ojos, 0, 1);
  const linea = '#1d1410';
  if (abierto < 0.2) {
    c.strokeStyle = linea;
    c.lineWidth = ancho * 0.1;
    c.beginPath();
    c.moveTo(x - lado * ancho * 0.5, y);
    c.quadraticCurveTo(x, y + alto * 0.28, x + lado * ancho * 0.52, y - alto * 0.06);
    c.stroke();
    return;
  }
  c.save();
  formaDelOjo(c, x, y, ancho, alto, lado, abierto);
  c.fillStyle = '#fbf8f3';
  c.fill();
  c.clip();
  const radio = ancho * 0.35;
  const cx = x + gesto.mirada * ancho * 0.12;
  const cy = y - alto * 0.05;
  const iris = c.createLinearGradient(cx, cy - radio, cx, cy + radio);
  iris.addColorStop(0, oscurecer(rasgos.iris, 0.45));
  iris.addColorStop(0.55, rasgos.iris);
  iris.addColorStop(1, aclarar(rasgos.iris, 0.35));
  c.fillStyle = iris;
  c.beginPath();
  c.arc(cx, cy, radio, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = oscurecer(rasgos.iris, 0.6);
  c.lineWidth = ancho * 0.035;
  c.stroke();
  c.fillStyle = '#140d0a';
  c.beginPath();
  c.arc(cx, cy, radio * 0.45, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255, 255, 255, 0.95)';
  c.beginPath();
  c.arc(cx + radio * 0.38, cy - radio * 0.4, radio * 0.28, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(cx - radio * 0.4, cy + radio * 0.38, radio * 0.13, 0, Math.PI * 2);
  c.fill();
  const sombra = c.createLinearGradient(x, y - alto * 0.7, x, y - alto * 0.1);
  sombra.addColorStop(0, 'rgba(90, 60, 50, 0.35)');
  sombra.addColorStop(1, 'rgba(90, 60, 50, 0)');
  c.fillStyle = sombra;
  c.fillRect(x - ancho, y - alto, ancho * 2, alto);
  c.restore();
  const { exterior } = esquinasDelOjo(x, y, ancho, alto, lado);
  c.strokeStyle = linea;
  c.lineWidth = ancho * 0.11;
  c.beginPath();
  c.moveTo(x - lado * ancho * 0.5, y + alto * 0.06);
  c.bezierCurveTo(
    x - lado * ancho * 0.3,
    y - alto * 0.78 * abierto,
    x + lado * ancho * 0.32,
    y - alto * 0.8 * abierto,
    ...exterior,
  );
  c.lineTo(exterior[0] + lado * ancho * 0.1, exterior[1] - alto * 0.12);
  c.stroke();
  if (rasgos.pestanas) {
    c.lineWidth = ancho * 0.05;
    for (const k of [0, 1]) {
      c.beginPath();
      c.moveTo(x + lado * ancho * (0.3 + k * 0.14), y - alto * (0.55 - k * 0.2) * abierto);
      c.lineTo(x + lado * ancho * (0.42 + k * 0.2), y - alto * (0.82 - k * 0.22) * abierto);
      c.stroke();
    }
  }
  c.strokeStyle = 'rgba(70, 40, 30, 0.55)';
  c.lineWidth = ancho * 0.035;
  c.beginPath();
  c.moveTo(x + lado * ancho * 0.05, y + alto * 0.42 * abierto);
  c.quadraticCurveTo(x + lado * ancho * 0.32, y + alto * 0.38 * abierto, ...exterior);
  c.stroke();
}

function dibujarNariz(c, [x, y], separacion) {
  c.strokeStyle = 'rgba(120, 70, 55, 0.35)';
  c.lineWidth = separacion * 0.025;
  c.beginPath();
  c.moveTo(x - separacion * 0.07, y - separacion * 0.01);
  c.quadraticCurveTo(x, y + separacion * 0.045, x + separacion * 0.07, y - separacion * 0.01);
  c.stroke();
}

function dibujarBoca(c, [x, y], separacion, gesto, rasgos) {
  const ancho = separacion * (0.34 + gesto.sonrisa * 0.14);
  const curva = separacion * (0.03 + gesto.sonrisa * 0.07);
  const izquierda = [x - ancho / 2, y - curva * 0.35];
  const derecha = [x + ancho / 2, y - curva * 0.35];
  if (gesto.boca < 0.12) {
    c.strokeStyle = '#5c2a2a';
    c.lineWidth = separacion * 0.032;
    c.beginPath();
    c.moveTo(...izquierda);
    c.quadraticCurveTo(x, y + curva, ...derecha);
    c.stroke();
    c.strokeStyle = hacerTransparente(rasgos.labios, 0.45);
    c.lineWidth = separacion * 0.028;
    c.beginPath();
    c.moveTo(x - ancho * 0.22, y + curva * 0.95);
    c.quadraticCurveTo(x, y + curva * 1.45, x + ancho * 0.22, y + curva * 0.95);
    c.stroke();
    return;
  }
  const alto = separacion * (0.05 + gesto.boca * 0.18);
  c.save();
  c.beginPath();
  c.moveTo(...izquierda);
  c.quadraticCurveTo(x, y + curva * 0.2 - alto * 0.12, ...derecha);
  c.quadraticCurveTo(x, y + curva + alto * 1.1, ...izquierda);
  c.closePath();
  c.fillStyle = '#5a1d24';
  c.fill();
  c.clip();
  c.fillStyle = '#fbf6f0';
  c.fillRect(x - ancho, y - alto, ancho * 2, alto * 0.62);
  c.fillStyle = '#d86d78';
  c.beginPath();
  c.ellipse(x, y + curva + alto * 0.85, ancho * 0.3, alto * 0.42, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
  c.strokeStyle = '#4a1c1c';
  c.lineWidth = separacion * 0.022;
  c.beginPath();
  c.moveTo(...izquierda);
  c.quadraticCurveTo(x, y + curva * 0.2 - alto * 0.12, ...derecha);
  c.quadraticCurveTo(x, y + curva + alto * 1.1, ...izquierda);
  c.stroke();
}

function dibujarSombraDeBarba(c, [x, y], separacion, color) {
  const sombra = c.createRadialGradient(
    x,
    y + separacion * 0.12,
    0,
    x,
    y + separacion * 0.12,
    separacion * 0.62,
  );
  sombra.addColorStop(0, hacerTransparente(color, 0.32));
  sombra.addColorStop(0.75, hacerTransparente(color, 0.2));
  sombra.addColorStop(1, hacerTransparente(color, 0));
  c.fillStyle = sombra;
  c.fillRect(x - separacion, y - separacion * 0.3, separacion * 2, separacion * 1.2);
}

const auxiliar = new THREE.Color();
const BLANCO = new THREE.Color('#ffffff');

function oscurecer(color, cantidad) {
  return `#${auxiliar
    .set(color)
    .multiplyScalar(1 - cantidad)
    .getHexString()}`;
}

function aclarar(color, cantidad) {
  return `#${auxiliar.set(color).lerp(BLANCO, cantidad).getHexString()}`;
}

function hacerTransparente(color, alfa) {
  const hex = auxiliar.set(color).getHex();
  return `rgba(${(hex >> 16) & 255}, ${(hex >> 8) & 255}, ${hex & 255}, ${alfa})`;
}

export function animarGesto(cara, estado, { hablando = false, alegria = 0.35, reducir = false }, dt) {
  const gesto = cara.gesto;
  estado.reloj += dt;
  let ojos = 1;
  if (!reducir) {
    estado.parpadeo -= dt;
    if (estado.parpadeo <= 0) {
      estado.parpadeo = 2.4 + Math.random() * 3.6;
      estado.cierre = 0.18;
    }
    estado.cierre = Math.max(0, estado.cierre - dt);
    if (estado.cierre > 0) ojos = Math.abs(estado.cierre / 0.09 - 1);
  }
  gesto.ojos = alegria > 0.6 ? Math.min(ojos, 0.8) : ojos;
  gesto.boca =
    hablando && !reducir
      ? 0.2 + 0.8 * Math.abs(Math.sin(estado.reloj * 10 + Math.sin(estado.reloj * 2.7) * 1.4))
      : 0;
  gesto.sonrisa = THREE.MathUtils.clamp(alegria, 0, 1);
  gesto.cejas = hablando && !reducir ? 0.3 + 0.25 * Math.sin(estado.reloj * 2.1) : (alegria - 0.35) * 1.2;
  gesto.mirada = reducir ? 0 : Math.sin(estado.reloj * 0.37) * 0.6;
  return dibujarCara(cara);
}
