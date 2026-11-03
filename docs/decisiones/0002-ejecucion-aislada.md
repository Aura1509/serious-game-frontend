# 0002. Ejecución aislada del código del estudiante

- **Estado:** aceptada, con un pendiente
- **Fecha:** 2026-11-03

## Contexto

El estudiante escribe HTML, CSS y JavaScript que el juego debe ejecutar y evaluar sin que un error rompa la escena 3D.

## Decisión

El código se ejecuta en un `iframe` oculto con `srcdoc` y `sandbox="allow-scripts allow-same-origin"`. El evaluador lee el documento resultante desde el juego. Como todo ocurre en el navegador del propio estudiante y no hay servidor, permitir el mismo origen no expone datos de otras personas.

## Pendiente

Un ciclo infinito síncrono (por ejemplo, `while (true) {}`) bloquea el hilo principal, y el límite de tiempo de `src/ejecucion/sandbox.js` no alcanza a cortarlo. Opciones a evaluar:

1. Transformar el código antes de ejecutarlo para insertar un contador en cada ciclo, que lance un error al superar un número de vueltas (técnica usada por editores en línea).
2. Ejecutar la lógica en un Web Worker, aunque no tiene acceso al DOM.

Esta decisión corresponde a la decisión pendiente «límite de tiempo para cortar ciclos infinitos» del GDD (apartado B.16).
