/**
 * Código de continuación (RF-09): resume en un texto corto qué retos se superaron,
 * sin datos personales, para seguir en otro equipo. Formato: UV<versión>-<4 caracteres>-<control>.
 */
export const RETOS = [
  'H1',
  'H2',
  'H3',
  'H4',
  'HF',
  'C1',
  'C2',
  'C3',
  'C4',
  'C5',
  'CF',
  'J1',
  'J2',
  'J3',
  'JF',
  'A1',
  'A2',
  'A3',
  'AF',
  'F1',
];
const VERSION = '1';

const control = (cuerpo) =>
  ([...cuerpo].reduce((suma, c) => suma + parseInt(c, 36), 0) % 36).toString(36).toUpperCase();

export function generarCodigo(superados) {
  let n = 0;
  RETOS.forEach((id, i) => {
    if (superados.includes(id)) n += 2 ** i;
  });
  const cuerpo = VERSION + n.toString(36).toUpperCase().padStart(4, '0');
  return `UV${cuerpo[0]}-${cuerpo.slice(1)}-${control(cuerpo)}`;
}

export function leerCodigo(codigo) {
  const coincide = /^UV([0-9A-Z])-([0-9A-Z]{4})-([0-9A-Z])$/.exec(String(codigo).trim().toUpperCase());
  if (!coincide) throw new Error('El código no tiene el formato esperado.');
  const [, version, numero, verificacion] = coincide;
  if (version !== VERSION) throw new Error('El código es de otra versión del juego.');
  if (control(version + numero) !== verificacion)
    throw new Error('Revisa el código: hay un carácter equivocado.');
  const n = parseInt(numero, 36);
  return RETOS.filter((_, i) => Math.floor(n / 2 ** i) % 2 === 1);
}
