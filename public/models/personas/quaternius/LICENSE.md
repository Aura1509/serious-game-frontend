# Personajes de Quaternius

Personajes de los paquetes Ultimate Modular Men y Ultimate Modular Women, de Quaternius (https://quaternius.com). Su autor los publica en dominio público con la licencia CC0 1.0 Universal (https://creativecommons.org/publicdomain/zero/1.0/).

Se descargaron en GLB desde Poly Pizza, donde el autor publica los mismos paquetes:

- https://poly.pizza/bundle/Ultimate-Modular-Men-Pack-ZiH8muWqwQ
- https://poly.pizza/bundle/Ultimate-Modular-Women-Pack-aCBDXDdTNN

En Poly Pizza el modelo Suit del paquete de mujeres aparece con licencia CC-BY 3.0, así que el proyecto atribuye todos los personajes a Quaternius en `CREDITOS.md`.

Cambios hechos para el juego:

- Se unieron las cuatro mallas de cada personaje en una sola, se suavizaron sus normales y se quitaron sus 24 animaciones. El juego usa las animaciones de captura de movimiento de Rocketbox.
- Los colores de los materiales pasaron a un atributo por vértice, para teñir la ropa, el pelo y la piel de cada personaje.
- Se quitaron los ojos y las cejas de bloque. En su lugar hay una malla sobre la cara, con coordenadas UV, donde el juego dibuja la cara.
- `jugadora`, `mujer_traje_largo`, `mujer_blusa_larga`, `hombre_traje_b` y `hombre_barba` combinan la cabeza de un personaje con el cuerpo de otro del mismo paquete.
