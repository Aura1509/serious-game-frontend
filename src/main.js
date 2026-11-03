import { crearEscena } from './escena/campus.js';
import { cargarBanco } from './retos/banco.js';
import { crearControlador } from './retos/controlador.js';
import { crearPanel } from './ui/panel-reto.js';
import { cargarProgreso } from './progreso/guardado.js';

const escena = crearEscena(document.getElementById('lienzo'));
const banco = cargarBanco();
const progreso = cargarProgreso();
const panel = crearPanel(document);
const controlador = crearControlador({
  banco,
  progreso,
  panel,
  escena,
  vistaPrevia: document.getElementById('vista-previa'),
});

controlador.abrirReto('H1');
