import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { capacidadDelPasto, crearHoja, crearMaterialDePasto, sembrarPasto } from './pasto.js';

const TRAMO = 7;

export default function Pasto({ campus, rejilla, excluir, reducirMovimiento }) {
  const malla = useMemo(() => {
    const { material, uniformes } = crearMaterialDePasto();
    const instancias = new THREE.InstancedMesh(crearHoja(), material, capacidadDelPasto());
    instancias.name = 'Pasto';
    instancias.frustumCulled = false;
    instancias.receiveShadow = true;
    instancias.count = 0;
    instancias.userData.uniformes = uniformes;
    instancias.userData.centro = new THREE.Vector2(Infinity, Infinity);
    return instancias;
  }, []);
  const grupo = useRef(null);

  useEffect(
    () => () => {
      malla.geometry.dispose();
      malla.material.dispose();
    },
    [malla],
  );

  useFrame((_, delta) => {
    const actual = grupo.current?.children[0];
    if (!actual) return;
    const { uniformes, centro } = actual.userData;
    const jugador = campus.avatar.position;
    uniformes.uCentro.value.copy(jugador);
    if (!reducirMovimiento) uniformes.uTiempo.value += Math.min(delta, 0.05);
    const x = Math.round(jugador.x / TRAMO) * TRAMO;
    const z = Math.round(jugador.z / TRAMO) * TRAMO;
    if (x !== centro.x || z !== centro.y) {
      centro.set(x, z);
      sembrarPasto(actual, rejilla, x, z, excluir);
    }
  });

  return (
    <group ref={grupo}>
      <primitive object={malla} />
    </group>
  );
}
