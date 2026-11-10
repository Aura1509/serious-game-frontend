import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  actualizarCamara,
  atenuarAvatar,
  crearEstadoCamara,
  desplazarVista,
  limitar,
  proyectarTablero,
} from './camara.js';

export default function Camara({ campus, teclas, giro, vista, marcoTablero, reducirMovimiento }) {
  const lienzo = useThree((estado) => estado.gl.domElement);
  const estado = useRef(null);

  useEffect(() => {
    estado.current ??= crearEstadoCamara();
    const actual = estado.current;
    let x = 0;
    let y = 0;
    const bajar = (evento) => {
      if (evento.button !== 0) return;
      actual.arrastrando = true;
      x = evento.clientX;
      y = evento.clientY;
      lienzo.setPointerCapture(evento.pointerId);
    };
    const mover = (evento) => {
      if (!actual.arrastrando) return;
      actual.yaw -= (evento.clientX - x) * 0.005;
      actual.pitch = limitar(actual.pitch + (evento.clientY - y) * 0.004, 0.05, 1.25);
      x = evento.clientX;
      y = evento.clientY;
    };
    const soltar = () => {
      actual.arrastrando = false;
    };
    const rueda = (evento) => {
      evento.preventDefault();
      actual.distancia = limitar(actual.distancia + evento.deltaY * 0.004, 2.5, 10);
    };
    lienzo.addEventListener('pointerdown', bajar);
    lienzo.addEventListener('pointermove', mover);
    lienzo.addEventListener('pointerup', soltar);
    lienzo.addEventListener('pointercancel', soltar);
    lienzo.addEventListener('wheel', rueda, { passive: false });
    return () => {
      lienzo.removeEventListener('pointerdown', bajar);
      lienzo.removeEventListener('pointermove', mover);
      lienzo.removeEventListener('pointerup', soltar);
      lienzo.removeEventListener('pointercancel', soltar);
      lienzo.removeEventListener('wheel', rueda);
    };
  }, [lienzo]);

  useFrame((state, delta) => {
    if (!estado.current) return;
    actualizarCamara(state.camera, estado.current, {
      objetivo: campus.avatar.position,
      bvh: campus.bvhCamara ?? campus.colisionador.geometry.boundsTree,
      teclas: teclas.current,
      giro,
      vista,
      delta: Math.min(delta, 0.05),
      reducirMovimiento,
    });
    atenuarAvatar(campus.avatar, state.camera, vista);
    const { width, height } = state.size;
    desplazarVista(state.camera, estado.current, vista, width, height, Math.min(delta, 0.05));
    proyectarTablero(marcoTablero?.current, vista, state.camera, width, height);
  });

  return null;
}
