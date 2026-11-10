import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { PERSONAJES, SENTADOS, datosDePersona } from '../src/escena/conversaciones.js';
import { PERFIL_JUGADOR, crearHumano, posarHumano } from '../src/escena/humano.js';
import { describirInteraccion } from '../src/escena/interacciones.js';
import { buscarPersonaCercana, crearPersonas, moverPersonas } from '../src/escena/personas.js';

describe('humanos generados por código', () => {
  it('arma un cuerpo con esqueleto y la estatura del perfil', () => {
    const humano = crearHumano(PERFIL_JUGADOR);
    expect(humano.malla.isSkinnedMesh).toBe(true);
    expect(humano.malla.skeleton.bones).toHaveLength(18);
    humano.malla.geometry.computeBoundingBox();
    const alto = humano.malla.geometry.boundingBox.max.y;
    expect(alto).toBeGreaterThan(PERFIL_JUGADOR.altura - 0.08);
    expect(alto).toBeLessThan(PERFIL_JUGADOR.altura + 0.12);
  });

  it('dobla rodillas y codos al caminar, y se sienta en una banca', () => {
    const humano = crearHumano(PERSONAJES[2].perfil);
    posarHumano(humano, { fase: 0, andar: 1 });
    expect(humano.huesos.rodillaI.rotation.x).toBeGreaterThan(0.5);
    expect(humano.huesos.codoI.rotation.x).toBeLessThan(0);
    posarHumano(humano, { sentado: 1, asiento: 0.47 });
    expect(humano.huesos.musloI.rotation.x).toBeCloseTo(-1.5);
    expect(humano.huesos.rodillaI.rotation.x).toBeCloseTo(1.45);
  });
});

describe('personas del campus', () => {
  const ruta = { puntos: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 0, 0)], vuelta: false };
  const bancas = [
    { x: 0, z: 5, giro: 0 },
    { x: 4, z: 5, giro: 0 },
  ];

  it('crea caminantes y personas sentadas en las bancas', () => {
    const lista = crearPersonas({ rutas: [ruta], bancas, cantidad: 3 });
    const esperados = [...PERSONAJES.slice(0, 3), ...SENTADOS].map((datos) => datos.nombre);
    expect(lista.map((persona) => persona.datos.nombre)).toEqual(esperados);
    expect(lista.at(-1).tipo).toBe('sentada');
    expect(lista[0].tipo).toBe('silla');
  });

  it('se detiene y conversa con quien le habla', () => {
    const lista = crearPersonas({ rutas: [ruta], bancas: [], cantidad: 3 });
    const persona = lista[2];
    persona.espera = 0;
    const lejos = new THREE.Vector3(100, 0, 100);
    for (let i = 0; i < 30; i++) moverPersonas(lista, lejos, null, 1 / 30, false, null);
    const quieta = persona.grupo.position.clone();
    const cerca = quieta.clone().add(new THREE.Vector3(0, 0, 1.2));
    for (let i = 0; i < 30; i++) moverPersonas(lista, cerca, null, 1 / 30, false, persona.id);
    expect(persona.grupo.position.distanceTo(quieta)).toBeLessThan(0.05);
    expect(persona.hablar).toBeGreaterThan(0.6);
  });

  it('encuentra a la persona cercana y describe la conversación', () => {
    const lista = crearPersonas({ rutas: [ruta], bancas, cantidad: 3 });
    const sentada = lista.at(-1);
    const nombre = buscarPersonaCercana(
      sentada.grupo.position.clone().add(new THREE.Vector3(1, 0, 0)),
      lista,
    );
    expect(nombre).toBe(`PERSONA_${sentada.id}`);
    expect(datosDePersona(nombre)).toBe(SENTADOS[1]);
    expect(describirInteraccion(nombre)).toMatchObject({
      tipo: 'charla',
      accion: `Hablar con ${SENTADOS[1].nombre}`,
    });
    expect(buscarPersonaCercana(new THREE.Vector3(50, 0, 50), lista)).toBeNull();
  });

  it('cada persona tiene un nombre, un rol y algo que decir', () => {
    for (const datos of [...PERSONAJES, ...SENTADOS]) {
      expect(datos.nombre.length).toBeGreaterThan(2);
      expect(datos.rol.length).toBeGreaterThan(5);
      expect(datos.lineas.length).toBeGreaterThanOrEqual(2);
    }
  });
});
