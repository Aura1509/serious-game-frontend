# Cómo agregar un reto

1. Crea `data/retos/<edificio>/<ID>.json` con el ID de la matriz de retos (Tabla 12), por ejemplo `data/retos/css/C3.json`.
2. Sigue la estructura de `data/esquema-reto.json`. Los campos clave son:
   - `teoria`: la explicación previa del robot (RP-07).
   - `base`: la estructura que entrega el juego en `html`, `css` y `js` (RP-08).
   - `editable`: la capa que modifica el estudiante.
   - `criterios`: lo que debe cumplirse, cada uno con su `mensaje` de retroalimentación.
3. Tipos de criterio disponibles:

| Tipo        | Comprueba                                 | Campos                           |
| ----------- | ----------------------------------------- | -------------------------------- |
| `existe`    | Que haya un elemento con ese selector     | `selector`                       |
| `no-existe` | Que no haya un elemento con ese selector  | `selector`                       |
| `cantidad`  | Cuántos elementos coinciden               | `selector`, `valor`              |
| `texto`     | Que el texto de un elemento contenga algo | `selector`, `contiene`           |
| `estilo`    | El valor calculado de una propiedad CSS   | `selector`, `propiedad`, `valor` |

4. Ejecuta `npm test`: la prueba del banco verifica que el reto esté completo.
5. Si un reto necesita un tipo de criterio nuevo, agrégalo en `src/evaluador/plantillas.js` con su prueba en `tests/evaluador.test.js`.
