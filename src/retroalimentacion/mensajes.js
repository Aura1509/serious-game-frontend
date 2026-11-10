/**
 * Retroalimentación (RP-06, RF-04): explica la causa de cada criterio que no se cumple,
 * no solo si la respuesta es correcta.
 */
export function componerRetroalimentacion(resultado, errores = [], exito = '¡Reto superado!') {
  if (errores.length) {
    return { aprobado: false, mensajes: [`El código se detuvo: ${errores[0]}`] };
  }
  if (resultado.aprobado) return { aprobado: true, mensajes: [exito] };
  const grupos = new Set();
  const mensajes = [];
  for (const { criterio, cumple } of resultado.resultados) {
    if (cumple || grupos.has(criterio.grupo)) continue;
    if (criterio.grupo) grupos.add(criterio.grupo);
    mensajes.push(criterio.mensaje);
  }
  return { aprobado: false, mensajes };
}
