# 0001. Vite y three.js como base del prototipo

- **Estado:** reemplazada en parte por [0004](0004-react-y-react-three-fiber.md)
- **Fecha:** 2026-11-03

## Contexto

El anteproyecto fija three.js sobre WebGL (RT-01), estándares web para la interfaz (RT-02) y despliegue como sitio web (RT-04), sin backend (RT-05).

## Decisión

Se usa three.js con JavaScript estándar en módulos y Vite como empaquetador. Las versiones de las dependencias se fijan exactas en `package.json`.

## Consecuencias

- El resultado de `npm run build` es un sitio estático que se publica en GitHub Pages.
- three.js se empaqueta en un archivo propio para aprovechar la caché del navegador.
- Si más adelante se adopta React (por ejemplo, React Three Fiber), debe registrarse en una decisión nueva.
