import { Component, Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor, useGLTF, useTexture } from '@react-three/drei';
import { procesarCampus } from './procesarCampus.js';
import { crearMateriales, rutasDeTexturas } from './superficies.js';
import { crearPaisaje } from './paisaje.js';
import { vestirAvatar } from './avatar.js';
import { clipsPorSexo, urlsDeAnimaciones } from './personajes.js';
import { modelosPorNombre, prepararAnimaciones, urlsDelElenco } from './elenco.js';
import Ambiente, { Sol } from './Ambiente.jsx';
import Animados from './Animados.jsx';
import Baliza from './Baliza.jsx';
import Camara from './Camara.jsx';
import Efectos from './Efectos.jsx';
import Jugador from './Jugador.jsx';
import LuzInterior from './LuzInterior.jsx';
import Paisaje from './Paisaje.jsx';
import Pasto from './Pasto.jsx';
import Personas from './Personas.jsx';
import Robot from './Robot.jsx';

const URL_CAMPUS = './models/campus.glb';
const TEXTURAS = rutasDeTexturas();
const ANIMACIONES = urlsDeAnimaciones();
const ELENCO = urlsDelElenco();
const COLORES = ['#e8743b', '#2bb5a8', '#e2b41c', '#2b3a67'];
const SOMBRAS = { enabled: true, type: THREE.PCFShadowMap };
const RENDER = {
  toneMapping: THREE.NeutralToneMapping,
  toneMappingExposure: 1,
  powerPreference: 'high-performance',
};
const CAMARA = { fov: 60, near: 0.1, far: 1300, position: [0, 4, 32] };

class SiFalla extends Component {
  state = { fallo: false };

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  render() {
    return this.state.fallo ? this.props.alternativa : this.props.children;
  }
}

function CampusProvisional() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[14, 48]} />
        <meshStandardMaterial color="#c9b79c" />
      </mesh>
      {COLORES.map((color, i) => {
        const angulo = (i / COLORES.length) * Math.PI * 2;
        return (
          <mesh key={color} position={[Math.cos(angulo) * 9, 3, Math.sin(angulo) * 9]} castShadow>
            <boxGeometry args={[4, 6, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
      })}
    </group>
  );
}

function Mundo({
  modo,
  activo,
  objetivo,
  teclas,
  giro,
  correr,
  ligera,
  capa,
  charla,
  cercana,
  marcoTablero,
  robot,
  celebrar,
  reducirMovimiento,
  alCambiarCercano,
  alCambiarZona,
  alLlegarAlBorde,
}) {
  const { scene } = useGLTF(URL_CAMPUS, false);
  const texturas = useTexture(TEXTURAS);
  const clips = useGLTF(ANIMACIONES, false);
  const modelos = useGLTF(ELENCO, false);
  const materiales = useMemo(() => crearMateriales(texturas), [texturas]);
  const animaciones = useMemo(() => prepararAnimaciones(clipsPorSexo(clips, ANIMACIONES)), [clips]);
  const personajes = useMemo(
    () => ({ modelos: modelosPorNombre(modelos, ELENCO), animaciones }),
    [modelos, animaciones],
  );
  const campus = useMemo(() => {
    const procesado = procesarCampus(scene, { materiales });
    vestirAvatar(procesado, personajes);
    return procesado;
  }, [scene, materiales, personajes]);
  const paisaje = useMemo(() => crearPaisaje(campus, materiales), [campus, materiales]);
  const registro = useMemo(() => ({ lista: [] }), []);
  const vista = modo === 'reto' && activo ? (campus.vistas[activo] ?? null) : null;
  const baliza = modo === 'explorar' && objetivo ? campus.puntos[objetivo] : null;

  return (
    <>
      <primitive object={campus.escenario} />
      <Sol key={ligera ? 'ligera' : 'alta'} objetivo={campus.avatar.position} ligera={ligera} />
      <LuzInterior campus={campus} />
      <Paisaje paisaje={paisaje} reducirMovimiento={reducirMovimiento} />
      {!ligera && (
        <Pasto
          campus={campus}
          rejilla={paisaje.rejilla}
          excluir={paisaje.estudio?.pisado}
          reducirMovimiento={reducirMovimiento}
        />
      )}
      <Personas
        campus={campus}
        paisaje={paisaje}
        registro={registro}
        ligera={ligera}
        capa={capa}
        charla={charla}
        cercana={cercana}
        personajes={personajes}
        reducirMovimiento={reducirMovimiento}
      />
      <Jugador
        campus={campus}
        teclas={teclas}
        activo={modo === 'explorar'}
        correr={correr}
        obstaculos={paisaje.obstaculos}
        registro={registro}
        reducirMovimiento={reducirMovimiento}
        alCambiarCercano={alCambiarCercano}
        alCambiarZona={alCambiarZona}
        alLlegarAlBorde={alLlegarAlBorde}
      />
      <Camara
        campus={campus}
        teclas={teclas}
        giro={giro}
        vista={vista}
        marcoTablero={marcoTablero}
        reducirMovimiento={reducirMovimiento}
      />
      <Robot
        campus={campus}
        capa={capa}
        vista={vista}
        mensaje={robot}
        destino={objetivo ? campus.puntos[objetivo] : null}
        celebrar={celebrar}
        reducirMovimiento={reducirMovimiento}
      />
      <Animados lista={campus.animados} reducirMovimiento={reducirMovimiento} />
      {baliza && <Baliza posicion={baliza} reducirMovimiento={reducirMovimiento} />}
    </>
  );
}

export default function Escena({ ligera, alBajoRendimiento, ...mundo }) {
  const capa = useRef(null);

  return (
    <>
      <Canvas shadows={SOMBRAS} dpr={ligera ? 1 : [1, 1.5]} gl={RENDER} camera={CAMARA}>
        <Ambiente ligera={ligera} reducirMovimiento={mundo.reducirMovimiento} />
        <SiFalla alternativa={<CampusProvisional />}>
          <Suspense fallback={null}>
            <Mundo ligera={ligera} capa={capa} {...mundo} />
          </Suspense>
        </SiFalla>
        {!ligera && <Efectos />}
        {alBajoRendimiento && (
          <PerformanceMonitor
            ms={400}
            iterations={12}
            bounds={() => [24, 50]}
            onDecline={alBajoRendimiento}
          />
        )}
      </Canvas>
      <div ref={capa} className="capa-3d" />
    </>
  );
}
