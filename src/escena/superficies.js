import * as THREE from 'three';

const RUTA = './texturas/';

const CONJUNTOS = {
  cesped: { color: 'Grass004/Grass004_1K-JPG_Color.jpg', aspereza: 'Grass004/Grass004_1K-JPG_Roughness.jpg' },
  losas: { carpeta: 'concrete_tiles_02' },
  adoquin: { carpeta: 'short_bricks_floor' },
  ladrillo: { carpeta: 'red_brick' },
  panete: { carpeta: 'beige_wall_001' },
  terrazo: { carpeta: 'terrazzo_tiles' },
  madera: { carpeta: 'laminate_floor_02' },
};

const TAMANO = {
  cesped: 1.6,
  losas: 1.825,
  adoquin: 1.94,
  ladrillo: 1.4,
  panete: 3,
  terrazo: 2,
  madera: 1.7,
};

const MADERA = new Set(['#a8743f', '#7a5232', '#8a5a3a', '#6d5137']);
const METAL = new Set(['#8e96a6', '#6b7280', '#4a4f5a', '#22262f', '#323845', '#5b616d']);
const CRISTAL = new Set(['#0e1a3a', '#5d7fa6', '#9cc3e6']);
const MUEBLES =
  /^(Pupitre|Silla|Mesa|Escritorio|Estante|Casilleros|Banca|Puerta|Atril$|Pincel|Mobiliario|Rack)/;
const METALICOS =
  /^(Farol|Banner_Poste|Guia_Poste|Cupula_Estructura|Cupula_Puerta_Poste|Luces|Brazo|Mecanica)/;
const FACHADAS = /^(Fachada|Esquina_Curva|Torre_Vidrio)/;
const PISOS = /^(Interior_Base|Plataforma|Porche)/;

export const POR_MATERIAL = {
  M_Paleta: 'paleta',
  M_Ladrillo: 'ladrillo',
  M_Baldosa: 'terrazoPropio',
  M_Madera: 'maderaPropia',
  M_Vidrio: 'vidrio',
  M_Cupula: 'cupula',
};

export function rutasDeTexturas() {
  const rutas = {};
  for (const [nombre, conjunto] of Object.entries(CONJUNTOS)) {
    if (conjunto.carpeta) {
      const base = `${RUTA}${conjunto.carpeta}/${conjunto.carpeta}`;
      rutas[`${nombre}Color`] = `${base}_diff_1k.jpg`;
      rutas[`${nombre}Normal`] = `${base}_nor_gl_1k.jpg`;
      rutas[`${nombre}Arm`] = `${base}_arm_1k.jpg`;
    } else {
      rutas[`${nombre}Color`] = RUTA + conjunto.color;
      rutas[`${nombre}Arm`] = RUTA + conjunto.aspereza;
    }
  }
  return rutas;
}

export function clasificarTriangulo(nombre, hex, normal) {
  const base = nombre.replace(/^(HTML|CSS|JS|GENAI)_/, '');
  if (base === 'Suelo') return 'cesped';
  if (base === 'Plaza_Piso') return 'losas';
  if (base === 'Plaza_Escalon_Rojo' || base.startsWith('Anfiteatro_Grada')) return 'adoquin';
  if (base.startsWith('Camino_')) return 'caminos';
  if (base.startsWith('Planta')) return 'planta';
  if (MUEBLES.test(base)) return MADERA.has(hex) ? 'madera' : METAL.has(hex) ? 'metal' : 'plastico';
  if (METALICOS.test(base)) return METAL.has(hex) ? 'metal' : 'plastico';
  if (FACHADAS.test(base) && CRISTAL.has(hex)) return 'cristal';
  if (normal.y > 0.7 && PISOS.test(base)) return 'terrazo';
  return 'panete';
}

function prepararTextura(textura, tamano, enColor) {
  textura.wrapS = THREE.RepeatWrapping;
  textura.wrapT = THREE.RepeatWrapping;
  textura.repeat.set(1 / tamano, 1 / tamano);
  textura.anisotropy = 8;
  textura.colorSpace = enColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  textura.needsUpdate = true;
  return textura;
}

const DETALLE_TENIDO = /* glsl */ `
  #ifdef USE_MAP
    vec4 detalle = texture2D( map, vMapUv );
    vec3 media = max( textureLod( map, vMapUv, 14.0 ).rgb, vec3( 0.001 ) );
    float luz = dot( detalle.rgb, vec3( 0.2126, 0.7152, 0.0722 ) ) / max( dot( media, vec3( 0.2126, 0.7152, 0.0722 ) ), 0.001 );
    diffuseColor.rgb *= mix( vec3( luz ), detalle.rgb / media, 0.25 );
  #endif
`;

const RUIDO = /* glsl */ `
  float azarSuelo( vec2 p ) {
    return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 );
  }
  float ruidoSuelo( vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );
    vec2 u = f * f * ( 3.0 - 2.0 * f );
    return mix(
      mix( azarSuelo( i ), azarSuelo( i + vec2( 1.0, 0.0 ) ), u.x ),
      mix( azarSuelo( i + vec2( 0.0, 1.0 ) ), azarSuelo( i + vec2( 1.0, 1.0 ) ), u.x ),
      u.y
    );
  }
`;

const CESPED = /* glsl */ `
  #ifdef USE_MAP
    vec2 uvGirada = mat2( 0.8, -0.6, 0.6, 0.8 ) * vMapUv * 0.77 + vec2( 0.31, 0.67 );
    float cambio = smoothstep( 0.3, 0.7, ruidoSuelo( vMapUv * 0.17 ) );
    vec4 hierba = mix( texture2D( map, vMapUv ), texture2D( map, uvGirada ), cambio );
    float manchas = ruidoSuelo( vMapUv * 0.045 ) * 0.6 + ruidoSuelo( vMapUv * 0.011 ) * 0.4;
    hierba.rgb *= mix( 0.8, 1.12, manchas );
    float seco = smoothstep( 0.62, 0.9, ruidoSuelo( vMapUv * 0.023 + 7.0 ) );
    hierba.rgb = mix( hierba.rgb, hierba.rgb * vec3( 1.25, 1.1, 0.62 ), seco * 0.5 );
    diffuseColor *= hierba;
  #endif
`;

function conDetalleTenido(material) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', DETALLE_TENIDO);
  };
  material.customProgramCacheKey = () => 'detalle-tenido';
  return material;
}

function conCespedNatural(material) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${RUIDO}`)
      .replace('#include <map_fragment>', CESPED);
  };
  material.customProgramCacheKey = () => 'cesped-natural';
  return material;
}

function materialConTexturas(texturas, nombre, opciones = {}) {
  const tamano = TAMANO[nombre];
  const color = texturas[`${nombre}Color`];
  const normal = texturas[`${nombre}Normal`];
  const arm = texturas[`${nombre}Arm`];
  return new THREE.MeshStandardMaterial({
    name: `S_${opciones.nombre ?? nombre}`,
    map: color ? prepararTextura(color, tamano, true) : null,
    normalMap: normal ? prepararTextura(normal, tamano, false) : null,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: arm ? prepararTextura(arm, tamano, false) : null,
    aoMap: normal ? arm : null,
    aoMapIntensity: 0.7,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
    ...opciones.extra,
  });
}

export function crearMateriales(texturas) {
  const tenido = (nombre, extra) =>
    conDetalleTenido(
      materialConTexturas(texturas, nombre, {
        nombre: `${nombre}Tenido`,
        extra: { vertexColors: true, ...extra },
      }),
    );
  const liso = (nombre, extra) =>
    new THREE.MeshStandardMaterial({
      name: `S_${nombre}`,
      vertexColors: true,
      side: THREE.DoubleSide,
      ...extra,
    });
  return {
    cesped: conCespedNatural(
      materialConTexturas(texturas, 'cesped', { extra: { color: new THREE.Color(1.15, 1.45, 0.85) } }),
    ),
    losas: materialConTexturas(texturas, 'losas'),
    adoquin: materialConTexturas(texturas, 'adoquin'),
    ladrillo: materialConTexturas(texturas, 'ladrillo'),
    terrazoPropio: materialConTexturas(texturas, 'terrazo', {
      nombre: 'terrazoPropio',
      extra: { roughness: 0.6 },
    }),
    maderaPropia: materialConTexturas(texturas, 'madera', { nombre: 'maderaPropia' }),
    panete: tenido('panete'),
    caminos: conDetalleTenido(
      materialConTexturas(texturas, 'losas', { nombre: 'caminos', extra: { vertexColors: true } }),
    ),
    terrazo: tenido('terrazo', { roughness: 0.55 }),
    madera: tenido('madera'),
    metal: liso('metal', { metalness: 0.6, roughness: 0.35 }),
    plastico: liso('plastico', { roughness: 0.55 }),
    planta: liso('planta', { roughness: 0.85 }),
    cristal: liso('cristal', { metalness: 0.65, roughness: 0.12, envMapIntensity: 1.4 }),
    vidrio: new THREE.MeshStandardMaterial({
      name: 'S_vidrio',
      color: '#a9cbe0',
      metalness: 0.5,
      roughness: 0.06,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    }),
    cupula: new THREE.MeshStandardMaterial({
      name: 'S_cupula',
      color: '#cfe6f5',
      metalness: 0.4,
      roughness: 0.05,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  };
}

export function leerPaleta(escena) {
  let mapa = null;
  escena.traverse((objeto) => {
    if (!mapa && objeto.material?.name === 'M_Paleta') mapa = objeto.material.map;
  });
  const imagen = mapa?.image;
  if (!imagen || typeof document === 'undefined') return null;
  const lienzo = document.createElement('canvas');
  lienzo.width = imagen.width;
  lienzo.height = imagen.height;
  const contexto = lienzo.getContext?.('2d', { willReadFrequently: true });
  if (!contexto) return null;
  contexto.drawImage(imagen, 0, 0);
  const { data, width, height } = contexto.getImageData(0, 0, lienzo.width, lienzo.height);
  return (u, v) => {
    const x = Math.min(width - 1, Math.max(0, Math.floor(u * width)));
    const y = Math.min(height - 1, Math.max(0, Math.floor(v * height)));
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };
}
