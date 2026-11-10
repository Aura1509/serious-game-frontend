import { PERFIL_JUGADOR, crearHumano } from './humano.js';
import { crearPersonaje } from './elenco.js';
import { JUGADORA } from './conversaciones.js';

export function vestirAvatar(campus, recursos = null, perfil = PERFIL_JUGADOR) {
  const avatar = campus.avatar;
  const actual = avatar.userData.personaje ?? avatar.userData.humano;
  if (actual) return actual;
  const partes = avatar.userData.partes;
  if (partes?.cuerpo) partes.cuerpo.visible = false;
  const modelo = recursos?.modelos?.[JUGADORA.modelo];
  if (modelo) {
    const personaje = crearPersonaje(modelo, recursos.animaciones, {
      ...JUGADORA,
      marchas: 'jugador',
      jugador: true,
    });
    avatar.add(personaje.grupo);
    avatar.userData.personaje = personaje;
    avatar.userData.partes = { ...partes, materiales: personaje.materiales };
    return personaje;
  }
  const humano = crearHumano(perfil, { resolucionCara: 512 });
  humano.material.alphaHash = true;
  avatar.add(humano.grupo);
  avatar.userData.humano = humano;
  avatar.userData.partes = { ...partes, materiales: [humano.material] };
  return humano;
}
