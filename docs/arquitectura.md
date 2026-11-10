# Arquitectura

El prototipo es una aplicación web estática hecha con React y React Three Fiber: corre completa en el navegador, sin servidor propio ni conexión con modelos de lenguaje (RT-05). Los módulos están separados para desarrollarlos y probarlos por partes (RNF-07), según la Figura B3 del Anexo B del documento de grado y la decisión 0004.

| Módulo               | Carpeta o archivo                                                  | Responsabilidad                                                                  | Requerimientos                |
| -------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ----------------------------- |
| Escena 3D            | `src/escena/`                                                      | Campus, jugador, cámara, animaciones y puntos de interacción                     | RT-01, RL-01, RL-02           |
| Física y cámara      | `src/escena/fisica.js`, `camara.js`                                | Movimiento con colisiones (three-mesh-bvh) y cámara en tercera persona           | RL-01, RNF-02                 |
| Ambiente             | `Ambiente.jsx`, `cielo.js`, `Efectos.jsx`                          | Cielo, montañas, sol con sombras, luz del entorno y postprocesado                | RL-01, RNF-02                 |
| Superficies          | `src/escena/superficies.js`                                        | Clasifica los triángulos del modelado y les asigna texturas CC0                  | RL-01, RNF-02                 |
| Paisaje y personas   | `paisaje.js`, `vegetacion.js`, `ocupacion.js`, `personas.js`       | Vegetación, bancas, rutas con A\* y personas animadas                            | RL-01, RNF-02                 |
| Puertas              | `src/escena/puertas.js`                                            | Puertas de los edificios que se abren al acercarse                               | RL-01                         |
| Personajes           | `elenco.js`, `caras.js`, `personajes.js`, `avatar.js`, `ayudas.js` | Personajes de Quaternius, animaciones adaptadas, caras dibujadas, silla y bastón | RL-01                         |
| Conversaciones       | `conversaciones.js`, `src/ui/Conversacion.jsx`                     | Frases de cada persona y cuadro accesible para conversar                         | RF-05, RNF-03 a RNF-05        |
| Entorno              | `terreno.js`, `follaje.js`, `pasto.js`, `LuzInterior.jsx`          | Colinas, bosque lejano, follaje de tarjetas, pasto cercano y luz interior        | RL-01, RNF-02                 |
| Robot asistente      | `robot.js`, `Robot.jsx`, `src/asistente/`                          | Robot que vuela con el jugador, guion de consejos, teoría, pistas y voz          | RL-06, RP-07, RNF-06          |
| Reto en el aula      | `src/ui/PanelReto.jsx`, `src/ui/VinetaRobot.jsx`                   | Tablero en vivo, libreta del reto, pistas y celebración                          | RL-03, RF-05                  |
| Banco de retos       | `data/retos/`, `src/retos/banco.js`                                | Retos, estructura base, criterios y variantes como datos                         | RF-08, RP-02                  |
| Controlador de retos | `src/retos/useControladorReto.js`                                  | Abre el reto, ejecuta, evalúa y coordina los demás módulos                       | RL-03, RL-04                  |
| Ejecución aislada    | `src/ejecucion/`                                                   | Ejecuta el código del estudiante en una página oculta                            | RF-02                         |
| Evaluador            | `src/evaluador/`                                                   | Comprueba criterios de estructura, estilos y eventos                             | RF-03                         |
| Retroalimentación    | `src/retroalimentacion/`                                           | Mensajes que explican la causa del error                                         | RF-04, RP-06                  |
| Progreso             | `src/progreso/`                                                    | Guardado local y código de continuación                                          | RF-09, RNF-08                 |
| Interfaz 2D          | `src/App.jsx`, `src/ui/`, `src/estilos/`                           | Inicio, HUD, ayuda y panel del reto, con teclado, foco y anuncios                | RF-01, RF-05, RNF-03 a RNF-05 |

## Modos del juego

1. Inicio: muestra los controles y espera a que cargue el campus.
2. Exploración: el jugador recorre el campus. Al acercarse a un punto `INT_` aparece un aviso que se activa con Enter, y los cambios de lugar se anuncian a los lectores de pantalla.
3. Reto: la cámara se fija frente al tablero del aula y el panel del reto ocupa un costado. Escape o el botón Volver al campus regresan a la exploración.
4. Conversación: la persona se detiene y mira al jugador, y un cuadro muestra sus frases. Escape o Terminar regresan a la exploración.

El robot asistente está en todos los modos. En la exploración vuela junto al jugador y en el reto se ubica junto al tablero. Sus mensajes pasan por una cola (`useAsistente`): cada uno dura según su largo o, con la voz activa, hasta que termina de hablar. Los consejos de exploración se anuncian a los lectores de pantalla; en el reto no, porque el panel ya muestra la teoría, la retroalimentación y las pistas.

## Flujo de un reto

1. El controlador toma el reto del banco y el panel muestra la teoría, la consigna y la estructura base. La vista previa muestra la cartelera y se actualiza mientras el estudiante escribe HTML o CSS.
2. El estudiante edita el código y pulsa Ejecutar.
3. La ejecución aislada arma la página con la base y el código del estudiante.
4. El evaluador revisa sobre esa página los criterios de la parte actual y de las anteriores.
5. La retroalimentación explica lo que falta, con un mensaje por grupo de criterios. Si la parte se supera, el panel muestra la siguiente; al superar la última, se guarda el progreso y la escena reacciona.
