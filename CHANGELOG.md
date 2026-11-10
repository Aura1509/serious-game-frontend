# Registro de cambios

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Agregado

- Segunda parte del reto H1: el estudiante decide si la noticia, la agenda y la fila de botones van en article, section o div.
- Tipo de criterio `contenedor` y campo `grupo`, para mostrar un solo mensaje por región o bloque.
- Consigna visible en el panel y vista previa que se actualiza mientras se escribe HTML o CSS.
- Campo `solucion` en los retos y pruebas que verifican la base, la solución y los errores frecuentes de H1.

### Cambiado

- Los retos se organizan en `partes`, cada una con su teoría, su consigna y sus criterios.
- La base de H1 es la cartelera completa armada solo con div, como la describe la Tabla 12.
- Los criterios de H1 comprueban también qué contenido quedó dentro de cada región.
- Reiniciar devuelve también la parte y la vista previa del reto a su estado inicial.

## [0.1.0] - 2026-11-03

### Agregado

- Estructura del proyecto con Vite y three.js.
- Módulos de la arquitectura: escena, banco y controlador de retos, ejecución aislada, evaluador por plantillas, retroalimentación, progreso y panel del reto.
- Reto H1 «De div a semántica» como primer reto del banco.
- Guardado local del progreso y código de continuación.
- Pruebas automáticas, integración continua y despliegue en GitHub Pages.
