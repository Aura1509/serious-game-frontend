# 0003. Los retos se definen como datos

- **Estado:** aceptada
- **Fecha:** 2026-11-03

## Contexto

El juego tiene 20 retos, varios con un banco de variantes (RF-08), y la matriz puede seguir cambiando.

## Decisión

Cada reto es un archivo JSON en `data/retos/`, validado contra `data/esquema-reto.json`. El código solo implementa tipos de criterio genéricos (`src/evaluador/plantillas.js`).

## Consecuencias

- Agregar o ajustar un reto no exige reprogramar el juego.
- Cada reto queda trazable a la matriz por su `id` y su `ra`.
