import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function Paisaje({ paisaje, reducirMovimiento }) {
  const grupo = useRef(null);

  useFrame((_, delta) => {
    const tiempo = grupo.current?.userData.tiempo;
    if (tiempo && !reducirMovimiento) tiempo.value += delta;
  });

  return (
    <group ref={grupo} userData={{ tiempo: paisaje.tiempo }}>
      {paisaje.mallas.map((malla) => (
        <primitive key={malla.uuid} object={malla} />
      ))}
    </group>
  );
}
