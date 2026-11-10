import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { pulsoDeBaliza } from './animaciones.js';

export default function Baliza({ posicion, reducirMovimiento }) {
  const material = useRef(null);

  useFrame((state) => {
    if (!reducirMovimiento && material.current) pulsoDeBaliza(material.current, state.clock.elapsedTime);
  });

  return (
    <mesh position={[posicion.x, posicion.y + 6, posicion.z]}>
      <cylinderGeometry args={[0.4, 0.4, 12, 20, 1, true]} />
      <meshBasicMaterial ref={material} color="#ffd84d" transparent opacity={0.4} depthWrite={false} />
    </mesh>
  );
}
