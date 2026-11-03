# Despliegue

El prototipo se publica en **GitHub Pages** mediante GitHub Actions (RT-04).

## Primera vez

1. En el repositorio de GitHub, ve a **Settings → Pages**.
2. En **Source**, elige **GitHub Actions**.
3. Haz un push a `main`: el flujo `.github/workflows/deploy.yml` compila y publica el sitio.
4. El enlace aparece en **Settings → Pages** y en la pestaña **Actions**. Cópialo en el README.

## Cada cambio

Cada unión a `main` vuelve a publicar el sitio automáticamente. El flujo descarga los archivos de Git LFS (`lfs: true`), porque GitHub Pages no sirve los punteros de LFS.

## Comprobar antes de publicar

```bash
npm run build
npm run preview
```
