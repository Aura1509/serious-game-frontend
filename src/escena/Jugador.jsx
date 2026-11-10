import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { animarAvatar, colocarEnInicio, crearEstadoJugador, moverJugador } from './fisica.js';
import { animarPuertas } from './puertas.js';
import { buscarPersonaCercana } from './personas.js';
import { buscarCercano, zonaDe } from './proximidad.js';

export default function Jugador({
  campus,
  teclas,
  activo,
  correr,
  obstaculos,
  registro,
  reducirMovimiento,
  alCambiarCercano,
  alCambiarZona,
  alLlegarAlBorde,
}) {
  const estado = useRef(null);

  useEffect(() => {
    estado.current = crearEstadoJugador();
    colocarEnInicio(campus);
  }, [campus]);

  useFrame((state, delta) => {
    const actual = estado.current;
    if (!actual) return;
    const paso = Math.min(delta, 0.05);
    const hablando = actual.cercano?.startsWith('PERSONA_');
    moverJugador(campus, actual, activo ? teclas.current : null, state.camera, paso, {
      correr,
      obstaculos,
      saltar: !hablando,
    });
    animarAvatar(campus.avatar, actual, paso, reducirMovimiento);
    animarPuertas(campus.puertas ?? [], [campus.avatar.position], paso, reducirMovimiento);
    if (actual.enElBorde !== Boolean(actual.avisado)) {
      actual.avisado = actual.enElBorde;
      if (actual.enElBorde) alLlegarAlBorde?.();
    }
    const posicion = campus.avatar.position;
    const persona = activo ? buscarPersonaCercana(posicion, registro?.lista) : null;
    const cercano = persona ?? (activo ? buscarCercano(posicion, campus.puntos) : null);
    if (cercano !== actual.cercano) {
      actual.cercano = cercano;
      alCambiarCercano(cercano);
    }
    const zona = zonaDe(posicion, campus.zonas);
    if (zona !== actual.zona) {
      actual.zona = zona;
      alCambiarZona(zona);
    }
  });

  return <primitive object={campus.avatar} />;
}
