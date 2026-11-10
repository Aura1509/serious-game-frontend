import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const ALTURA_BASE = 1.65;
const CENTRO_CABEZA = 0.085;
const TAMANO_CABEZA = 1.1;
const UV_CUERPO = [0.75, 0.5];

const HUESOS = [
  ['raiz', null, [0, 0, 0]],
  ['cadera', 'raiz', [0, 0.93, 0]],
  ['columna', 'cadera', [0, 0.08, 0]],
  ['pecho', 'columna', [0, 0.21, 0]],
  ['cuello', 'pecho', [0, 0.17, 0]],
  ['cabeza', 'cuello', [0, 0.06, 0]],
  ['hombroI', 'pecho', [1, 0.11, 0]],
  ['codoI', 'hombroI', [0, -0.28, 0]],
  ['manoI', 'codoI', [0, -0.25, 0]],
  ['hombroD', 'pecho', [-1, 0.11, 0]],
  ['codoD', 'hombroD', [0, -0.28, 0]],
  ['manoD', 'codoD', [0, -0.25, 0]],
  ['musloI', 'cadera', [0.088, -0.04, 0]],
  ['rodillaI', 'musloI', [0, -0.43, 0]],
  ['pieI', 'rodillaI', [0, -0.4, 0]],
  ['musloD', 'cadera', [-0.088, -0.04, 0]],
  ['rodillaD', 'musloD', [0, -0.43, 0]],
  ['pieD', 'rodillaD', [0, -0.4, 0]],
];
const INDICE = Object.fromEntries(HUESOS.map(([nombre], i) => [nombre, i]));

const SILUETAS = {
  a: { hombro: 0.158, pecho: 0.134, cintura: 0.106, cadera: 0.15 },
  b: { hombro: 0.18, pecho: 0.15, cintura: 0.126, cadera: 0.138 },
};

export const PERFIL_JUGADOR = {
  altura: 1.63,
  silueta: 'a',
  delgadez: 0.94,
  piel: '#e3b291',
  pelo: { estilo: 'largo', color: '#3a2418' },
  ojos: '#4a2a18',
  labios: '#c4626a',
  top: { color: '#c62a2f', mangas: 'largas' },
  pantalon: { color: '#3d5b8a', largo: 'largo' },
  zapatos: '#f3f3f1',
};

const temporal = new THREE.Vector3();
const color = (hex) => new THREE.Color(hex);

function lisa(a, b, t) {
  const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
}

function pieza(geometria, { tinte, hueso, conUV = false }) {
  const resultado = geometria.index ? geometria.toNonIndexed() : geometria;
  const posicion = resultado.attributes.position;
  const cantidad = posicion.count;
  const colores = new Float32Array(cantidad * 3);
  const indices = new Uint16Array(cantidad * 4);
  const pesos = new Float32Array(cantidad * 4);
  for (let i = 0; i < cantidad; i++) {
    temporal.fromBufferAttribute(posicion, i);
    const c = typeof tinte === 'function' ? tinte(temporal) : tinte;
    colores.set([c.r, c.g, c.b], i * 3);
    const asignacion = typeof hueso === 'function' ? hueso(temporal) : [[hueso, 1]];
    asignacion.forEach(([indice, peso], k) => {
      indices[i * 4 + k] = indice;
      pesos[i * 4 + k] = peso;
    });
  }
  resultado.setAttribute('color', new THREE.BufferAttribute(colores, 3));
  resultado.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
  resultado.setAttribute('skinWeight', new THREE.BufferAttribute(pesos, 4));
  if (!conUV || !resultado.attributes.uv) {
    const uvs = new Float32Array(cantidad * 2);
    for (let i = 0; i < cantidad; i++) uvs.set(UV_CUERPO, i * 2);
    resultado.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  }
  if (!resultado.attributes.normal) resultado.computeVertexNormals();
  return resultado;
}

function segmento(largo, radioArriba, radioAbajo, lados = 12) {
  const perfil = [];
  const pasos = 4;
  for (let i = 0; i <= pasos; i++) {
    const a = -Math.PI / 2 + (i / pasos) * (Math.PI / 2);
    perfil.push(
      new THREE.Vector2(Math.max(1e-4, Math.cos(a) * radioAbajo), -largo + Math.sin(a) * radioAbajo),
    );
  }
  for (let i = 0; i <= pasos; i++) {
    const a = (i / pasos) * (Math.PI / 2);
    perfil.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * radioArriba), Math.sin(a) * radioArriba));
  }
  return new THREE.LatheGeometry(perfil, lados);
}

function torno(puntos, lados, aplanar) {
  const curva = new THREE.SplineCurve(puntos.map(([r, y]) => new THREE.Vector2(r, y)));
  const geometria = new THREE.LatheGeometry(
    curva
      .getSpacedPoints(puntos.length * 4)
      .map((punto) => new THREE.Vector2(Math.max(1e-4, punto.x), punto.y)),
    lados,
  );
  geometria.scale(1, 1, aplanar);
  return geometria;
}

function deformarCabeza(p) {
  if (p.y < 0) {
    const t = Math.min(1, -p.y / 0.11);
    p.x *= 1 - 0.24 * t * t;
    p.z = p.z * (1 - 0.06 * t * t) + 0.01 * t * t;
  }
  p.x *= 0.9;
  p.y *= 1.1;
  return p;
}

function deformar(geometria, funcion) {
  const posicion = geometria.attributes.position;
  for (let i = 0; i < posicion.count; i++) {
    funcion(temporal.fromBufferAttribute(posicion, i));
    posicion.setXYZ(i, temporal.x, temporal.y, temporal.z);
  }
  geometria.computeVertexNormals();
  return geometria;
}

function superficie(columnas, filas, punto) {
  const posiciones = [];
  const indices = [];
  for (let j = 0; j <= filas; j++) {
    for (let i = 0; i <= columnas; i++) {
      const p = punto(i / columnas, j / filas);
      posiciones.push(p.x, p.y, p.z);
    }
  }
  for (let j = 0; j < filas; j++) {
    for (let i = 0; i < columnas; i++) {
      const a = j * (columnas + 1) + i;
      const b = a + columnas + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geometria.setIndex(indices);
  geometria.computeVertexNormals();
  return geometria;
}

function direccionEsferica(phi, theta, radio, salida = new THREE.Vector3()) {
  return salida.set(
    -Math.cos(phi) * Math.sin(theta) * radio,
    Math.cos(theta) * radio,
    Math.sin(phi) * Math.sin(theta) * radio,
  );
}

function gorro(radio, limite, abombar = 1) {
  return deformar(
    superficie(32, 12, (u, t) => {
      const phi = u * Math.PI * 2;
      const theta = t * limite(phi);
      return direccionEsferica(phi, theta, radio * (1 + 0.03 * abombar * Math.sin(t * Math.PI)));
    }),
    deformarCabeza,
  );
}

function cortina(radioArriba, radioAbajo, largo, abertura, alturaLados) {
  return superficie(28, 12, (u, s) => {
    const a = (u - 0.5) * 2 * abertura;
    const lado = lisa(0.9, abertura, Math.abs(a));
    const fin = THREE.MathUtils.lerp(largo, alturaLados, lado) + 0.018 * Math.sin(a * 9);
    const y = 0.02 - s * fin;
    const radio = THREE.MathUtils.lerp(radioArriba, radioAbajo, lisa(0.12, 0.65, s));
    return new THREE.Vector3(Math.sin(a) * radio, y, -Math.cos(a) * radio - 0.012);
  });
}

function mechon(puntos, radio, adelgazar = 0.55, aplanar = 1) {
  const curva = new THREE.CatmullRomCurve3(puntos.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const geometria = new THREE.TubeGeometry(curva, 14, radio, 6, false);
  const posicion = geometria.attributes.position;
  const anillos = 15;
  const porAnillo = posicion.count / anillos;
  for (let i = 0; i < posicion.count; i++) {
    const t = Math.floor(i / porAnillo) / (anillos - 1);
    const centro = curva.getPoint(t);
    temporal
      .fromBufferAttribute(posicion, i)
      .sub(centro)
      .multiplyScalar(1 - adelgazar * t * t);
    temporal.x *= aplanar;
    temporal.z /= aplanar;
    temporal.add(centro);
    posicion.setXYZ(i, temporal.x, temporal.y, temporal.z);
  }
  geometria.computeVertexNormals();
  return geometria;
}

function rizos(radio, aplanar, semilla) {
  const geometria = new THREE.IcosahedronGeometry(radio, 3);
  return deformar(geometria, (p) => {
    const ruido =
      Math.sin(p.x * 140 + semilla) * Math.sin(p.y * 150 + semilla * 2) * Math.sin(p.z * 145 + semilla * 3);
    p.multiplyScalar(1 + 0.05 * ruido);
    p.y *= aplanar;
  });
}

function construirPelo(perfil, base) {
  const estilo = perfil.pelo.estilo;
  const tono = color(perfil.pelo.color);
  const claro = tono.clone().multiplyScalar(1.45);
  const tinte = (p) => tono.clone().lerp(claro, lisa(0.05, -0.45, p.y) * 0.6);
  const piezas = [];
  const cabeza = INDICE.cabeza;
  const pecho = INDICE.pecho;
  const caida = (p) => {
    const t = lisa(-0.08, -0.2, p.y);
    return t <= 0
      ? [[cabeza, 1]]
      : [
          [cabeza, 1 - t],
          [pecho, t],
        ];
  };
  const frente = (phi) => Math.max(0, Math.sin(phi)) ** 1.6;
  const raya = (phi) => 0.28 * Math.exp(-((phi - 1.25) ** 2) / 0.06);
  const agregar = (geometria, hueso = cabeza) =>
    piezas.push(pieza(geometria, { tinte, hueso }).translate(0, base, 0));

  if (estilo === 'rapado') {
    agregar(gorro(0.1025, (phi) => 1.75 - 0.85 * frente(phi), 0));
  } else if (estilo === 'afro') {
    agregar(rizos(0.135, 0.92, 3).translate(0, 0.03, -0.015));
  } else if (estilo === 'rizado') {
    agregar(rizos(0.112, 1, 7).translate(0, 0.016, -0.008));
  } else {
    const limite =
      estilo === 'corto'
        ? (phi) => 1.72 - 0.88 * frente(phi) + raya(phi) * 0.6
        : (phi) => 1.95 - 1.05 * frente(phi) + raya(phi);
    agregar(gorro(0.1065, limite));
  }
  if (estilo === 'largo' || estilo === 'melena') {
    const largo = estilo === 'largo' ? 0.52 : 0.2;
    agregar(cortina(0.108, estilo === 'largo' ? 0.15 : 0.122, largo, 1.95, 0.16), caida);
  }
  if (estilo === 'largo') {
    for (const lado of [1, -1]) {
      agregar(
        mechon(
          [
            [0.08 * lado, 0.03, 0.04],
            [0.1 * lado, -0.1, 0.055],
            [0.125 * lado, -0.24, 0.085],
            [0.12 * lado, -0.38, 0.085],
          ],
          0.024,
          0.45,
          1.7,
        ),
        caida,
      );
      agregar(
        mechon(
          [
            [0.07 * lado, 0.05, 0.0],
            [0.095 * lado, -0.1, 0.02],
            [0.14 * lado, -0.22, 0.05],
            [0.15 * lado, -0.33, 0.05],
          ],
          0.02,
          0.45,
          1.6,
        ),
        caida,
      );
    }
  }
  if (estilo === 'coleta') {
    agregar(
      mechon(
        [
          [0, 0.04, -0.1],
          [0, -0.02, -0.14],
          [0, -0.16, -0.15],
          [0, -0.3, -0.13],
        ],
        0.034,
        0.7,
      ),
      caida,
    );
  }
  if (estilo === 'mono') agregar(new THREE.SphereGeometry(0.048, 16, 12).translate(0, 0.075, -0.09));
  return piezas;
}

const SIN_LIENZO = typeof document === 'undefined' || /jsdom/.test(globalThis.navigator?.userAgent ?? '');

function dibujarCara(perfil, resolucion) {
  if (SIN_LIENZO) return null;
  const lienzo = document.createElement('canvas');
  lienzo.width = resolucion * 2;
  lienzo.height = resolucion;
  const c = lienzo.getContext?.('2d');
  if (!c) return null;
  const S = resolucion;
  const piel = color(perfil.piel);
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, S * 2, S);
  c.fillStyle = `#${piel.getHexString()}`;
  c.fillRect(0, 0, S, S);
  const punto = (u, theta) => [u * S, ((theta - 0.95) / 1.35) * S];
  const mejilla = c.createRadialGradient(0, 0, 0, 0, 0, S * 0.09);
  mejilla.addColorStop(0, 'rgba(232, 120, 120, 0.32)');
  mejilla.addColorStop(1, 'rgba(232, 120, 120, 0)');
  for (const u of [0.28, 0.72]) {
    const [x, y] = punto(u, 1.8);
    c.save();
    c.translate(x, y);
    c.fillStyle = mejilla;
    c.fillRect(-S * 0.1, -S * 0.1, S * 0.2, S * 0.2);
    c.restore();
  }
  const pelo = perfil.pelo.estilo === 'rapado' ? '#3a2a20' : perfil.pelo.color;
  c.lineCap = 'round';
  for (const u of [0.345, 0.655]) {
    const [x, y] = punto(u, 1.58);
    const ancho = S * 0.15;
    const alto = S * 0.095;
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(x, y, ancho / 2, alto / 2, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = perfil.ojos;
    c.beginPath();
    c.ellipse(x, y + alto * 0.04, S * 0.043, S * 0.05, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#16100c';
    c.beginPath();
    c.ellipse(x, y + alto * 0.04, S * 0.021, S * 0.025, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.95)';
    c.beginPath();
    c.arc(x + S * 0.015, y - alto * 0.14, S * 0.012, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#24170f';
    c.lineWidth = S * 0.018;
    c.beginPath();
    c.ellipse(x, y + alto * 0.08, ancho / 2, alto / 2 + S * 0.004, 0, Math.PI * 1.06, Math.PI * 1.94);
    c.stroke();
    const exterior = u < 0.5 ? -1 : 1;
    c.lineWidth = S * 0.011;
    c.beginPath();
    c.moveTo(x + (exterior * ancho) / 2.2, y - alto * 0.18);
    c.lineTo(x + (exterior * ancho) / 1.75, y - alto * 0.42);
    c.stroke();
    const [cx, cy] = punto(u, 1.42);
    c.strokeStyle = pelo;
    c.lineWidth = S * 0.026;
    c.beginPath();
    c.moveTo(cx - (exterior * ancho) / 2.1, cy + S * 0.012);
    c.quadraticCurveTo(
      cx + exterior * ancho * 0.05,
      cy - S * 0.022,
      cx + (exterior * ancho) / 1.9,
      cy + S * 0.008,
    );
    c.stroke();
  }
  const [nx, ny] = punto(0.5, 1.76);
  c.strokeStyle = 'rgba(150, 90, 70, 0.35)';
  c.lineWidth = S * 0.007;
  c.beginPath();
  c.moveTo(nx - S * 0.018, ny);
  c.quadraticCurveTo(nx, ny + S * 0.012, nx + S * 0.018, ny);
  c.stroke();
  const [mx, my] = punto(0.5, 1.96);
  c.fillStyle = perfil.labios ?? '#b8676a';
  c.beginPath();
  c.moveTo(mx - S * 0.095, my - S * 0.01);
  c.quadraticCurveTo(mx, my + S * 0.068, mx + S * 0.095, my - S * 0.01);
  c.quadraticCurveTo(mx, my + S * 0.012, mx - S * 0.095, my - S * 0.01);
  c.fill();
  c.fillStyle = '#fbf6f0';
  c.beginPath();
  c.moveTo(mx - S * 0.07, my);
  c.quadraticCurveTo(mx, my + S * 0.034, mx + S * 0.07, my);
  c.quadraticCurveTo(mx, my + S * 0.014, mx - S * 0.07, my);
  c.fill();
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;
  return textura;
}

function vestir(perfil) {
  const piel = color(perfil.piel);
  const top = color(perfil.top.color);
  const pantalon = color(perfil.pantalon.color);
  const zapato = color(perfil.zapatos);
  const suela = color('#3b3b3f');
  const forma = SILUETAS[perfil.silueta] ?? SILUETAS.a;
  const d = perfil.delgadez ?? 1;
  const piezas = [];
  const cuello = (p) =>
    p.y > 1.385 || (p.z > 0.01 && p.y > 1.318 && Math.abs(p.x) < 0.055 + (p.y - 1.318) * 0.9);
  piezas.push(
    pieza(
      torno(
        [
          [0, 0.79],
          [0.07 * d, 0.8],
          [0.125 * d, 0.83],
          [forma.cadera * d, 0.9],
          [forma.cadera * 0.93 * d, 0.97],
          [forma.cintura * 1.08 * d, 1.02],
        ],
        18,
        0.74,
      ),
      {
        tinte: (p) => (p.y > 0.985 ? pantalon.clone().multiplyScalar(0.75) : pantalon),
        hueso: INDICE.cadera,
      },
    ),
  );
  piezas.push(
    pieza(
      torno(
        [
          [forma.cintura * 1.05 * d, 0.97],
          [forma.cintura * d, 1.06],
          [forma.pecho * 0.95 * d, 1.16],
          [forma.pecho * d, 1.23],
          [forma.pecho * 0.98 * d, 1.3],
          [forma.hombro * 0.72, 1.355],
          [0.07, 1.39],
          [0.048, 1.41],
        ],
        28,
        0.7,
      ),
      {
        tinte: (p) => (cuello(p) ? piel : top),
        hueso: (p) => {
          const t = lisa(1.08, 1.2, p.y);
          return t <= 0
            ? [[INDICE.columna, 1]]
            : t >= 1
              ? [[INDICE.pecho, 1]]
              : [
                  [INDICE.columna, 1 - t],
                  [INDICE.pecho, t],
                ];
        },
      },
    ),
  );
  piezas.push(
    pieza(segmento(0.11, 0.046, 0.05).translate(0, 1.475, 0), { tinte: piel, hueso: INDICE.cuello }),
  );
  const largas = perfil.top.mangas === 'largas';
  const cortos = perfil.pantalon.largo === 'corto';
  for (const lado of [1, -1]) {
    const sufijo = lado > 0 ? 'I' : 'D';
    const hombro = new THREE.Vector3(forma.hombro * lado, 1.33, 0);
    piezas.push(
      pieza(segmento(0.28, 0.05 * d, 0.039 * d).translate(hombro.x, hombro.y, 0), {
        tinte: (p) => (largas || p.y > hombro.y - 0.12 ? top : piel),
        hueso: INDICE[`hombro${sufijo}`],
      }),
    );
    piezas.push(
      pieza(segmento(0.25, 0.037 * d, 0.03 * d).translate(hombro.x, hombro.y - 0.28, 0), {
        tinte: (p) => (largas && p.y > hombro.y - 0.515 ? top : piel),
        hueso: INDICE[`codo${sufijo}`],
      }),
    );
    const mano = new THREE.SphereGeometry(0.046, 10, 8)
      .scale(0.5, 1, 0.8)
      .translate(hombro.x, hombro.y - 0.575, 0.005);
    const pulgar = segmento(0.03, 0.012, 0.011, 8)
      .rotateZ(0.5 * lado)
      .translate(hombro.x - 0.012 * lado, hombro.y - 0.545, 0.022);
    piezas.push(pieza(mano, { tinte: piel, hueso: INDICE[`mano${sufijo}`] }));
    piezas.push(pieza(pulgar, { tinte: piel, hueso: INDICE[`mano${sufijo}`] }));
    const cadera = new THREE.Vector3(0.088 * lado, 0.89, 0);
    piezas.push(
      pieza(segmento(0.43, 0.078 * d, 0.054 * d).translate(cadera.x, cadera.y, 0), {
        tinte: (p) => (!cortos || p.y > 0.66 ? pantalon : piel),
        hueso: INDICE[`muslo${sufijo}`],
      }),
    );
    piezas.push(
      pieza(segmento(0.4, 0.052 * d, 0.038 * d).translate(cadera.x, 0.46, 0), {
        tinte: cortos ? piel : pantalon,
        hueso: INDICE[`rodilla${sufijo}`],
      }),
    );
    const pie = new THREE.SphereGeometry(0.06, 12, 8)
      .scale(0.85, 0.62, 1.95)
      .translate(cadera.x, 0.035, 0.045);
    piezas.push(pieza(pie, { tinte: (p) => (p.y < 0.012 ? suela : zapato), hueso: INDICE[`pie${sufijo}`] }));
  }
  if (perfil.mochila) {
    piezas.push(
      pieza(new RoundedBoxGeometry(0.26, 0.34, 0.12, 3, 0.04).translate(0, 1.2, -0.15), {
        tinte: color(perfil.mochila),
        hueso: INDICE.pecho,
      }),
    );
  }
  const inicioCabeza = piezas.length;
  const cabeza = new THREE.Vector3(0, 1.45 + CENTRO_CABEZA, 0);
  piezas.push(
    pieza(
      deformar(new THREE.SphereGeometry(0.1, 24, 16), deformarCabeza).translate(cabeza.x, cabeza.y, cabeza.z),
      {
        tinte: piel,
        hueso: INDICE.cabeza,
      },
    ),
  );
  const cara = new THREE.SphereGeometry(0.1012, 26, 18, Math.PI / 2 - 0.95, 1.9, 0.95, 1.35);
  const uv = cara.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.5, uv.getY(i));
  deformar(cara, deformarCabeza).translate(cabeza.x, cabeza.y, cabeza.z);
  piezas.push(pieza(cara, { tinte: color('#ffffff'), hueso: INDICE.cabeza, conUV: true }));
  piezas.push(
    pieza(
      new THREE.SphereGeometry(0.014, 12, 10).scale(0.8, 1.2, 0.95).translate(0, cabeza.y - 0.018, 0.096),
      {
        tinte: piel,
        hueso: INDICE.cabeza,
      },
    ),
  );
  for (const lado of [1, -1]) {
    piezas.push(
      pieza(
        new THREE.SphereGeometry(0.022, 10, 8)
          .scale(0.45, 1.1, 0.8)
          .translate(0.09 * lado, cabeza.y - 0.006, -0.004),
        {
          tinte: piel,
          hueso: INDICE.cabeza,
        },
      ),
    );
  }
  if (perfil.gafas) {
    const marco = color(perfil.gafas === 'oscuras' ? '#151515' : '#2c2c34');
    for (const lado of [1, -1]) {
      const aro =
        perfil.gafas === 'oscuras'
          ? new THREE.CylinderGeometry(0.021, 0.021, 0.004, 20).rotateX(Math.PI / 2)
          : new THREE.TorusGeometry(0.02, 0.0028, 6, 24);
      piezas.push(
        pieza(aro.translate(0.027 * lado, cabeza.y - 0.001, 0.107), { tinte: marco, hueso: INDICE.cabeza }),
      );
      piezas.push(
        pieza(
          new THREE.CylinderGeometry(0.0022, 0.0022, 0.1, 6)
            .rotateX(Math.PI / 2)
            .translate(0.088 * lado, cabeza.y, 0.06),
          {
            tinte: marco,
            hueso: INDICE.cabeza,
          },
        ),
      );
    }
    piezas.push(
      pieza(
        new THREE.CylinderGeometry(0.0025, 0.0025, 0.016, 6)
          .rotateZ(Math.PI / 2)
          .translate(0, cabeza.y + 0.002, 0.11),
        {
          tinte: marco,
          hueso: INDICE.cabeza,
        },
      ),
    );
  }
  piezas.push(...construirPelo(perfil, cabeza.y));
  for (const geometria of piezas.slice(inicioCabeza)) {
    geometria.translate(0, -1.45, 0).scale(TAMANO_CABEZA, TAMANO_CABEZA, TAMANO_CABEZA).translate(0, 1.45, 0);
  }
  return { piezas, forma };
}

export function crearHumano(perfil, { resolucionCara = 256 } = {}) {
  const escala = perfil.altura / ALTURA_BASE;
  const { piezas, forma } = vestir(perfil);
  const geometria = mergeGeometries(piezas, false);
  geometria.scale(escala, escala, escala);
  const huesos = {};
  const lista = HUESOS.map(([nombre, padre, [x, y, z]]) => {
    const hueso = new THREE.Bone();
    hueso.name = nombre;
    const ancho = nombre.startsWith('hombro') ? forma.hombro * x : x;
    hueso.position.set(ancho * escala, y * escala, z * escala);
    if (padre) huesos[padre].add(hueso);
    huesos[nombre] = hueso;
    return hueso;
  });
  const material = new THREE.MeshStandardMaterial({
    name: 'Humano',
    vertexColors: true,
    map: dibujarCara(perfil, resolucionCara),
    roughness: 0.62,
    side: THREE.DoubleSide,
  });
  const malla = new THREE.SkinnedMesh(geometria, material);
  malla.name = 'Humano';
  malla.add(huesos.raiz);
  malla.bind(new THREE.Skeleton(lista));
  malla.castShadow = true;
  malla.receiveShadow = true;
  const grupo = new THREE.Group();
  grupo.add(malla);
  const reposo = Object.fromEntries(lista.map((hueso) => [hueso.name, hueso.position.clone()]));
  return { grupo, malla, material, huesos, reposo, escala, largoPierna: 0.83 * escala };
}

const { lerp } = THREE.MathUtils;

export const POSE_QUIETA = {
  fase: 0,
  andar: 0,
  trote: 0,
  aire: 0,
  tiempo: 0,
  inclinacion: 0,
  ladeo: 0,
  desfase: 0,
  sentado: 0,
  asiento: 0.46,
  hablar: 0,
  saludo: 0,
  mirar: 0,
  empujar: 0,
};

export function posarHumano(humano, entrada) {
  const p = { ...POSE_QUIETA, ...entrada };
  const h = humano.huesos;
  const reposo = humano.reposo;
  const s = Math.sin(p.fase);
  const c = Math.cos(p.fase);
  const quieto = 1 - p.sentado;
  const andar = p.andar * quieto;
  const trote = p.trote * quieto;
  const vuelo = p.aire * quieto;
  const A = andar * lerp(0.42, 0.78, trote) * (1 - vuelo);
  const K = andar * lerp(0.95, 1.7, trote) * (1 - vuelo);
  const B = andar * lerp(0.32, 0.75, trote) * (1 - vuelo);
  const respirar = Math.sin(p.tiempo * 1.7);
  const calma = 1 - Math.min(1, p.andar);

  const agachar = Math.max(0, -p.desfase) * 6;
  const musloI = -A * s - 0.35 * vuelo - agachar * 0.5;
  const musloD = A * s + 0.2 * vuelo - agachar * 0.5;
  const rodillaI = K * Math.max(0, c) ** 1.4 + 0.1 * andar * Math.max(0, s) + 0.04 + 0.6 * vuelo + agachar;
  const rodillaD = K * Math.max(0, -c) ** 1.4 + 0.1 * andar * Math.max(0, -s) + 0.04 + 0.3 * vuelo + agachar;
  h.musloI.rotation.set(lerp(musloI, -1.5, p.sentado), 0, 0.015);
  h.musloD.rotation.set(lerp(musloD, -1.5, p.sentado), 0, -0.015);
  h.rodillaI.rotation.x = lerp(rodillaI, 1.45, p.sentado);
  h.rodillaD.rotation.x = lerp(rodillaD, 1.45, p.sentado);
  h.pieI.rotation.x = lerp(-(musloI + rodillaI) * 0.9 + 0.3 * andar * Math.max(0, -s), 0.05, p.sentado);
  h.pieD.rotation.x = lerp(-(musloD + rodillaD) * 0.9 + 0.3 * andar * Math.max(0, s), 0.05, p.sentado);

  const abrir = 0.07 + 0.08 * trote + 0.5 * vuelo + 0.015 * respirar * calma;
  h.hombroI.rotation.set(lerp(B * s - 0.05, -0.45, p.sentado), 0, abrir);
  h.hombroD.rotation.set(lerp(-B * s - 0.05, -0.45, p.sentado), 0, -abrir);
  h.codoI.rotation.set(lerp(-(0.14 + 1.15 * trote + 0.35 * andar * Math.max(0, -s)), -0.95, p.sentado), 0, 0);
  h.codoD.rotation.set(lerp(-(0.14 + 1.15 * trote + 0.35 * andar * Math.max(0, s)), -0.95, p.sentado), 0, 0);
  h.manoI.rotation.set(0, 0, 0);
  h.manoD.rotation.set(0, 0, 0);

  if (p.empujar > 0) {
    for (const lado of ['I', 'D']) {
      const hombro = h[`hombro${lado}`];
      const codo = h[`codo${lado}`];
      hombro.rotation.x = lerp(hombro.rotation.x, -0.25 + 0.4 * Math.sin(p.fase), p.empujar);
      codo.rotation.x = lerp(codo.rotation.x, -0.7 + 0.25 * Math.cos(p.fase), p.empujar);
    }
  }
  if (p.hablar > 0) {
    const gesto = Math.sin(p.tiempo * 2.3);
    h.hombroD.rotation.x = lerp(h.hombroD.rotation.x, -0.45 + 0.12 * gesto, p.hablar);
    h.hombroD.rotation.z = lerp(h.hombroD.rotation.z, -0.2, p.hablar);
    h.codoD.rotation.x = lerp(h.codoD.rotation.x, -1.2 + 0.25 * Math.sin(p.tiempo * 3.1), p.hablar);
  }
  if (p.saludo > 0) {
    h.hombroD.rotation.x = lerp(h.hombroD.rotation.x, -0.25, p.saludo);
    h.hombroD.rotation.z = lerp(h.hombroD.rotation.z, -2.55, p.saludo);
    h.codoD.rotation.x = lerp(h.codoD.rotation.x, -0.25, p.saludo);
    h.codoD.rotation.z = lerp(0, 0.4 * Math.sin(p.tiempo * 9), p.saludo);
  }

  const baja = humano.largoPierna * (1 - Math.cos(A * s)) * (1 - 0.5 * trote);
  const rebote = 0.04 * trote * Math.abs(s);
  const sentada = p.asiento + 0.11 * humano.escala - reposo.cadera.y;
  h.cadera.position.set(
    reposo.cadera.x - 0.022 * andar * c * (1 - trote) + 0.012 * Math.sin(p.tiempo * 0.5) * calma,
    reposo.cadera.y + lerp(-baja + rebote + p.desfase, sentada, p.sentado),
    reposo.cadera.z + lerp(0, -0.08, p.sentado),
  );
  h.cadera.rotation.set(0, -0.25 * A * s, p.ladeo);
  h.columna.rotation.set(lerp(p.inclinacion, -0.06, p.sentado), 0, 0);
  h.pecho.rotation.set(0.015 * respirar * calma, 0.35 * A * s, 0);
  const giro = 0.1 * A * s;
  h.cuello.rotation.set(0, p.mirar * 0.4, 0);
  h.cabeza.rotation.set(
    -0.5 * p.inclinacion + 0.05 * Math.sin(p.tiempo * 2.6) * p.hablar,
    p.mirar * 0.6 - giro,
    0,
  );
}
