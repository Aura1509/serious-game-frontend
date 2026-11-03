/**
 * Retroalimentación (RP-06, RF-04): explica la causa de cada criterio que no se cumple,
 * no solo si la respuesta es correcta.
 */
export function componerRetroalimentacion(reto, resultado, errores = []) {
  if (errores.length) {
    return { aprobado: false, mensajes: [`El código se detuvo: ${errores[0]}`] };
  }
  if (resultado.aprobado) return { aprobado: true, mensajes: [reto.mensajes?.exito ?? '¡Reto superado!'] };
  return {
    aprobado: false,
    mensajes: resultado.resultados.filter((r) => !r.cumple).map((r) => r.criterio.mensaje),
  };
}
