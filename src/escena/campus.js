import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Escena 3D del campus (RT-01). Carga public/models/campus.glb si existe;
 * si no, muestra un campus provisional generado por código.
 */
export function crearEscena(lienzo) {
  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0xdfe3ea);
  const camara = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  camara.position.set(0, 12, 24);
  camara.lookAt(0, 0, 0);
  escena.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1));
  const sol = new THREE.DirectionalLight(0xffffff, 1);
  sol.position.set(10, 20, 10);
  escena.add(sol);

  new GLTFLoader().load(
    './models/campus.glb',
    (gltf) => escena.add(gltf.scene),
    undefined,
    () => escena.add(campusProvisional()),
  );

  function ajustarTamano() {
    const { clientWidth: w, clientHeight: h } = lienzo.parentElement;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  }
  window.addEventListener('resize', ajustarTamano);
  ajustarTamano();
  renderer.setAnimationLoop(() => renderer.render(escena, camara));

  return {
    /** Reacción visible de la escena al superar un reto (RL-02). */
    celebrar() {
      escena.background.set(0xd8f0e3);
      setTimeout(() => escena.background.set(0xdfe3ea), 600);
    },
  };
}

function campusProvisional() {
  const grupo = new THREE.Group();
  const piso = new THREE.Mesh(
    new THREE.CircleGeometry(14, 48),
    new THREE.MeshStandardMaterial({ color: 0xc9b79c }),
  );
  piso.rotation.x = -Math.PI / 2;
  grupo.add(piso);
  const colores = [0xe8743b, 0x2bb5a8, 0xe2b41c, 0x2b3a67]; // HTML, CSS, JavaScript, laboratorio de IA
  colores.forEach((color, i) => {
    const edificio = new THREE.Mesh(
      new THREE.BoxGeometry(4, 6, 4),
      new THREE.MeshStandardMaterial({ color }),
    );
    const angulo = (i / colores.length) * Math.PI * 2;
    edificio.position.set(Math.cos(angulo) * 9, 3, Math.sin(angulo) * 9);
    grupo.add(edificio);
  });
  return grupo;
}
