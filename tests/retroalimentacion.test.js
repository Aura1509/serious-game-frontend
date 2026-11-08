import { describe, expect, it } from 'vitest';
import { componerRetroalimentacion } from '../src/retroalimentacion/mensajes.js';

const fallo = (mensaje, grupo) => ({ criterio: { mensaje, grupo }, cumple: false });

describe('retroalimentación', () => {
  it('muestra solo el primer mensaje que falla en cada grupo', () => {
    const resultado = {
      aprobado: false,
      resultados: [
        fallo('a', 'nav'),
        fallo('b', 'nav'),
        fallo('c'),
        { criterio: { mensaje: 'd' }, cumple: true },
      ],
    };
    expect(componerRetroalimentacion(resultado).mensajes).toEqual(['a', 'c']);
  });

  it('prioriza los errores del código y usa el mensaje de éxito de la parte', () => {
    const aprobado = { aprobado: true, resultados: [] };
    expect(componerRetroalimentacion(aprobado, ['x is not defined']).mensajes[0]).toMatch(/se detuvo/);
    expect(componerRetroalimentacion(aprobado, [], 'Parte superada.').mensajes).toEqual(['Parte superada.']);
  });
});
