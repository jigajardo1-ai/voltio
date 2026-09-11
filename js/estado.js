// estado.js — progreso del usuario: XP, racha, lecciones completadas, vidas.
// Todo se persiste en localStorage, que puede fallar (modo privado, cookies
// bloqueadas), asi que cada acceso va envuelto.

const CLAVE = 'voltio.progreso.v1';

const INICIAL = {
  xp: 0,
  racha: 0,
  ultimoDia: null,      // 'YYYY-MM-DD' del ultimo dia con actividad
  completadas: {},      // { 'f-ohm': { estrellas: 3, mejorXp: 40 } }
  vidas: 5,
  vidasRecarga: null,   // timestamp de la ultima recarga
};

/**
 * Si el navegador bloquea el almacenamiento (incognito, cookies bloqueadas), el
 * progreso se pierde al cerrar. Antes fallaba en silencio; ahora se comprueba
 * de verdad —escribiendo— para poder avisarlo en pantalla.
 */
function probarAlmacenamiento() {
  try {
    const k = '__voltio_prueba__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch { return false; }
}

export const hayAlmacenamiento = probarAlmacenamiento();

/** Se pone en true si una escritura falla despues del arranque (cuota llena). */
let escrituraFallida = false;
export const guardadoSano = () => hayAlmacenamiento && !escrituraFallida;

function leerCrudo() {
  try {
    const txt = localStorage.getItem(CLAVE);
    return txt ? JSON.parse(txt) : null;
  } catch { return null; }
}

function escribirCrudo(obj) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(obj));
    escrituraFallida = false;
  } catch {
    escrituraFallida = true;
  }
}

export const estado = Object.assign({}, INICIAL, leerCrudo() || {});

// Los objetos anidados hay que fusionarlos aparte, el assign es superficial.
estado.completadas = Object.assign({}, INICIAL.completadas, estado.completadas || {});

const oyentes = new Set();
export function suscribir(fn) { oyentes.add(fn); return () => oyentes.delete(fn); }
function avisar() { escribirCrudo(estado); oyentes.forEach((fn) => fn(estado)); }

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function diasEntre(isoA, isoB) {
  const a = new Date(isoA + 'T00:00:00');
  const b = new Date(isoB + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

/** Marca actividad de hoy y actualiza la racha. Devuelve true si la racha subio. */
export function tocarRacha() {
  const hoy = hoyISO();
  if (estado.ultimoDia === hoy) return false;
  const salto = estado.ultimoDia ? diasEntre(estado.ultimoDia, hoy) : Infinity;
  estado.racha = salto === 1 ? estado.racha + 1 : 1;
  estado.ultimoDia = hoy;
  avisar();
  return true;
}

/** La racha mostrada muere sola si el usuario no volvio ni ayer ni hoy. */
export function rachaVigente() {
  if (!estado.ultimoDia) return 0;
  const salto = diasEntre(estado.ultimoDia, hoyISO());
  return salto <= 1 ? estado.racha : 0;
}

export function sumarXp(n) {
  estado.xp += n;
  avisar();
}

/** Las vidas se recargan de a una cada 20 minutos, hasta 5. */
const MS_POR_VIDA = 20 * 60 * 1000;
export function sincronizarVidas() {
  if (estado.vidas >= 5) { estado.vidasRecarga = null; return estado.vidas; }
  const ahora = Date.now();
  if (!estado.vidasRecarga) { estado.vidasRecarga = ahora; avisar(); return estado.vidas; }
  const ganadas = Math.floor((ahora - estado.vidasRecarga) / MS_POR_VIDA);
  if (ganadas > 0) {
    estado.vidas = Math.min(5, estado.vidas + ganadas);
    estado.vidasRecarga = estado.vidas >= 5 ? null : estado.vidasRecarga + ganadas * MS_POR_VIDA;
    avisar();
  }
  return estado.vidas;
}

export function perderVida() {
  sincronizarVidas();
  if (estado.vidas > 0) {
    estado.vidas -= 1;
    if (estado.vidas < 5 && !estado.vidasRecarga) estado.vidasRecarga = Date.now();
    avisar();
  }
  return estado.vidas;
}

export function rellenarVidas() {
  estado.vidas = 5;
  estado.vidasRecarga = null;
  avisar();
}

export function completarLeccion(id, { estrellas, xp }) {
  const previo = estado.completadas[id];
  estado.completadas[id] = {
    estrellas: Math.max(estrellas, previo?.estrellas ?? 0),
    mejorXp: Math.max(xp, previo?.mejorXp ?? 0),
  };
  estado.xp += xp;
  tocarRacha();
  avisar();
  return !previo;   // true si es la primera vez que la completa
}

export function estaCompletada(id) { return Boolean(estado.completadas[id]); }
export function estrellasDe(id) { return estado.completadas[id]?.estrellas ?? 0; }

export function reiniciarTodo() {
  Object.assign(estado, INICIAL, { completadas: {} });
  avisar();
}

// ── Respaldo portatil ───────────────────────────────────────────────────────
//
// Sin cuenta ni servidor, la unica forma de que el progreso sobreviva a un
// "limpiar datos de navegacion" —o llegue a otro dispositivo— es que el usuario
// se lo pueda llevar. Se exporta en dos formatos: un archivo .json legible y un
// codigo de texto que cabe en un mensaje.

const FORMATO = 1;

/** Solo lo que vale la pena conservar: las vidas se regeneran solas. */
function instantanea() {
  return {
    formato: FORMATO,
    app: 'voltio',
    creado: new Date().toISOString(),
    datos: {
      xp: estado.xp,
      racha: estado.racha,
      ultimoDia: estado.ultimoDia,
      completadas: estado.completadas,
    },
  };
}

export function exportarJSON() {
  return JSON.stringify(instantanea(), null, 2);
}

/** Base64 con paso por UTF-8: el JSON lleva acentos y btoa solo acepta latin1. */
export function exportarCodigo() {
  const bytes = new TextEncoder().encode(JSON.stringify(instantanea()));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return `VOLTIO-${btoa(bin).replace(/=+$/, '')}`;
}

function decodificar(texto) {
  const limpio = String(texto).trim();
  if (!limpio) throw new Error('No pegaste nada.');

  // Acepta indistintamente el archivo .json y el codigo corto.
  if (limpio.startsWith('{')) return JSON.parse(limpio);

  const cuerpo = limpio.replace(/^VOLTIO-/, '').replace(/\s+/g, '');
  const relleno = cuerpo + '='.repeat((4 - (cuerpo.length % 4)) % 4);
  const bin = atob(relleno);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/**
 * Restaura un respaldo. `fusionar` conserva lo mejor de cada lado, que es lo
 * sensato al traer progreso de otro dispositivo: nadie quiere perder estrellas
 * por importar un respaldo viejo.
 */
export function importar(texto, { fusionar = true } = {}) {
  // Fuera del try: si no, el mensaje util queda tapado por el generico.
  if (!String(texto ?? '').trim()) throw new Error('Pega primero un código de respaldo.');

  let sobre;
  try {
    sobre = decodificar(texto);
  } catch {
    throw new Error('No se pudo leer el respaldo. Revisa que esté completo.');
  }
  if (sobre?.app !== 'voltio' || !sobre?.datos) {
    throw new Error('Eso no parece un respaldo de Voltio.');
  }
  if (sobre.formato > FORMATO) {
    throw new Error('El respaldo viene de una versión más nueva de la app.');
  }

  const d = sobre.datos;
  const completadas = {};
  for (const [id, v] of Object.entries(d.completadas || {})) {
    if (!v || typeof v !== 'object') continue;
    completadas[id] = {
      estrellas: Math.min(3, Math.max(0, Number(v.estrellas) || 0)),
      mejorXp: Math.max(0, Number(v.mejorXp) || 0),
    };
  }

  if (fusionar) {
    for (const [id, v] of Object.entries(estado.completadas)) {
      const previo = completadas[id];
      completadas[id] = {
        estrellas: Math.max(v.estrellas, previo?.estrellas ?? 0),
        mejorXp: Math.max(v.mejorXp, previo?.mejorXp ?? 0),
      };
    }
    estado.xp = Math.max(estado.xp, Number(d.xp) || 0);
    estado.racha = Math.max(estado.racha, Number(d.racha) || 0);
  } else {
    estado.xp = Math.max(0, Number(d.xp) || 0);
    estado.racha = Math.max(0, Number(d.racha) || 0);
  }

  // La fecha mas reciente manda: si no, una racha importada moriria enseguida.
  if (d.ultimoDia && (!estado.ultimoDia || d.ultimoDia > estado.ultimoDia)) {
    estado.ultimoDia = d.ultimoDia;
  }
  estado.completadas = completadas;
  avisar();
  return { lecciones: Object.keys(completadas).length, xp: estado.xp };
}
