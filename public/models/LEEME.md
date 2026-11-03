# Modelos 3D

Aquí va el modelado del campus exportado desde Blender en formato **glTF binario (.glb)**, por ejemplo `campus.glb`.

- Los archivos `.glb` se guardan con **Git LFS** (ver `.gitattributes`).
- Antes de subirlo, compríme el modelo (por ejemplo con `npx @gltf-transform/cli optimize campus.glb campus.glb`).
- Nombra en Blender los objetos que el código debe encontrar: `pantalla_*`, `silla_*`, `puerta_*`, `casillero_*`.

Mientras no exista `campus.glb`, la escena muestra un campus provisional generado por código.
