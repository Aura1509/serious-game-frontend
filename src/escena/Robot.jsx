import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import { alturaDelTecho } from './camara.js';
import {
  crearEstadoRobot,
  crearRobot,
  liberarRobot,
  moverRobot,
  puntoDeVuelo,
  puntoEnElAula,
} from './robot.js';
import VinetaRobot from '../ui/VinetaRobot.jsx';

const TECHO_INTERIOR = 3.4;
const ALTO_VINETA = 0.66;

export default function Robot({ campus, capa, vista, mensaje, destino, celebrar, reducirMovimiento }) {
  const robot = useMemo(() => crearRobot(), []);
  const raiz = useRef(null);
  const vineta = useRef(null);

  useEffect(() => () => liberarRobot(robot), [robot]);

  useFrame((state, delta) => {
    const grupo = raiz.current;
    if (!grupo) return;
    const datos = grupo.userData;
    datos.estado ??= crearEstadoRobot();
    datos.objetivo ??= new THREE.Vector3();
    datos.origen ??= new THREE.Vector3();
    datos.interior ??= 0;
    const paso = Math.min(delta, 0.05);
    const jugador = campus.avatar.position;
    const bvh = campus.bvhCamara ?? campus.colisionador.geometry.boundsTree;
    datos.origen.set(jugador.x, jugador.y + 1.45, jugador.z);
    let origen = datos.origen;
    if (vista) {
      puntoEnElAula(datos.objetivo, vista);
      origen = null;
    } else {
      const techo = alturaDelTecho(bvh, datos.origen);
      datos.interior += (Number(techo < TECHO_INTERIOR) - datos.interior) * (1 - Math.exp(-paso * 3));
      puntoDeVuelo(datos.objetivo, jugador, state.camera, datos.interior);
    }
    const senalar = mensaje?.gesto === 'senalar' && destino && !vista;
    moverRobot(datos.partes, datos.estado, {
      objetivo: datos.objetivo,
      origen,
      mirar: senalar ? destino : state.camera.position,
      bvh,
      dt: paso,
      reducir: reducirMovimiento,
      hablando: Boolean(mensaje?.hablando),
      expresion: mensaje?.expresion ?? null,
      gesto: mensaje?.gesto ?? null,
      fiesta: celebrar,
    });
    const caja = vineta.current;
    if (!caja) return;
    datos.punto ??= new THREE.Vector3();
    datos.punto.copy(grupo.position);
    datos.punto.y += ALTO_VINETA;
    datos.punto.project(state.camera);
    const arriba = ((1 - datos.punto.y) / 2) * state.size.height;
    caja.style.setProperty('--empuje', `${Math.round(Math.max(0, caja.offsetHeight + 26 - arriba))}px`);
  });

  return (
    <>
      <primitive object={robot.grupo} ref={raiz}>
        {capa && mensaje && (
          <Html portal={capa} position={[0, ALTO_VINETA, 0]} zIndexRange={[30, 20]}>
            <VinetaRobot
              ref={vineta}
              mensaje={mensaje}
              animar={!reducirMovimiento}
              izquierda={Boolean(vista)}
            />
          </Html>
        )}
      </primitive>
      {celebrar && !reducirMovimiento && vista && (
        <Sparkles
          position={[vista.mirar.x, vista.mirar.y, vista.mirar.z]}
          count={70}
          scale={[vista.ancho * 1.1, vista.alto * 1.3, 1.6]}
          size={6}
          speed={0.8}
          color="#ffd84d"
        />
      )}
    </>
  );
}
