/**
 * Banco de retos (RF-08). Cada reto es un archivo JSON en data/retos/<edificio>/<ID>.json,
 * con la estructura descrita en data/esquema-reto.json. Agregar un reto no exige cambiar código.
 */
const archivos = import.meta.glob('../../data/retos/**/*.json', { eager: true, import: 'default' });

const CAMPOS_OBLIGATORIOS = [
  'id',
  'edificio',
  'lugar',
  'titulo',
  'ra',
  'teoria',
  'base',
  'editable',
  'criterios',
];

export function validarReto(reto) {
  const faltan = CAMPOS_OBLIGATORIOS.filter((campo) => reto[campo] === undefined);
  if (faltan.length) return `Al reto ${reto.id ?? '(sin id)'} le faltan: ${faltan.join(', ')}`;
  if (!['html', 'css', 'js'].includes(reto.editable)) return `${reto.id}: «editable» debe ser html, css o js`;
  if (!Array.isArray(reto.criterios) || reto.criterios.length === 0)
    return `${reto.id}: necesita al menos un criterio`;
  return null;
}

export function cargarBanco() {
  const banco = new Map();
  for (const reto of Object.values(archivos)) {
    const error = validarReto(reto);
    if (error) throw new Error(error);
    if (banco.has(reto.id)) throw new Error(`Reto duplicado: ${reto.id}`);
    banco.set(reto.id, reto);
  }
  return banco;
}
