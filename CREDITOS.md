# Créditos de recursos

Los recursos de terceros del juego tienen licencias libres: CC0 (dominio público), CC-BY o MIT. Aquí se registran su origen, su autoría y su licencia.

## Texturas (`public/texturas/`)

Mapas en JPG de 1K. De Poly Haven: color (`diff`), normal en formato OpenGL (`nor_gl`) y ARM (oclusión, aspereza y metal).

| Carpeta              | Uso en el campus                     | Origen                                                   | Autoría                            | Tamaño real |
| -------------------- | ------------------------------------ | -------------------------------------------------------- | ---------------------------------- | ----------- |
| `red_brick`          | Fachadas de ladrillo                 | [Poly Haven](https://polyhaven.com/a/red_brick)          | Rob Tuytel                         | 1,4 m       |
| `beige_wall_001`     | Relieve de muros pintados y concreto | [Poly Haven](https://polyhaven.com/a/beige_wall_001)     | Dimitrios Savva y Rico Cilliers    | 3 m         |
| `concrete_tiles_02`  | Losas de la plaza y de los caminos   | [Poly Haven](https://polyhaven.com/a/concrete_tiles_02)  | Charlotte Baglioni                 | 1,8 m       |
| `short_bricks_floor` | Gradas y escalones de ladrillo       | [Poly Haven](https://polyhaven.com/a/short_bricks_floor) | Dimitrios Savva                    | 1,9 m       |
| `terrazzo_tiles`     | Pisos interiores                     | [Poly Haven](https://polyhaven.com/a/terrazzo_tiles)     | Amal Kumar                         | 2 m         |
| `laminate_floor_02`  | Madera de pupitres, puertas y bancas | [Poly Haven](https://polyhaven.com/a/laminate_floor_02)  | Dario Barresi y Charlotte Baglioni | 1,7 m       |
| `Grass004`           | Césped (solo color y aspereza)       | [ambientCG](https://ambientcg.com/view?id=Grass004)      | ambientCG                          | 1,6 m       |

Descargados el 2026-11-08 desde la API de Poly Haven y desde ambientCG.

## Personas (`public/models/personas/`)

- **Personajes (`quaternius/`):** paquetes Ultimate Modular Men y Ultimate Modular Women de [Quaternius](https://quaternius.com), publicados en 2022 con licencia CC0. Se descargaron el 2026-11-08 en GLB desde Poly Pizza, donde los publica el autor ([hombres](https://poly.pizza/bundle/Ultimate-Modular-Men-Pack-ZiH8muWqwQ) y [mujeres](https://poly.pizza/bundle/Ultimate-Modular-Women-Pack-aCBDXDdTNN)). Allí el modelo Suit aparece con CC-BY 3.0, por eso se atribuye su autoría. Los cambios hechos para el juego están en `public/models/personas/quaternius/LICENSE.md`.
- **Animaciones (`rocketbox/`):** captura de movimiento de [Microsoft Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox), con licencia MIT (`public/models/personas/rocketbox/LICENSE.md`). Se convirtieron a GLB sin desplazamiento, y el juego las adapta al esqueleto de cada personaje (`src/escena/elenco.js`).

## Generado por código

El cielo, las nubes, las montañas del fondo, los árboles (samán, guayacán rosado, gualanday y palmas), los arbustos, las bancas y las canecas se generan en el juego, sin archivos externos. También la silla de ruedas, el bastón blanco y las gafas (`src/escena/ayudas.js` y `src/escena/personajes.js`), las mesas, sillas, portátiles y cuadernos de la zona de estudio (`src/escena/paisaje.js`) y las caras de los personajes (`src/escena/caras.js`). Si los personajes no cargan, el juego usa humanos generados por código (`src/escena/humano.js`). El robot asistente es un diseño propio hecho con figuras básicas, y su cara se dibuja con un shader (`src/escena/robot.js`).

## Descartados

- Quaternius, salvo los paquetes Ultimate Modular de 2022: su licencia actual, la Quaternius Asset License v1.0 (28 de agosto de 2026), prohíbe redistribuir los modelos sueltos. Esa misma licencia dice que sus cambios no aplican a recursos obtenidos con una versión anterior, y la dedicación CC0 de 2022 es irrevocable.
- Mixamo: su licencia prohíbe distribuir los archivos de personajes y animaciones.
