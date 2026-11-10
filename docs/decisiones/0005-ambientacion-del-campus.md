# 0005. Ambientación del campus con texturas CC0, vegetación generada y postprocesado

- **Estado:** aceptada. La decisión 0006 reemplaza la parte de personas y avatar.
- **Fecha:** 2026-11-08

## Contexto

El campus del modelado usa una paleta de colores planos. Para que se parezca a la plazoleta de la Facultad de Ingeniería de Univalle, la escena necesita cielo, texturas reales, vegetación, mobiliario y gente. Además, se debe poder entrar a todos los edificios. Las metas de rendimiento son unos 30 cuadros por segundo en equipos de gama media (RNF-02) y la accesibilidad básica de WCAG 2.1 AA.

## Decisión

- **Texturas:** Poly Haven y ambientCG, en JPG de 1K y con licencia CC0. Al cargar, cada triángulo se clasifica por el nombre del objeto, su orientación y su color de la paleta (`src/escena/superficies.js`).
  - El césped, las losas y el ladrillo usan el color de la textura.
  - Muros, caminos, pisos y madera conservan el color de la paleta y toman de la textura el relieve, la aspereza y las variaciones.
  - Las UV se proyectan en metros, así que el modelado no necesita UV propias.
- **Ambiente:**
  - El cielo, las nubes, las montañas y el entorno de luz se generan con sombreadores.
  - El sol da sombras suaves que siguen al jugador.
  - El postprocesado usa `@react-three/postprocessing` con oclusión ambiental N8AO, brillo y SMAA.
- **Vegetación y mobiliario:** samanes, guayacanes rosados, gualandayes, palmas, arbustos, bancas y canecas se generan por código con instancias. Se ubican sobre un mapa de ocupación del campus (`src/escena/ocupacion.js`).
- **Personas y avatar:** son humanos generados por código (`src/escena/humano.js`) con esqueleto, cara dibujada, pelo y ropa. Así comparten estilo y no dependen de licencias de terceros.
  - Las personas siguen rutas calculadas con A\* sobre el mismo mapa, y se puede conversar con ellas.
  - Una persona usa silla de ruedas y otra, bastón; esos dos objetos son CC0 de Kenney.
- **Edificios:**
  - Las puertas se abren solas al acercarse.
  - Se ignoran las colisiones `COL_<EDIFICIO>_Puerta`.
- **Calidad:**
  - La opción Gráficos ligeros quita el postprocesado, reduce la sombra y la resolución, y deja menos personas.
  - El juego la activa solo si el rendimiento baja de 24 cuadros por segundo.

## Consecuencias

- El repositorio crece unos 16 MB: 14 MB de texturas y 2 MB de personas. El modelado y los GLB siguen en Git LFS.
- Las animaciones decorativas (nubes, viento, personas, puertas y avatar) se detienen con Pausar animaciones o con la preferencia de movimiento reducido del sistema.
- Las licencias y la autoría quedan en `CREDITOS.md`.
- Hay que ignorar estas fuentes, por licencia: Quaternius, Mixamo y los presets de drei que dependen de una CDN.
- La opción `halfRes` de N8AO no funciona con three.js 0.187: su render target de varias texturas usa una API anterior. Se usa la resolución completa con menos muestras.
