# Modelos 3D

`campus.glb` es el campus exportado desde Blender en formato glTF binario. Su archivo fuente es `modelado/campus_univalle_laura.blend`. Los dos se guardan con Git LFS (ver `.gitattributes`).

## Cómo exportar

1. Abre el `.blend` en Blender 5.2, la versión con la que se guardó.
2. Deja fuera las colecciones `REFERENCIA` y `REVISION`, que son ayudas de modelado.
3. Exporta como glTF binario (`.glb`), con los modificadores aplicados y sin cámaras ni luces, en `public/models/campus.glb`.
4. No lo comprimas todavía: el cargador del juego aún no tiene configurados los decodificadores de Draco ni de Meshopt.

## Nombres que usa el código

| Nombre                                            | Uso en el juego                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `COL_`                                            | Colisiones: se ocultan y forman el colisionador del jugador.             |
| `WALK_`                                           | Superficies caminables: se ocultan y también forman el colisionador.     |
| `SPAWN_Jugador`                                   | Punto donde empieza el jugador.                                          |
| `INT_`                                            | Puntos de interacción: puertas, aulas, retos finales, atril y guía.      |
| `EDIFICIO_`                                       | Centro de cada edificio, para anunciar dónde está el jugador.            |
| `Rotulo_<EDIFICIO>_Tablero_A1` a `A3`             | Tableros de las aulas: la cámara se pone frente a ellos durante un reto. |
| `SCREEN_`                                         | Pantallas de los retos finales y de la cúpula.                           |
| `FLOAT_`, `SPIN_` y `PULSE_`                      | Objetos que flotan, giran o laten.                                       |
| `<EDIFICIO>_Puerta`                               | Puerta de doble hoja: se divide por la mitad y se abre al acercarse.     |
| `COL_<EDIFICIO>_Puerta`                           | Se ignora, para que se pueda entrar al edificio.                         |
| `Suelo`, `Plaza_Piso`, `Camino_`, `Anfiteatro_Grada`, `Plaza_Escalon_Rojo` | Reciben césped, losas o ladrillo al cargar (ver `src/escena/superficies.js`). |
| `Avatar`, `Avatar_armL`, `Avatar_armR`, `Avatar_legL`, `Avatar_legR` | Avatar anterior: se oculta y lo reemplaza un humano generado por código (`src/escena/humano.js`). |

Los demás objetos con `M_Paleta` conservan su color y reciben el relieve de una textura según su nombre y su orientación: muros, pisos, madera, metal o vidrio.

Mientras no exista `campus.glb`, la escena muestra un campus provisional generado por código.
