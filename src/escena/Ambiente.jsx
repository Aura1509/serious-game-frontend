import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { HORIZONTE, SOL, crearMaterialCielo } from './cielo.js';

const ARRIBA = new THREE.Vector3(0, 1, 0);
const haciaAbajo = SOL.clone().negate();
const derecha = new THREE.Vector3().crossVectors(haciaAbajo, ARRIBA).normalize();
const arribaLuz = new THREE.Vector3().crossVectors(derecha, haciaAbajo).normalize();
const centro = new THREE.Vector3();

function Cielo({ reducirMovimiento }) {
  const material = useMemo(() => crearMaterialCielo(), []);
  const cupula = useRef(null);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state, delta) => {
    const malla = cupula.current;
    malla.position.copy(state.camera.position);
    if (!reducirMovimiento) malla.material.uniforms.uTiempo.value += delta;
  });
  return (
    <mesh ref={cupula} material={material} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[1000, 48, 24]} />
    </mesh>
  );
}

function Luz({ cuerpo }) {
  const material = useMemo(() => crearMaterialCielo({ nubes: false }), []);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <Environment resolution={128} frames={1} environmentIntensity={cuerpo ? 0.85 : 0.95}>
      <mesh material={material}>
        <sphereGeometry args={[50, 32, 16]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-2}>
        <circleGeometry args={[45, 32]} />
        <meshBasicMaterial color="#6f8f5a" />
      </mesh>
    </Environment>
  );
}

export function Sol({ objetivo, ligera }) {
  const luz = useRef(null);
  const scene = useThree((estado) => estado.scene);
  const alcance = ligera ? 20 : 32;
  const resolucion = ligera ? 1024 : 2048;
  const texel = (alcance * 2) / resolucion;

  useEffect(() => {
    const destino = luz.current.target;
    scene.add(destino);
    return () => scene.remove(destino);
  }, [scene]);

  useFrame(() => {
    const actual = luz.current;
    const u = Math.round(objetivo.dot(derecha) / texel) * texel;
    const v = Math.round(objetivo.dot(arribaLuz) / texel) * texel;
    centro
      .copy(derecha)
      .multiplyScalar(u)
      .addScaledVector(arribaLuz, v)
      .addScaledVector(haciaAbajo, objetivo.dot(haciaAbajo));
    actual.target.position.copy(centro);
    actual.position.copy(centro).addScaledVector(SOL, 90);
  });

  return (
    <directionalLight
      ref={luz}
      castShadow
      color="#fff3df"
      intensity={3.1}
      shadow-mapSize={[resolucion, resolucion]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.035}
      shadow-radius={ligera ? 2 : 4}
    >
      <orthographicCamera
        key={alcance}
        attach="shadow-camera"
        args={[-alcance, alcance, alcance, -alcance, 1, 200]}
      />
    </directionalLight>
  );
}

export default function Ambiente({ ligera, reducirMovimiento }) {
  return (
    <>
      <fog attach="fog" args={[HORIZONTE, 120, 1100]} />
      <hemisphereLight args={['#cfe6ff', '#5d7445', 0.35]} />
      <Cielo reducirMovimiento={reducirMovimiento} />
      <Luz cuerpo={!ligera} />
    </>
  );
}
