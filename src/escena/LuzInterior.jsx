import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { alturaDelTecho } from './camara.js';

const cabeza = new THREE.Vector3();

export default function LuzInterior({ campus }) {
  const luz = useRef(null);
  const interior = useRef(0);

  useFrame((_, delta) => {
    const actual = luz.current;
    if (!actual) return;
    cabeza.copy(campus.avatar.position);
    cabeza.y += 1.7;
    const techo = alturaDelTecho(campus.bvhCamara, cabeza, 4);
    interior.current += (Number(techo < 3) - interior.current) * (1 - Math.exp(-Math.min(delta, 0.05) * 3));
    actual.position.set(cabeza.x, cabeza.y + Math.min(techo, 3) - 0.4, cabeza.z);
    actual.intensity = interior.current * 14;
  });

  return <pointLight ref={luz} color="#fff2df" intensity={0} distance={16} decay={1.6} />;
}
