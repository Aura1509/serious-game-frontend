# 0006. Personajes low-poly de Quaternius con animaciones de Rocketbox

- **Estado:** aceptada
- **Fecha:** 2026-11-08

## Contexto

El avatar y las personas del campus deben verse adecuados para un proyecto universitario, combinar con los colores planos del campus y moverse con naturalidad (RL-01). También tienen que mantener la meta de rendimiento (RNF-02) con unas veinte personas en escena.

Se probaron cuatro estilos antes de este:

- humanos generados por código: se veían artificiales;
- personajes de Kenney: se veían cuadrados;
- avatares realistas de Rocketbox: resultaban serios y poco agradables;
- personajes anime de VRoid: no parecían adecuados para la universidad, y con veinte personas el juego bajaba a unos 40 cuadros por segundo.

## Decisión

- **Modelos:** paquetes Ultimate Modular Men y Ultimate Modular Women de Quaternius, publicados en 2022 con licencia CC0.
  - Los estudiantes usan ropa casual y los profesores, traje.
  - Cinco modelos combinan la cabeza de un personaje con el cuerpo de otro del mismo paquete.
- **Conversión previa:** se hace una sola vez fuera del juego.
  - Las cuatro mallas de cada personaje se unen en una sola y se quitan sus animaciones.
  - Las normales se suavizan con un ángulo de pliegue de 55 grados, para quitar las facetas.
  - Los colores de los materiales pasan a un atributo por vértice.
  - Los ojos y las cejas de bloque se quitan. Sobre la piel de la cara queda una malla con coordenadas UV donde el juego dibuja la cara.
  - El resultado son once GLB de unos 300 kB cada uno.
- **Caras:** `src/escena/caras.js` dibuja en un lienzo de 256 píxeles los ojos, las cejas, la nariz, el rubor y la boca de cada personaje, con sus propios colores de iris, pestañas y barba.
  - El gesto (ojos abiertos, boca, sonrisa, cejas y mirada) se redondea en pocos pasos, y la cara se vuelve a dibujar solo cuando cambia.
  - Las personas a más de 30 m no actualizan su cara.
  - El estilo es de ilustración expresiva, con ojos grandes y brillo, pero es un diseño propio.
- **Profesores:** los tres que tienen foto en la página de la EISC (Paola Rodríguez, Carlos Gaona y Beatriz Florián) copian rasgos generales de ella: largo y color del pelo, gafas, barba y color de la ropa. Los otros cuatro no tienen foto publicada y tienen un aspecto genérico.
- **Animaciones:** las de captura de movimiento de Rocketbox (MIT), que ya usaba el juego.
  - `src/escena/elenco.js` las adapta al esqueleto de cada modelo con la rotación de cada hueso en el mundo, medida desde la pose en T de los dos esqueletos.
  - Los brazos y las piernas se alinean antes con una dirección fija; la columna, el cuello, la cabeza y las clavículas conservan la pose natural de cada modelo.
- **Variedad:** cada personaje tiñe su ropa, su pelo y su piel al crearse. Los cuerpos comparten la geometría y el material, así que cada personaje se dibuja en dos llamadas: una para el cuerpo y otra para la cara.

## Consecuencias

- El juego mantiene 60 cuadros por segundo con unas veinticinco personas en un equipo de escritorio, y la carga de personajes baja de 22 MB a 2,7 MB.
- Se quitaron la dependencia `@pixiv/three-vrm`, los modelos VRM, los avatares de Rocketbox y los objetos de Kenney.
- La licencia actual de Quaternius, la Quaternius Asset License v1.0 (28 de agosto de 2026), prohíbe redistribuir los modelos sueltos, aunque estén modificados. Su sección de cambios dice que una versión nueva no aplica a recursos obtenidos con una anterior, y la dedicación CC0 de 2022 es irrevocable. Para publicar el repositorio con los GLB sin ninguna duda, conviene confirmarlo con el autor.
- La silla de ruedas, el bastón y las gafas se generan por código, a escala real.
- `src/escena/humano.js` queda como respaldo si los personajes no cargan.
- Antes de publicar el juego conviene pedir permiso a los profesores, porque aparecen con su nombre, su parecido y consejos atribuidos a ellos.
