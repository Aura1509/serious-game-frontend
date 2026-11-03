/**
 * Ejecución aislada del código del estudiante en una página oculta (iframe).
 * Un error del estudiante no rompe la escena del juego.
 *
 * Pendiente (ver docs/decisiones/0002-ejecucion-aislada.md): un ciclo infinito síncrono
 * bloquea el hilo y el límite de tiempo no alcanza a cortarlo; hace falta protección de ciclos.
 */
export const LIMITE_MS = 2000;

const seguro = (codigo) => String(codigo).replace(/<\/script/gi, '<\\/script');

export function construirDocumento({ html = '', css = '', js = '' }) {
  return (
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${css}</style></head><body>${html}` +
    `<script>window.__errores=[];addEventListener('error',function(e){__errores.push(e.message)});</script>` +
    (js ? `<script>${seguro(js)}\n</script>` : '') +
    '</body></html>'
  );
}

export function ejecutarEnSandbox(iframe, codigo) {
  return new Promise((resolve, reject) => {
    const temporizador = setTimeout(() => reject(new Error('La ejecución tardó demasiado.')), LIMITE_MS);
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.onload = () => {
      clearTimeout(temporizador);
      const ventana = iframe.contentWindow;
      resolve({ documento: iframe.contentDocument, ventana, errores: ventana.__errores ?? [] });
    };
    iframe.srcdoc = construirDocumento(codigo);
  });
}
