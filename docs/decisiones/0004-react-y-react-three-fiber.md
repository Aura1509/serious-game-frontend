# 0004. React y React Three Fiber para la interfaz y la escena

- **Estado:** aceptada
- **Fecha:** 2026-11-08
- **Reemplaza en parte a:** [0001](0001-vite-y-threejs.md), en lo que se refiere a usar JavaScript sin frameworks.

## Contexto

La decisión 0001 fijó three.js con JavaScript estándar en módulos y pidió registrar en una decisión nueva cualquier paso a React. El desarrollo del prototipo continuará con React.

## Decisión

- La interfaz 2D se construye con React.
- La escena 3D se construye con React Three Fiber sobre three.js 0.170 y WebGL (RT-01).
- Se mantienen JavaScript, Vite, Vitest, ESLint, Prettier y la publicación en GitHub Pages.
- Se conservan los módulos que no dependen de la interfaz: banco de retos, ejecución aislada, evaluador, retroalimentación y progreso.

## Consecuencias

- Hay que migrar a componentes el panel del reto, el punto de entrada y la escena del campus.
- El código que escriben los estudiantes no cambia: sigue siendo HTML, CSS y JavaScript estándar dentro de la página aislada.
- El documento de grado describe el stack sin frameworks (RT-02, Tabla 16 y apartados 4.5 y B.13). Hay que actualizarlo y comentarlo con la dirección.
