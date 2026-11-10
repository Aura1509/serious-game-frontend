import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ESTUDIO } from '../src/escena/conversaciones.js';
import { zonaDeEstudio } from '../src/escena/paisaje.js';
import { crearPersonas } from '../src/escena/personas.js';
import { INICIO_FUERA_DEL_ARCO, ubicarEntrada } from '../src/escena/procesarCampus.js';

describe('entrada del campus', () => {
  it('pone el inicio afuera del arco y conserva su altura', () => {
    const puntos = { SPAWN_Jugador: new THREE.Vector3(0, 0.1, 24) };
    const pilares = [new THREE.Vector3(-4.8, 3.8, 33), new THREE.Vector3(4.8, 3.8, 33)];
    const entrada = ubicarEntrada(pilares, puntos);
    expect(entrada.arco.toArray()).toEqual([0, 0, 33]);
    expect(entrada.afuera.toArray()).toEqual([0, 0, 1]);
    expect(puntos.SPAWN_Jugador.toArray()).toEqual([0, 0.1, 33 + INICIO_FUERA_DEL_ARCO]);
    expect(ubicarEntrada([], { SPAWN_Jugador: new THREE.Vector3() })).toBeNull();
  });
});

describe('zona de estudio antes de la entrada', () => {
  const estudio = zonaDeEstudio({ arco: new THREE.Vector3(0, 0, 33), afuera: new THREE.Vector3(0, 0, 1) });

  it('pone mesas con cuatro sillas que miran hacia su mesa, sobre las losas', () => {
    expect(estudio.mesas).toHaveLength(4);
    expect(estudio.sillas).toHaveLength(16);
    for (const silla of estudio.sillas) {
      const mesa = estudio.mesas[silla.mesa];
      const hacia = new THREE.Vector2(mesa.x - silla.x, mesa.z - silla.z).normalize();
      const mira = new THREE.Vector2(Math.sin(silla.giro), Math.cos(silla.giro));
      expect(mira.dot(hacia)).toBeGreaterThan(0.7);
      expect(estudio.pisado(silla.x, silla.z)).toBe(true);
    }
  });

  it('cubre con losas el camino y las mesas, y deja pasto entre ellos', () => {
    expect(estudio.pisado(0, 33 + INICIO_FUERA_DEL_ARCO)).toBe(true);
    expect(estudio.pisado(4, 40)).toBe(false);
    expect(estudio.contiene(0, 44)).toBe(true);
    expect(estudio.contiene(0, 20)).toBe(false);
  });

  it('sienta a los estudiantes en las sillas y deja a una de pie junto a una mesa', () => {
    const lista = crearPersonas({ rutas: [], bancas: [], cantidad: 0, estudio });
    const sentados = lista.filter((persona) => persona.tipo === 'sentada');
    const esperados = ESTUDIO.filter((datos) => datos.tipo === 'sentada').map((datos) => datos.nombre);
    expect(sentados.map((persona) => persona.datos.nombre)).toEqual(esperados);
    for (const persona of sentados) {
      const { x, z } = persona.grupo.position;
      expect(estudio.sillas.some((silla) => Math.hypot(silla.x - x, silla.z - z) < 0.1)).toBe(true);
    }
    const dePie = lista.filter((persona) => persona.tipo === 'fija');
    expect(dePie).toHaveLength(ESTUDIO.length - esperados.length);
    expect(dePie[0].obstaculo.radio).toBeGreaterThan(0);
  });
});
