import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { cargarBanco } from './retos/banco.js';
import { cargarProgreso } from './progreso/guardado.js';
import { consejoDeLugar, consejoDeZona, consejoPedido, saludo, siguienteConsejo } from './asistente/guion.js';
import { useAsistente } from './asistente/useAsistente.js';
import { describirInteraccion } from './escena/interacciones.js';
import { useTeclado } from './escena/useTeclado.js';
import {
  guardarPausaAnimaciones,
  guardarPreferencia,
  leerPausaAnimaciones,
  leerPreferencia,
} from './ui/preferencias.js';
import { useReducirMovimiento } from './ui/useReducirMovimiento.js';
import Escena from './escena/Escena.jsx';
import Ayuda from './ui/Ayuda.jsx';
import Hud from './ui/Hud.jsx';
import Inicio from './ui/Inicio.jsx';
import PanelReto from './ui/PanelReto.jsx';

const banco = cargarBanco();
const progreso = cargarProgreso();
const ESCRIBIENDO = 'input, textarea, select, [contenteditable="true"]';
const OPCIONES = {
  correr: 'correr-siempre',
  ligera: 'graficos-ligeros',
  consejos: 'consejos-del-robot',
  voz: 'voz-del-robot',
};
const ESPERA_CONSEJO = 25000;
const ESPERA_BORDE = 20000;

const leerOpciones = () => ({
  correr: leerPreferencia(OPCIONES.correr),
  ligera: leerPreferencia(OPCIONES.ligera),
  consejos: leerPreferencia(OPCIONES.consejos, undefined, true),
  voz: leerPreferencia(OPCIONES.voz),
});

export default function App() {
  const [modo, setModo] = useState('inicio');
  const [cercano, setCercano] = useState(null);
  const [zona, setZona] = useState(null);
  const [activo, setActivo] = useState(null);
  const [linea, setLinea] = useState(0);
  const [ayuda, setAyuda] = useState(false);
  const [anuncio, setAnuncio] = useState('');
  const [destello, setDestello] = useState(false);
  const [fiesta, setFiesta] = useState(false);
  const marcoTablero = useRef(null);
  const vistos = useRef(new Set());
  const ultimoBorde = useRef(0);
  const [superados, setSuperados] = useState(() => progreso.superados());
  const [pausa, setPausa] = useState(leerPausaAnimaciones);
  const [opciones, setOpciones] = useState(leerOpciones);
  const [ajusteManual, setAjusteManual] = useState(false);
  const juego = useRef(null);
  const giro = useRef(0);
  const teclas = useTeclado(juego, modo === 'explorar' && !ayuda);
  const prefiereReducir = useReducirMovimiento();
  const reducirMovimiento = prefiereReducir || pausa;
  const { active: cargando, progress: porcentaje } = useProgress();
  const asistente = useAsistente({ voz: opciones.voz });
  const { decir, callar } = asistente;

  const h1Superado = superados.includes('H1');
  const objetivo = h1Superado
    ? 'Superaste el reto H1. Los demás retos llegarán en los próximos sprints; puedes seguir explorando.'
    : 'Ve al edificio HTML, a la izquierda de la plaza, y entra al aula 1 para el reto H1.';
  const infoCercano = cercano ? describirInteraccion(cercano) : null;
  const infoActivo = activo ? describirInteraccion(activo) : null;

  function enfocarJuego() {
    requestAnimationFrame(() => juego.current?.focus());
  }

  function empezar() {
    setModo('explorar');
    setAnuncio('Empezaste en la entrada del campus. La plaza central está al frente.');
    if (opciones.consejos) decir(saludo(h1Superado));
    enfocarJuego();
  }

  function interactuar(nombre) {
    const info = describirInteraccion(nombre);
    if (info.tipo === 'reto') {
      callar();
      setActivo(nombre);
      setModo('reto');
    } else if (info.tipo === 'charla') {
      callar();
      setActivo(nombre);
      setLinea(0);
      setModo('charla');
    } else if (info.tipo === 'ayuda') {
      setAyuda(true);
    } else {
      setAnuncio(info.aviso);
    }
  }

  function pedirConsejo() {
    decir(consejoPedido({ info: infoCercano, superado: h1Superado }));
  }

  function salirDelReto() {
    callar();
    setModo('explorar');
    setActivo(null);
    setAnuncio('Volviste al campus.');
    enfocarJuego();
  }

  function terminarCharla() {
    const persona = infoActivo?.persona;
    setModo('explorar');
    setActivo(null);
    setAnuncio(persona ? `Terminaste la conversación con ${persona.nombre}.` : 'Volviste al campus.');
    enfocarJuego();
  }

  function celebrar() {
    setDestello(true);
    setTimeout(() => setDestello(false), 600);
    setFiesta(true);
    setTimeout(() => setFiesta(false), 3500);
    decir({
      texto: '¡Lo lograste! Superaste el reto. Tu cartelera ya cuenta qué es cada parte.',
      expresion: 'feliz',
      etiqueta: 'Reto superado',
    });
    setSuperados(progreso.superados());
    setAnuncio('Reto superado. Pulsa Volver al campus para seguir explorando.');
  }

  function recordar(clave, mensaje) {
    if (!mensaje || !opciones.consejos || modo !== 'explorar' || vistos.current.has(clave)) return;
    vistos.current.add(clave);
    decir(mensaje, { reemplazar: false });
  }

  function cambiarCercano(nombre) {
    setCercano(nombre);
    if (nombre) {
      const info = describirInteraccion(nombre);
      setAnuncio(`${info.lugar}. Pulsa Enter para: ${info.accion}.`);
      recordar(info.tipo === 'charla' ? 'lugar:persona' : `lugar:${nombre}`, consejoDeLugar(info));
    }
  }

  function cambiarZona(nombre) {
    setZona(nombre);
    if (nombre) {
      setAnuncio(`Estás en ${nombre}.`);
      recordar(`zona:${nombre}`, consejoDeZona(nombre, h1Superado));
    }
  }

  function llegarAlBorde() {
    const ahora = Date.now();
    if (ahora - ultimoBorde.current < ESPERA_BORDE) return;
    ultimoBorde.current = ahora;
    decir({
      texto: 'Hasta aquí llega el campus. Volvamos a la plazoleta: allá están los profesores y los retos.',
      expresion: 'pensar',
      anunciar: true,
    });
  }

  function alternarPausa() {
    setPausa(!pausa);
    guardarPausaAnimaciones(!pausa);
  }

  function cambiarOpcion(nombre, valor) {
    setOpciones((actuales) => ({ ...actuales, [nombre]: valor }));
    guardarPreferencia(OPCIONES[nombre], valor);
    setAjusteManual(true);
    if (nombre === 'voz' && valor) {
      decir({ texto: 'Así suena mi voz. Puedes apagarla aquí mismo cuando quieras.', voz: true });
    }
  }

  function aligerar() {
    setOpciones((actuales) => ({ ...actuales, ligera: true }));
    setAnuncio(
      'Activé los gráficos ligeros porque el campus iba lento. Puedes cambiarlo en Ayuda y opciones.',
    );
    decir({
      texto:
        'El campus iba lento, así que activé los gráficos ligeros. Puedes cambiarlo en Ayuda y opciones.',
      expresion: 'pensar',
    });
  }

  function alTeclaEnJuego(evento) {
    if (modo !== 'explorar') return;
    const hablar = evento.code === 'Space' && cercano?.startsWith('PERSONA_');
    if ((evento.key === 'Enter' || hablar) && cercano) {
      evento.preventDefault();
      interactuar(cercano);
    } else if (evento.code === 'KeyH') {
      setAyuda(true);
    } else if (evento.code === 'KeyR' && !evento.repeat) {
      pedirConsejo();
    }
  }

  const alTecla = useEffectEvent((evento) => {
    if (evento.key !== 'Escape' || ayuda) return;
    if (modo === 'charla') {
      terminarCharla();
      return;
    }
    if (modo !== 'reto' || evento.target.closest?.(ESCRIBIENDO)) return;
    salirDelReto();
  });

  const darConsejo = useEffectEvent(() => {
    const consejo = siguienteConsejo(vistos.current, opciones);
    if (!consejo) return;
    vistos.current.add(consejo.id);
    decir(consejo, { reemplazar: false });
  });

  useEffect(() => {
    const escuchar = (evento) => alTecla(evento);
    window.addEventListener('keydown', escuchar);
    return () => window.removeEventListener('keydown', escuchar);
  }, []);

  const callado = !asistente.mensaje;
  useEffect(() => {
    if (modo !== 'explorar' || ayuda || !opciones.consejos || !callado) return undefined;
    const reloj = setTimeout(darConsejo, ESPERA_CONSEJO);
    return () => clearTimeout(reloj);
  }, [modo, ayuda, opciones.consejos, callado]);

  return (
    <div className={modo === 'reto' ? 'app en-reto' : 'app'}>
      <main className="zona-juego">
        <div
          ref={juego}
          className="juego"
          tabIndex={0}
          role="application"
          aria-label="Campus 3D de la Facultad de Ingeniería"
          aria-describedby="instrucciones-juego"
          onKeyDown={alTeclaEnJuego}
          onPointerDown={() => juego.current?.focus()}
        >
          <Escena
            alBajoRendimiento={modo === 'explorar' && !opciones.ligera && !ajusteManual ? aligerar : null}
            modo={modo}
            activo={activo}
            charla={
              modo === 'charla' && activo
                ? {
                    id: Number(activo.split('_')[1]),
                    linea,
                    alSiguiente: () => setLinea(linea + 1),
                    alTerminar: terminarCharla,
                  }
                : null
            }
            cercana={
              modo === 'explorar' && cercano?.startsWith('PERSONA_') ? Number(cercano.split('_')[1]) : null
            }
            objetivo={h1Superado ? null : 'INT_HTML_Aula_A1'}
            teclas={teclas}
            giro={giro}
            correr={opciones.correr}
            ligera={opciones.ligera}
            reducirMovimiento={reducirMovimiento}
            marcoTablero={marcoTablero}
            robot={modo === 'charla' ? null : asistente.mensaje}
            celebrar={fiesta}
            alCambiarCercano={cambiarCercano}
            alCambiarZona={cambiarZona}
            alLlegarAlBorde={llegarAlBorde}
          />
        </div>
        {modo === 'reto' && infoActivo && (
          <PanelReto
            key={infoActivo.reto}
            reto={banco.get(infoActivo.reto)}
            progreso={progreso}
            marcoTablero={marcoTablero}
            alRobot={decir}
            alSuperar={celebrar}
            alSalir={salirDelReto}
          />
        )}
        {destello && <div className="destello" aria-hidden="true" />}
        <p id="instrucciones-juego" className="visually-hidden">
          Con el foco en el campus, muévete con W A S D o las flechas, corre manteniendo Shift, salta con
          Espacio (junto a una persona, Espacio o Enter abren la conversación), gira la cámara con Q y E,
          interactúa con Enter, pide un consejo al robot con R y abre la ayuda y las opciones con H.
        </p>
        {modo === 'explorar' && (
          <Hud
            zona={zona}
            objetivo={objetivo}
            accion={infoCercano?.accion}
            alInteractuar={() => interactuar(cercano)}
            alAyuda={() => setAyuda(true)}
            alPedirConsejo={pedirConsejo}
            alVolverAlJuego={enfocarJuego}
            pausa={reducirMovimiento}
            pausaDelSistema={prefiereReducir}
            alAlternarPausa={alternarPausa}
            alGirar={(sentido) => {
              giro.current += sentido;
            }}
          />
        )}
        {modo === 'inicio' && (
          <Inicio cargando={cargando} porcentaje={porcentaje} superados={superados} alEmpezar={empezar} />
        )}
      </main>
      <Ayuda
        abierta={ayuda}
        alCerrar={() => setAyuda(false)}
        opciones={opciones}
        alCambiarOpcion={cambiarOpcion}
      />
      <p className="visually-hidden" aria-live="polite">
        {anuncio}
      </p>
      <p className="visually-hidden" aria-live="polite">
        {asistente.mensaje?.anunciar ? `El robot dice: ${asistente.mensaje.texto}` : ''}
      </p>
    </div>
  );
}
