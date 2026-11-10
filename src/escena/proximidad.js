export function buscarCercano(posicion, puntos, radio = 2.4) {
  let cercano = null;
  let menor = radio;
  for (const [nombre, punto] of Object.entries(puntos)) {
    if (!nombre.startsWith('INT_') || Math.abs(punto.y - posicion.y) > 2) continue;
    const distancia = Math.hypot(punto.x - posicion.x, punto.z - posicion.z);
    if (distancia < menor) {
      menor = distancia;
      cercano = nombre;
    }
  }
  return cercano;
}

export function zonaDe(posicion, zonas) {
  const zona = zonas.find(
    ({ centro, radio }) => Math.hypot(centro.x - posicion.x, centro.z - posicion.z) < radio,
  );
  return zona?.nombre ?? null;
}
