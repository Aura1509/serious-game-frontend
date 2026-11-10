# Cómo agregar un reto

1. Crea `data/retos/<edificio>/<ID>.json` con el ID de la matriz de retos (Tabla 12), por ejemplo `data/retos/css/C3.json`.
2. Sigue la estructura de `data/esquema-reto.json`. Los campos clave son:
   - `base`: la estructura que entrega el juego en `html`, `css` y `js` (RP-08).
   - `editable`: la capa que modifica el estudiante.
   - `partes`: los pasos del reto, en orden. Cada parte tiene su `teoria` (explicación previa del robot, RP-07), su `consigna` (lo que debe hacer el estudiante, en cinco oraciones o menos, RF-05 y RNF-06), sus `criterios` y un mensaje de `exito` opcional. Al superar una parte se muestra la siguiente, y se siguen revisando los criterios de las anteriores.
   - `criterios`: lo que debe cumplirse, cada uno con su `mensaje` de retroalimentación.
   - `ejemplo` (opcional): código `antes` y `despues` que el robot anima al final de la teoría (RP-07). Conviene que no sea la respuesta del reto.
   - `pistas` (opcional): pistas de la parte, de la más general a la respuesta exacta. Se desbloquea una por intento.
   - `solucion`: la solución esperada. La prueba del banco comprueba que la base no supera la primera parte y que la solución supera todas.
3. Tipos de criterio disponibles:

| Tipo         | Comprueba                                                                     | Campos                             |
| ------------ | ----------------------------------------------------------------------------- | ---------------------------------- |
| `existe`     | Que haya un elemento con ese selector                                         | `selector`                         |
| `no-existe`  | Que no haya un elemento con ese selector                                      | `selector`                         |
| `cantidad`   | Cuántos elementos coinciden                                                   | `selector`, `valor`                |
| `texto`      | Que el texto de un elemento contenga algo                                     | `selector`, `contiene`             |
| `estilo`     | El valor calculado de una propiedad CSS                                       | `selector`, `propiedad`, `valor`   |
| `contenedor` | El contenedor más cercano (article, section o div) del elemento con ese texto | `selector`, `contiene`, `etiqueta` |

4. Para no repetir mensajes, varios criterios pueden compartir un `grupo`: se revisan en orden y solo se muestra el mensaje del primero que falla. Así cada región o bloque recibe un solo mensaje.
5. Ejecuta `npm test`: la prueba del banco verifica que el reto esté completo.
6. Si un reto necesita un tipo de criterio nuevo, agrégalo en `src/evaluador/plantillas.js` con sus campos obligatorios y su prueba en `tests/evaluador.test.js`.
