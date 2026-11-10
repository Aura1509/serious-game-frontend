import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import Conversacion from '../ui/Conversacion.jsx';
import {
  crearPersonas,
  crearRutas,
  moverPersonas,
  mostrarLetrero,
  registrarObstaculos,
  registrarPersonas,
} from './personas.js';

function PistaHablar({ capa, altura }) {
  return (
    <Html portal={capa} position={[0, altura, 0]} zIndexRange={[10, 0]}>
      <div className="pista-3d" aria-hidden="true">
        <span className="tecla">Espacio</span> Hablar
      </div>
    </Html>
  );
}

function Letrero({ capa, altura, datos, alMontar }) {
  return (
    <Html portal={capa} position={[0, altura, 0]} zIndexRange={[5, 0]}>
      <div
        ref={alMontar}
        className="letrero-3d"
        aria-hidden="true"
        hidden
        style={{ borderColor: datos.acento }}
      >
        <strong>{datos.nombre}</strong>
        <span>{datos.curso}</span>
      </div>
    </Html>
  );
}

export default function Personas({
  campus,
  paisaje,
  registro,
  ligera,
  capa,
  charla,
  cercana,
  personajes,
  reducirMovimiento,
}) {
  const conversando = charla?.id ?? null;
  const grupo = useRef(null);
  const letreros = useRef(new Map());
  const personas = useMemo(
    () =>
      crearPersonas({
        extras: { personajes },
        rutas: crearRutas(campus.puntos, paisaje.rejilla),
        bancas: paisaje.bancas,
        cantidad: ligera ? 4 : 8,
        puntos: campus.puntos,
        estudio: paisaje.estudio,
      }),
    [personajes, campus, paisaje, ligera],
  );

  useEffect(() => registrarObstaculos(paisaje.obstaculos, personas), [paisaje, personas]);
  useEffect(() => registrarPersonas(registro, personas), [registro, personas]);

  useFrame((_, delta) => {
    const lista = grupo.current?.userData.personas;
    if (!lista) return;
    const bvh = campus.colisionador.geometry.boundsTree;
    const jugador = campus.avatar.position;
    moverPersonas(lista, jugador, bvh, Math.min(delta, 0.05), reducirMovimiento, conversando);
    for (const persona of lista) {
      const letrero = letreros.current.get(persona.id);
      if (!letrero) continue;
      const oculto = !mostrarLetrero(persona, jugador);
      if (letrero.hidden !== oculto) letrero.hidden = oculto;
    }
  });

  return (
    <group ref={grupo} userData={{ personas }}>
      {personas.map((persona) => {
        const sentada = persona.tipo === 'sentada' || persona.tipo === 'silla';
        const altura = sentada ? persona.altura * 0.82 : persona.altura + 0.15;
        const hablando = charla?.id === persona.id;
        const cerca = !charla && cercana === persona.id;
        return (
          <primitive key={persona.grupo.uuid} object={persona.grupo}>
            {persona.personaje && <primitive object={persona.personaje.grupo} />}
            {capa && hablando && (
              <Html portal={capa} position={[0, altura, 0]} zIndexRange={[20, 10]}>
                <Conversacion
                  persona={persona.datos}
                  linea={charla.linea}
                  color={persona.datos.acento ?? persona.datos.perfil.top.color}
                  animar={!reducirMovimiento}
                  alSiguiente={charla.alSiguiente}
                  alTerminar={charla.alTerminar}
                />
              </Html>
            )}
            {capa && cerca && <PistaHablar capa={capa} altura={altura} />}
            {capa && persona.datos.curso && !hablando && !cerca && (
              <Letrero
                capa={capa}
                altura={altura + 0.1}
                datos={persona.datos}
                alMontar={(elemento) => {
                  if (elemento) letreros.current.set(persona.id, elemento);
                  else letreros.current.delete(persona.id);
                }}
              />
            )}
          </primitive>
        );
      })}
    </group>
  );
}
