# Cómo contribuir

## Flujo de trabajo

1. Cada tarea es un **issue** de GitHub (reto nuevo, error o mejora) y pertenece a un **sprint** (milestone).
2. Se trabaja en una **rama** creada desde `main`:
   - `feat/reto-h1` para funcionalidades o retos nuevos
   - `fix/evaluador-estilos` para correcciones
   - `docs/manual-usuario` para documentación
3. Se abre un **pull request** hacia `main`. La integración continua debe pasar (lint, pruebas y compilación) antes de unir.
4. `main` siempre está publicable: cada unión se despliega automáticamente.

## Mensajes de commit

Se usa [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/), en español:

```
feat(retos): agrega el reto H2 de la receta del champús
fix(evaluador): compara colores en formato rgb
docs: actualiza el manual de usuario
test(progreso): cubre el código de continuación con todos los retos
chore: actualiza dependencias
```

Tipos: `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `chore`. El alcance entre paréntesis es el módulo: `escena`, `retos`, `ejecucion`, `evaluador`, `retroalimentacion`, `progreso`, `ui`.

## Versiones

Se sigue [versionado semántico](https://semver.org/lang/es/). Al cerrar cada sprint se crea una etiqueta (`v0.1.0`, `v0.2.0`…) y se actualiza `CHANGELOG.md`.

## Antes de abrir un pull request

- [ ] `npm run lint` y `npm test` pasan
- [ ] Si agregaste un reto, cumple `data/esquema-reto.json` y tiene mensajes para cada criterio
- [ ] Si cambiaste una decisión de diseño, quedó registrada en `docs/decisiones/`
