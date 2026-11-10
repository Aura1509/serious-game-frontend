# Contexto del proyecto

Serious game Web 3D del trabajo de grado de la Escuela de Ingeniería de Sistemas y Computación, Universidad del Valle. El documento de grado es la referencia: si el código y el documento no coinciden, se consulta antes de cambiar cualquiera de los dos.

## Stack

- React para la interfaz y React Three Fiber para la escena 3D, con JavaScript (decisión 0004 en `docs/decisiones/`). El código actual todavía es JavaScript sin frameworks y falta migrarlo. El documento de grado (RT-02, Tabla 16, apartados 4.5 y B.13) aún describe el stack sin frameworks.
- three.js 0.170 sobre WebGL (RT-01).
- Vite 6, Vitest con jsdom, ESLint y Prettier. Sin backend (RT-05).

## Skills del proyecto

Están en `.claude/skills/`; su origen y sus licencias, en `.claude/skills/LICENCIAS.md`.

- `three-best-practices`: rendimiento de three.js, carga de glTF y memoria. Escrita para three.js 0.182 o superior.
- `threejs-react-three-fiber`, `threejs-asset-pipeline` y `threejs-interaction`: escena con React Three Fiber, optimización del glTF y selección con el ratón. Escritas para three.js r186 y React Three Fiber 9.
- `vercel-react-best-practices`: rendimiento y organización de React. Las reglas de Next.js y de servidor no aplican.
- `accessibility`: auditoría WCAG. La tesis exige lo básico de WCAG 2.1 AA (contraste, uso del color, teclado e instrucciones claras); el resto es opcional.

Al usarlas:

- Comprobar que cada API que recomienden exista en las versiones instaladas del proyecto.
- Omitir las partes de WebGPU, TSL y WebXR: el prototipo usa WebGLRenderer.
- Omitir los import maps y las CDN: las dependencias se instalan con npm y las empaqueta Vite.
- Preguntar antes de ejecutar herramientas que instalen o descarguen algo, como Lighthouse o gltf-transform.

## Dependencias descartadas

- `@react-three/viverse` y `@pmndrs/viverse`: dependen del SDK de VIVERSE, cuya licencia solo permite usarlo en aplicaciones que se conectan a VIVERSE y prohíbe redistribuirlo.

## Convenciones

- Comentarios solo si son imprescindibles, de una línea y con puntuación simple.
- Cada reto es un JSON en `data/retos/` que sigue `data/esquema-reto.json` (ver `docs/como-agregar-un-reto.md`).
- Antes de dar un cambio por terminado: `npm run lint`, `npm run format:check` y `npm test`.
