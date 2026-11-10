import { useFrame } from '@react-three/fiber';
import { animarObjetos } from './animaciones.js';

export default function Animados({ lista, reducirMovimiento }) {
  useFrame((state) => {
    if (!reducirMovimiento) animarObjetos(lista, state.clock.elapsedTime);
  });
  return null;
}
