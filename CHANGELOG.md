# Registro de cambios

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Agregado

- Prototipo jugable: inicio, exploración del campus con el avatar del modelado, colisiones y escaleras, cámara en tercera persona y entrada al reto H1 desde el aula 1 del edificio HTML.
- HUD accesible con objetivo, lugar, avisos de interacción, ayuda en un diálogo, botones para girar la cámara y anuncios para lectores de pantalla.
- Campus real exportado desde Blender, con su archivo fuente en `modelado/`.
- Ambientación del campus (decisión 0005):
  - Cielo con nubes, montañas al fondo, sol con sombras suaves y postprocesado con oclusión ambiental y brillo.
  - Texturas CC0 de césped, losas, ladrillo, pañete, terrazo y madera, que conservan los colores del modelado.
  - Samanes, guayacanes rosados, gualandayes, palmas, arbustos con flores, bancas y canecas.
  - Personas que caminan por los senderos, dos sentadas en bancas, una en silla de ruedas y otra con bastón blanco y gafas oscuras. La silla y el bastón se generan por código a escala real.
- Personajes low-poly de Quaternius para el avatar y las personas (decisión 0006): estudiantes con ropa casual y profesores con traje, en colores planos como el campus.
  - Se mueven con animaciones de captura de movimiento de Rocketbox adaptadas a su esqueleto: caminan, pasean, corren, se sientan, saludan y gesticulan al hablar.
  - Caras expresivas dibujadas en el navegador: ojos con iris, pupila y brillo, cejas que se mueven, pestañas, rubor y una boca que sonríe y se abre al hablar. Parpadean, y miran y saludan al jugador cuando pasa cerca.
  - Sombreado suave, sin las facetas cuadriculadas de los modelos originales.
  - Cada personaje tiñe su ropa, su pelo y su piel. Su cuerpo se dibuja en una sola llamada y su cara en otra.
- Profesores de Desarrollo de Software I, Desarrollo de Software II y Proyecto Integrador I en la plazoleta y frente a los edificios. Dan consejos de desarrollo para los retos y llevan su nombre y su curso sobre la cabeza. Los que tienen foto en la página de la EISC se parecen a ella: pelo, gafas, barba y ropa.
- El juego empieza antes de la entrada, a 11 m del arco, con estudiantes y bancas que indican ir a la plazoleta para hacer las actividades.
- Zona de estudio antes de la entrada: losas, cuatro mesas con sillas de colores, portátiles y cuadernos. Los estudiantes cuentan que están estudiando para los retos, que van en los primeros semestres o que acaban de empezar Ingeniería de Sistemas.
- Límite del campus a 140 m del centro. Al llegar, el robot propone volver a la plazoleta.
- Conversaciones: al acercarse a una persona aparece Hablar con su nombre. Enter abre un cuadro con sus frases, Siguiente avanza y Escape termina. Dan pistas del reto H1, de los caminos y del campus.
- Puertas que se abren al acercarse: ya se puede entrar a los cuatro edificios.
- Movimiento natural del avatar:
  - Acelera y frena de forma gradual, y gira hacia donde camina.
  - Mueve brazos y piernas al ritmo de la velocidad, con balanceo e inclinación.
  - Corre con Shift y baja escaleras sin pequeños saltos.
- Opciones en la ayuda: Correr siempre, Gráficos ligeros, Consejos del robot y Voz del robot. Si el rendimiento baja de 24 cuadros por segundo, el juego activa solo los gráficos ligeros y lo anuncia.
- `CREDITOS.md` con el origen y la licencia de las texturas y los personajes.
- Salto con Espacio, con un pequeño margen para saltar justo después de dejar un borde y una flexión al aterrizar.
- Cámara para interiores: choca con paredes, techos y pisos visibles, se acerca y baja bajo techo, y nunca atraviesa un muro. Dentro de los edificios una luz cálida sigue al jugador.
- Diálogos como viñetas de cómic sobre la cabeza de cada persona, y un aviso Espacio · Hablar cuando el jugador está cerca. Espacio o Enter abren la conversación.
- Robot asistente (RL-06), generado por código con figuras básicas como lo describe el Anexo B (B.5, Tabla B3):
  - Vuela al lado del jugador, se inclina al moverse, esquiva paredes y techos, y gira la cabeza hacia el estudiante.
  - Su cara es una pantalla con ojos verdes que parpadean, una boca que se mueve al hablar y expresiones de alegría, duda y preocupación.
  - Habla con viñetas que sirven de subtítulos y, si se activa en la ayuda, con la voz del navegador.
  - Da consejos: saluda al empezar, presenta cada edificio la primera vez, enseña los controles cuando el jugador se queda quieto y con R explica lo que hay cerca o señala el camino.
  - En el aula presenta la teoría por partes con un ejemplo animado (RP-07), explica la causa de cada error, da pistas graduales y celebra al superar el reto.
- Pistas graduales en los retos: tres por parte en H1, de la más general a la respuesta exacta, y se desbloquea una por intento.
- Campos opcionales `ejemplo` y `pistas` en las partes de cada reto.
- Retos en 3D:
  - La cartelera del estudiante se proyecta en vivo sobre el tablero del aula.
  - El robot asistente acompaña junto al tablero con viñetas y celebra con destellos al superar el reto.
  - El panel es una libreta flotante con pasos, tarjetas plegables y un editor con números de línea.
- Vegetación con follaje de tarjetas de hojas dibujadas en el navegador, sombras moteadas y viento.
- Pasto con hojas que se mueven con el viento alrededor del jugador, solo en el césped y solo con gráficos altos.
- Colinas con relieve, una cordillera al oeste con bruma, bosque en las laderas y otros edificios de la universidad al fondo.

- Segunda parte del reto H1: el estudiante decide si la noticia, la agenda y la fila de botones van en article, section o div.
- Tipo de criterio `contenedor` y campo `grupo`, para mostrar un solo mensaje por región o bloque.
- Consigna visible en el panel y vista previa que se actualiza mientras se escribe HTML o CSS.
- Campo `solucion` en los retos y pruebas que verifican la base, la solución y los errores frecuentes de H1.

### Cambiado

- La interfaz pasa a React 19 y la escena a React Three Fiber 9 con drei 10; three.js sube de 0.170 a 0.187 (decisión 0004).
- Las mallas estáticas del campus se unen por superficie al cargar, para reducir las llamadas de dibujo.
- Los botones del HUD devuelven el foco al campus cuando se pulsan con el ratón, y la ayuda empieza en su título.
- El avatar se vuelve transparente cuando la cámara queda muy cerca, por ejemplo dentro de un aula.
- Las superficies curvas del campus se sombrean suaves (normales con pliegue de 35 grados), sin perder las aristas de las cajas.

- Los retos se organizan en `partes`, cada una con su teoría, su consigna y sus criterios.
- La base de H1 es la cartelera completa armada solo con div, como la describe la Tabla 12.
- Los criterios de H1 comprueban también qué contenido quedó dentro de cada región.
- Reiniciar devuelve también la parte y la vista previa del reto a su estado inicial.

### Corregido

- El avatar ya no queda caminando en el aire después de bajar una colina.

### Eliminado

- `src/main.js`, `src/escena/campus.js`, `src/retos/controlador.js` y `src/ui/panel-reto.js`, reemplazados por componentes de React.

## [0.1.0] - 2026-11-03

### Agregado

- Estructura del proyecto con Vite y three.js.
- Módulos de la arquitectura: escena, banco y controlador de retos, ejecución aislada, evaluador por plantillas, retroalimentación, progreso y panel del reto.
- Reto H1 «De div a semántica» como primer reto del banco.
- Guardado local del progreso y código de continuación.
- Pruebas automáticas, integración continua y despliegue en GitHub Pages.
