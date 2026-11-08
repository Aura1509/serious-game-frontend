# Arquitectura

El prototipo es una aplicación web estática: corre completa en el navegador, sin servidor propio ni conexión con modelos de lenguaje (RT-05). Los módulos están separados para desarrollarlos y probarlos por partes (RNF-07), según la Figura B3 del Anexo B del documento de grado.

| Módulo               | Carpeta                             | Responsabilidad                                            | Requerimientos               |
| -------------------- | ----------------------------------- | ---------------------------------------------------------- | ---------------------------- |
| Escena 3D            | `src/escena/`                       | Campus, robot, personajes y animaciones con three.js       | RT-01, RL-01, RL-02          |
| Banco de retos       | `data/retos/`, `src/retos/banco.js` | Retos, estructura base, criterios y variantes como datos   | RF-08, RP-02                 |
| Controlador de retos | `src/retos/controlador.js`          | Abre el reto, ejecuta, evalúa y coordina los demás módulos | RL-03, RL-04                 |
| Ejecución aislada    | `src/ejecucion/`                    | Ejecuta el código del estudiante en una página oculta      | RF-02                        |
| Evaluador            | `src/evaluador/`                    | Comprueba criterios de estructura, estilos y eventos       | RF-03                        |
| Retroalimentación    | `src/retroalimentacion/`            | Mensajes que explican la causa del error                   | RF-04, RP-06                 |
| Progreso             | `src/progreso/`                     | Guardado local y código de continuación                    | RF-09, RNF-08                |
| Interfaz 2D          | `src/ui/`, `src/estilos/`           | Panel del reto, editor e instrucciones visibles            | RF-01, RF-05, RNF-03, RNF-05 |

## Flujo de un reto

1. El controlador toma el reto del banco y el panel muestra la teoría, la consigna y la estructura base. La vista previa muestra la cartelera y se actualiza mientras el estudiante escribe HTML o CSS.
2. El estudiante edita el código y pulsa «Ejecutar».
3. La ejecución aislada arma la página con la base y el código del estudiante.
4. El evaluador revisa sobre esa página los criterios de la parte actual y de las anteriores.
5. La retroalimentación explica lo que falta, con un mensaje por grupo de criterios. Si la parte se supera, el panel muestra la siguiente; al superar la última, se guarda el progreso y la escena reacciona.
