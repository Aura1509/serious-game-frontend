import * as THREE from 'three';

const SIN_LIENZO = typeof document === 'undefined' || /jsdom/.test(globalThis.navigator?.userAgent ?? '');
const ARRIBA = new THREE.Vector3(0, 1, 0);
const esquina = new THREE.Vector3();
const giro = new THREE.Quaternion();
const euler = new THREE.Euler();
const centroTarjeta = new THREE.Vector3();
const normalTarjeta = new THREE.Vector3();

function azarDe(semilla) {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lienzo(ancho, alto, dibujar) {
  if (SIN_LIENZO) return null;
  const elemento = document.createElement('canvas');
  elemento.width = ancho;
  elemento.height = alto;
  const contexto = elemento.getContext?.('2d');
  if (!contexto) return null;
  dibujar(contexto, ancho, alto);
  const textura = new THREE.CanvasTexture(elemento);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 4;
  return textura;
}

function tono(hex, luz, azar) {
  const color = new THREE.Color(hex);
  const hsl = {};
  color.getHSL(hsl);
  const l = THREE.MathUtils.clamp(hsl.l * (luz + (azar() - 0.5) * 0.18), 0.04, 0.92);
  const h = (hsl.h + (azar() - 0.5) * 0.025 + 1) % 1;
  return `hsl(${(h * 360).toFixed(1)} ${(hsl.s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%)`;
}

function hoja(c, x, y, largo, angulo, color) {
  c.save();
  c.translate(x, y);
  c.rotate(angulo);
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(-largo, 0);
  c.quadraticCurveTo(0, -largo * 0.42, largo, 0);
  c.quadraticCurveTo(0, largo * 0.42, -largo, 0);
  c.fill();
  c.strokeStyle = 'rgba(20, 30, 10, 0.22)';
  c.lineWidth = Math.max(1, largo * 0.06);
  c.beginPath();
  c.moveTo(-largo * 0.85, 0);
  c.lineTo(largo * 0.85, 0);
  c.stroke();
  c.restore();
}

function flor(c, x, y, radio, color, centro) {
  c.fillStyle = color;
  for (let p = 0; p < 5; p++) {
    const a = (p / 5) * Math.PI * 2;
    c.beginPath();
    c.ellipse(
      x + Math.cos(a) * radio * 0.55,
      y + Math.sin(a) * radio * 0.55,
      radio * 0.55,
      radio * 0.32,
      a,
      0,
      Math.PI * 2,
    );
    c.fill();
  }
  c.fillStyle = centro;
  c.beginPath();
  c.arc(x, y, radio * 0.22, 0, Math.PI * 2);
  c.fill();
}

export function texturaDeRacimo({
  semilla = 1,
  hojas,
  flores = [],
  cantidad = 700,
  tamano = 22,
  proporcionFlor = 0,
}) {
  return lienzo(512, 512, (c, S) => {
    const azar = azarDe(semilla);
    const capas = [
      [0.5, 0.4, 1.18],
      [0.72, 0.42, 1],
      [0.92, 0.4, 1],
      [1.12, 0.33, 0.92],
    ];
    for (const [luz, alcance, crecer] of capas) {
      for (let i = 0; i < cantidad / capas.length; i++) {
        const a = azar() * Math.PI * 2;
        const r = Math.pow(azar(), 0.7) * S * alcance;
        const desvio = (luz - 0.8) * S * 0.08;
        const x = S / 2 + Math.cos(a) * r - desvio;
        const y = S / 2 + Math.sin(a) * r - desvio * 1.2;
        const largo = tamano * crecer * (0.7 + azar() * 0.6);
        if (flores.length && luz > 0.7 && azar() < proporcionFlor) {
          flor(c, x, y, largo * 0.85, tono(flores[Math.floor(azar() * flores.length)], luz, azar), '#f6d65a');
        } else {
          hoja(
            c,
            x,
            y,
            largo,
            azar() * Math.PI * 2,
            tono(hojas[Math.floor(azar() * hojas.length)], luz, azar),
          );
        }
      }
    }
  });
}

export function texturaDeFronda(semilla = 3) {
  return lienzo(256, 1024, (c, ancho, alto) => {
    const azar = azarDe(semilla);
    c.strokeStyle = '#5d6b2c';
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(ancho / 2, 0);
    c.lineTo(ancho / 2, alto);
    c.stroke();
    for (let y = 18; y < alto - 10; y += 15) {
      const t = y / alto;
      const largo = ancho * 0.46 * Math.sin(Math.PI * Math.pow(t, 0.75)) + 10;
      for (const lado of [-1, 1]) {
        c.save();
        c.translate(ancho / 2, y);
        c.scale(lado, 1);
        c.rotate(-(0.45 + azar() * 0.15));
        const verde = tono(t > 0.82 ? '#9aac43' : '#4f8b2f', 0.9 + azar() * 0.25, azar);
        c.fillStyle = verde;
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(largo * 0.5, -6, largo, 2);
        c.quadraticCurveTo(largo * 0.5, 6, 0, 0);
        c.fill();
        c.restore();
      }
    }
  });
}

export function tarjetasDeCopa(
  azar,
  { centros, centroCopa, tamano, densidad, alturaMinima, alturaMaxima, aplanar = 0.8 },
) {
  const posiciones = [];
  const normales = [];
  const uvs = [];
  const colores = [];
  const UV = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];
  for (const { centro, radio } of centros) {
    const cantidad = Math.round(radio * radio * densidad);
    for (let i = 0; i < cantidad; i++) {
      const theta = azar() * Math.PI * 2;
      const phi = Math.acos(2 * azar() - 1);
      const r = radio * (0.45 + 0.55 * Math.cbrt(azar()));
      centroTarjeta.set(
        Math.sin(phi) * Math.cos(theta) * r,
        Math.cos(phi) * r * aplanar,
        Math.sin(phi) * Math.sin(theta) * r,
      );
      centroTarjeta.add(centro);
      normalTarjeta.subVectors(centroTarjeta, centroCopa).normalize().lerp(ARRIBA, 0.3).normalize();
      giro.setFromEuler(euler.set(azar() * Math.PI, azar() * Math.PI * 2, azar() * Math.PI));
      const lado = tamano * (0.75 + azar() * 0.55);
      const alto = THREE.MathUtils.clamp(
        (centroTarjeta.y - alturaMinima) / (alturaMaxima - alturaMinima),
        0,
        1,
      );
      const sombra = (0.66 + 0.4 * alto) * (0.85 + 0.15 * (r / radio));
      const vertices = UV.map(([u, v]) =>
        esquina
          .set((u - 0.5) * lado, (v - 0.5) * lado, 0)
          .applyQuaternion(giro)
          .add(centroTarjeta)
          .clone(),
      );
      for (const k of [0, 1, 2, 0, 2, 3]) {
        posiciones.push(vertices[k].x, vertices[k].y, vertices[k].z);
        normales.push(normalTarjeta.x, normalTarjeta.y, normalTarjeta.z);
        uvs.push(UV[k][0], UV[k][1]);
        colores.push(sombra, sombra, sombra);
      }
    }
  }
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geometria.setAttribute('normal', new THREE.Float32BufferAttribute(normales, 3));
  geometria.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometria.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
  geometria.computeBoundingSphere();
  return geometria;
}

const VIENTO = /* glsl */ `
  #ifdef USE_INSTANCING
    float fase = dot( instanceMatrix[3].xz, vec2( 0.21, 0.17 ) ) + uTiempo * 1.4;
  #else
    float fase = uTiempo * 1.4;
  #endif
  float alto = max( position.y - 1.5, 0.0 );
  transformed.x += sin( fase + position.y * 0.5 ) * 0.03 * alto;
  transformed.z += cos( fase * 0.8 + position.x * 0.4 ) * 0.025 * alto;
`;

export function crearMaterialesVegetales(texturas) {
  const tiempo = { value: 0 };
  const conViento = (material, aleteo) => {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTiempo = tiempo;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTiempo;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>\n${VIENTO}${
            aleteo
              ? 'transformed += normal * sin( uTiempo * 5.0 + position.x * 3.1 + position.z * 2.3 ) * 0.03;'
              : ''
          }`,
        );
      if (aleteo) {
        shader.fragmentShader = shader.fragmentShader
          .replace('float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;', 'float faceDirection = 1.0;')
          .replace(
            '#include <emissivemap_fragment>',
            '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * 0.12;',
          );
      }
    };
    material.customProgramCacheKey = () => (aleteo ? 'follaje-hojas' : 'follaje-solido');
    return material;
  };
  const hojas = (mapa, nombre) =>
    conViento(
      new THREE.MeshStandardMaterial({
        name: nombre,
        map: mapa,
        alphaTest: mapa ? 0.38 : 0,
        vertexColors: true,
        roughness: 0.78,
        side: THREE.DoubleSide,
      }),
      true,
    );
  return {
    tiempo,
    solido: conViento(
      new THREE.MeshStandardMaterial({ name: 'Tronco', vertexColors: true, roughness: 0.92 }),
      false,
    ),
    hojas: Object.fromEntries(
      Object.entries(texturas).map(([nombre, mapa]) => [nombre, hojas(mapa, `Hojas_${nombre}`)]),
    ),
  };
}
