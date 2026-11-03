# Serious game Web 3D para el aprendizaje del desarrollo frontend

Prototipo de un serious game que se ejecuta en el navegador y apoya el aprendizaje de la integración básica de **HTML, CSS y JavaScript**, y la revisión crítica del código que sugieren las herramientas de IA generativa. El estudiante recorre un campus 3D inspirado en la plazoleta de la Facultad de Ingeniería y construye, edificio por edificio, la cartelera web de la Facultad.

Trabajo de grado de **Laura Isabel Salazar Bueno**, Escuela de Ingeniería de Sistemas y Computación, Universidad del Valle.
Director: Fabian Stiven Valencia Córdoba. Codirectores: Paola Johanna Rodríguez Carrillo y Javier Mauricio Reyes Vera.

- **Prototipo publicado:** _enlace de GitHub Pages cuando se active el despliegue_
- **Estado:** en desarrollo (objetivo específico 2)

## Requisitos

- Node.js 20 o superior (ver `.nvmrc`)
- Git y [Git LFS](https://git-lfs.com/) para el modelado 3D
- Navegador de escritorio actual: Chrome, Firefox o Edge (RNF-01)

## Instalación y uso

```bash
git lfs install
git clone <url-del-repositorio>
cd serious-game-frontend
npm install
npm run dev        # servidor local con recarga automática
```

| Comando           | Qué hace                                      |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Inicia el servidor de desarrollo              |
| `npm run build`   | Genera la versión publicable en `dist/`       |
| `npm run preview` | Sirve localmente la versión de `dist/`        |
| `npm test`        | Ejecuta las pruebas automáticas               |
| `npm run lint`    | Revisa el estilo y errores comunes del código |
| `npm run format`  | Da formato a todo el código                   |

## Estructura del proyecto

```
├── data/
│   ├── esquema-reto.json        Estructura que debe tener cada reto
│   └── retos/<edificio>/<ID>.json   Banco de retos (teoría, base, criterios, variantes)
├── docs/                        Documentación técnica y decisiones de diseño
├── public/models/               Modelado del campus en .glb (Git LFS)
├── src/
│   ├── escena/                  Escena 3D con three.js (campus, cámara, animaciones)
│   ├── retos/                   Banco de retos y controlador
│   ├── ejecucion/               Ejecución aislada del código del estudiante
│   ├── evaluador/               Evaluador basado en plantillas
│   ├── retroalimentacion/       Mensajes y pistas
│   ├── progreso/                Guardado local y código de continuación
│   ├── ui/                      Panel del reto y editor
│   ├── estilos/                 Estilos de la interfaz 2D
│   └── main.js                  Punto de entrada
├── tests/                       Pruebas automáticas (Vitest)
└── .github/                     Integración continua, despliegue y plantillas
```

Los módulos siguen la arquitectura del documento de grado (Anexo B, Figura B3) y el requerimiento RNF-07. El detalle está en [docs/arquitectura.md](docs/arquitectura.md).

## Documentación

- [Arquitectura](docs/arquitectura.md)
- [Cómo agregar un reto](docs/como-agregar-un-reto.md)
- [Despliegue](docs/despliegue.md)
- [Decisiones de diseño](docs/decisiones/)
- [Manual breve de usuario](docs/manual-usuario.md) (borrador)
- [Cómo contribuir](CONTRIBUTING.md) y [registro de cambios](CHANGELOG.md)

## Privacidad

El juego no pide datos personales ni usa cuentas de usuario. El progreso se guarda solo en el navegador del estudiante (RNF-08 y RF-09), y el prototipo no se conecta a servidores propios ni a modelos de lenguaje (RT-05).

## Licencia

Pendiente de definir con la dirección del trabajo de grado, conforme al Estatuto de Propiedad Intelectual de la Universidad del Valle. Mientras tanto, todos los derechos están reservados.
