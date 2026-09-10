// app.js — mapa de aprendizaje, navegacion y pegado de todas las piezas.

import { h } from './motor.js';
import { reproducirLeccion } from './motor.js';
import {
  estado, suscribir, rachaVigente, sincronizarVidas, rellenarVidas,
  completarLeccion, estaCompletada, estrellasDe, reiniciarTodo,
} from './estado.js';

import fundamentos from '../lecciones/01-fundamentos.js';
import topologias from '../lecciones/02-serie-paralelo.js';
import inductores from '../lecciones/03-inductores.js';
import capacitores from '../lecciones/04-capacitores.js';
import laplace from '../lecciones/05-laplace.js';

const MODULOS = [fundamentos, topologias, inductores, capacitores, laplace];

const app = document.getElementById('app');

// ── Reglas de desbloqueo ────────────────────────────────────────────────────
// Dentro de un modulo se avanza en orden. Un modulo se abre cuando el anterior
// tiene al menos una leccion hecha: castiga poco y mantiene el orden sugerido.

let modoLibre = false;   // valvula de escape para revisar contenido sin jugar

function moduloAbierto(idx) {
  if (modoLibre || idx === 0) return true;
  const previo = MODULOS[idx - 1];
  if (previo.proximamente) return false;
  return previo.lecciones.some((l) => estaCompletada(l.id));
}

function leccionAbierta(mod, i) {
  if (modoLibre || i === 0) return true;
  return estaCompletada(mod.lecciones[i - 1].id);
}

function progresoModulo(mod) {
  if (!mod.lecciones.length) return 0;
  const hechas = mod.lecciones.filter((l) => estaCompletada(l.id)).length;
  return hechas / mod.lecciones.length;
}

// ── Barra superior ──────────────────────────────────────────────────────────

function construirBarra() {
  const racha = h('span', { class: 'stat' }, [
    h('i', { class: 'ic' }, ['🔥']), h('b', {}, [String(rachaVigente())]),
  ]);
  const xp = h('span', { class: 'stat' }, [
    h('i', { class: 'ic' }, ['⚡']), h('b', {}, [String(estado.xp)]),
  ]);
  const vidas = h('span', { class: 'stat' }, [
    h('i', { class: 'ic' }, ['♥']), h('b', {}, [String(sincronizarVidas())]),
  ]);

  return h('header', { class: 'barra-sup' }, [
    h('div', { class: 'marca' }, [
      h('span', { class: 'rayo' }, ['⚡']),
      h('span', { class: 'marca-txt' }, ['Voltio']),
    ]),
    h('div', { class: 'stats' }, [racha, xp, vidas]),
    h('button', { class: 'icono-btn', title: 'Ajustes', 'aria-label': 'Ajustes',
      onClick: verAjustes }, ['⚙']),
  ]);
}

// ── Mapa ────────────────────────────────────────────────────────────────────

function nodoLeccion(mod, lec, i, abierta) {
  const hecha = estaCompletada(lec.id);
  const estrellas = estrellasDe(lec.id);
  const clases = ['nodo', abierta ? (hecha ? 'hecha' : 'activa') : 'cerrada'];
  // El zigzag del camino: el desfase depende de la posicion en la lista.
  const desfase = [0, 46, 66, 46, 0, -46, -66, -46][i % 8];

  const btn = h('button', {
    class: clases.join(' '),
    style: `--desfase:${desfase}px`,
    disabled: abierta ? null : 'true',
    'aria-label': `${lec.titulo}${hecha ? ' (completada)' : abierta ? '' : ' (bloqueada)'}`,
    onClick: () => abierta && iniciarLeccion(mod, lec),
  }, [
    h('span', { class: 'nodo-cara' }, [hecha ? '★' : abierta ? '▶' : '🔒']),
    h('span', { class: 'nodo-nombre' }, [lec.titulo]),
    hecha ? h('span', { class: 'nodo-estrellas' },
      [1, 2, 3].map((n) => h('i', { class: n <= estrellas ? 'on' : '' }, ['★']))) : null,
  ]);
  return btn;
}

function seccionModulo(mod, idx) {
  const abierto = moduloAbierto(idx);
  const prog = progresoModulo(mod);

  const cabecera = h('div', { class: `mod-cab ${mod.color}${abierto ? '' : ' cerrado'}` }, [
    h('div', { class: 'mod-icono' }, [mod.icono]),
    h('div', { class: 'mod-txt' }, [
      h('h2', {}, [mod.titulo]),
      h('p', {}, [mod.subtitulo]),
    ]),
    mod.lecciones.length
      ? h('div', { class: 'mod-prog' }, [
          h('div', { class: 'mod-barra' }, [h('i', { style: `width:${Math.round(prog * 100)}%` })]),
          h('span', {}, [`${mod.lecciones.filter((l) => estaCompletada(l.id)).length}/${mod.lecciones.length}`]),
        ])
      : h('span', { class: 'chip' }, ['Pronto']),
  ]);

  const cuerpo = mod.proximamente
    ? h('details', { class: 'temario' }, [
        h('summary', {}, ['Ver qué viene en este módulo']),
        h('ul', {}, mod.temario.map((x) => h('li', {}, [x]))),
      ])
    : h('div', { class: 'camino' },
        mod.lecciones.map((lec, i) => nodoLeccion(mod, lec, i, abierto && leccionAbierta(mod, i))));

  return h('section', { class: 'modulo' }, [cabecera, cuerpo]);
}

function verMapa() {
  app.innerHTML = '';
  app.className = 'pantalla-mapa';
  app.append(
    construirBarra(),
    h('main', { class: 'mapa' }, [
      h('div', { class: 'saludo' }, [
        h('h1', {}, ['Aprende electricidad']),
        h('p', {}, ['Una lección corta al día y en un mes entiendes circuitos de verdad.']),
      ]),
      ...MODULOS.map(seccionModulo),
      h('footer', { class: 'pie-mapa' }, ['Voltio · proyecto personal']),
    ]),
  );
  window.scrollTo(0, 0);
}

// ── Leccion ─────────────────────────────────────────────────────────────────

async function iniciarLeccion(mod, lec) {
  app.innerHTML = '';
  app.className = 'pantalla-leccion';
  const caja = h('div', { class: 'leccion' });
  app.append(caja);

  const res = await reproducirLeccion(lec, caja, { alSalir: () => {} });

  if (res.completada) {
    completarLeccion(lec.id, { estrellas: res.estrellas, xp: res.xp });
  }
  verMapa();
}

// ── Ajustes ─────────────────────────────────────────────────────────────────

function verAjustes() {
  app.innerHTML = '';
  app.className = 'pantalla-ajustes';
  app.append(
    h('header', { class: 'barra-sup' }, [
      h('button', { class: 'icono-btn', onClick: verMapa, 'aria-label': 'Volver' }, ['←']),
      h('div', { class: 'marca' }, [h('span', { class: 'marca-txt' }, ['Ajustes'])]),
      h('span', {}),
    ]),
    h('main', { class: 'ajustes' }, [
      h('div', { class: 'tarjeta' }, [
        h('h3', {}, ['Tu progreso']),
        h('div', { class: 'grid-stats' }, [
          h('div', {}, [h('b', {}, [String(estado.xp)]), h('span', {}, ['XP total'])]),
          h('div', {}, [h('b', {}, [String(rachaVigente())]), h('span', {}, ['Días de racha'])]),
          h('div', {}, [h('b', {}, [String(Object.keys(estado.completadas).length)]), h('span', {}, ['Lecciones'])]),
        ]),
      ]),
      h('div', { class: 'tarjeta' }, [
        h('h3', {}, ['Vidas']),
        h('p', {}, [`Tienes ${sincronizarVidas()} de 5. Se recarga una cada 20 minutos.`]),
        h('button', { class: 'btn secundario', onClick: () => { rellenarVidas(); verAjustes(); } },
          ['Rellenar vidas']),
      ]),
      h('div', { class: 'tarjeta' }, [
        h('h3', {}, ['Modo libre']),
        h('p', {}, ['Abre todas las lecciones sin respetar el orden. Útil para repasar o revisar contenido.']),
        h('button', {
          class: 'btn secundario',
          onClick: (ev) => { modoLibre = !modoLibre; ev.target.textContent = modoLibre ? 'Desactivar' : 'Activar'; },
        }, [modoLibre ? 'Desactivar' : 'Activar']),
      ]),
      h('div', { class: 'tarjeta peligro' }, [
        h('h3', {}, ['Borrar progreso']),
        h('p', {}, ['Vuelve todo a cero. No se puede deshacer.']),
        h('button', {
          class: 'btn peligro',
          onClick: () => { if (confirm('¿Borrar todo tu progreso?')) { reiniciarTodo(); verMapa(); } },
        }, ['Borrar todo']),
      ]),
    ]),
  );
}

// ── Arranque ────────────────────────────────────────────────────────────────

suscribir(() => {
  // Si el usuario esta mirando el mapa, refresca los contadores al vuelo.
  if (app.className === 'pantalla-mapa') {
    const stats = app.querySelector('.stats');
    if (!stats) return;
    const [r, x, v] = stats.querySelectorAll('b');
    if (r) r.textContent = String(rachaVigente());
    if (x) x.textContent = String(estado.xp);
    if (v) v.textContent = String(sincronizarVidas());
  }
});

verMapa();
