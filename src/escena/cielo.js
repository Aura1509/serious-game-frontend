import * as THREE from 'three';

export const SOL = new THREE.Vector3(0.4, 0.74, 0.54).normalize();
export const HORIZONTE = new THREE.Color('#d3e6f1');
const CENIT = new THREE.Color('#3b8bd6');
const SUELO = new THREE.Color('#9fb79a');

const vertice = /* glsl */ `
  varying vec3 vDireccion;
  void main() {
    vDireccion = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmento = /* glsl */ `
  uniform vec3 uSol;
  uniform vec3 uCenit;
  uniform vec3 uHorizonte;
  uniform vec3 uSuelo;
  uniform float uTiempo;
  uniform float uNubes;
  varying vec3 vDireccion;

  float azar(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float ruido(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = azar(i);
    float b = azar(i + vec2(1.0, 0.0));
    float c = azar(i + vec2(0.0, 1.0));
    float d = azar(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float valor = 0.0;
    float amplitud = 0.5;
    mat2 giro = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      valor += amplitud * ruido(p);
      p = giro * p * 2.03;
      amplitud *= 0.5;
    }
    return valor;
  }

  void main() {
    vec3 d = normalize(vDireccion);
    float alto = max(d.y, 0.0);
    vec3 color = mix(uHorizonte, uCenit, pow(alto, 0.5));
    float haciaSol = max(dot(d, uSol), 0.0);
    color += vec3(1.0, 0.86, 0.62) * (pow(haciaSol, 8.0) * 0.22 + pow(haciaSol, 90.0) * 0.5);
    color += vec3(1.0, 0.96, 0.88) * smoothstep(0.99935, 0.9997, haciaSol) * 18.0;
    if (uNubes > 0.5 && d.y > 0.0) {
      vec2 plano = d.xz / (d.y + 0.1) * 1.7 + vec2(uTiempo * 0.004, uTiempo * 0.0015);
      float densidad = fbm(plano);
      float nube = smoothstep(0.5, 0.78, densidad);
      float haciaLuz = fbm(plano + uSol.xz * 0.18);
      float luz = clamp(1.0 - (haciaLuz - densidad) * 3.5, 0.0, 1.0);
      vec3 colorNube = mix(vec3(0.6, 0.67, 0.78), vec3(1.08, 1.07, 1.05), luz);
      colorNube += vec3(1.0, 0.88, 0.7) * pow(haciaSol, 10.0) * 0.4 * nube;
      color = mix(color, colorNube, nube * smoothstep(0.0, 0.2, d.y) * 0.95);
    }
    color = mix(color, uSuelo, smoothstep(0.0, -0.2, d.y));
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function crearMaterialCielo({ nubes = true } = {}) {
  return new THREE.ShaderMaterial({
    name: 'Cielo',
    uniforms: {
      uSol: { value: SOL.clone() },
      uCenit: { value: CENIT.clone() },
      uHorizonte: { value: HORIZONTE.clone() },
      uSuelo: { value: SUELO.clone() },
      uTiempo: { value: 0 },
      uNubes: { value: nubes ? 1 : 0 },
    },
    vertexShader: vertice,
    fragmentShader: fragmento,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
}
