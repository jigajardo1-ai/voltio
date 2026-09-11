// app.js — mapa de aprendizaje, navegacion y pegado de todas las piezas.

import { h } from './motor.js';
import { reproducirLeccion } from './motor.js';
import {
  estado, suscribir, rachaVigente, sincronizarVidas, rellenarVidas,
  completarLeccion, estaCompletada, estrellasDe, reiniciarTodo,
  exportarJSON, exportarCodigo, importar, guardadoSano, hayAlmacenamiento,
} from './estado.js';

import fundamentos from '../lecciones/01-fundamentos.js';
import topologias from '../lecciones/02-serie-paralelo.js';
import inductores from '../lecciones/03-inductores.js';
import capacitores from '../lecciones/04-capacitores.js';
import laplace from '../lecciones/05-laplace.js';

const MODULOS = [fundamentos, topologias, inductores, capacitores, laplace];

const app = document.getElementById('app');

// ── Descarga de archivos ────────────────────────────────────────────────────
//
// Publicada como Artifact, la pagina corre en un visor donde los enlaces con
// `download` quedan inertes y hay que pedirle el guardado al anfitrion. Fuera
// de ahi no existe ese anfitrion y toca el blob de toda la vida. Se resuelve
// una sola vez al arrancar para no hacer esperar al usuario en pleno clic.

let guardadorAnfitrion = null;
if (typeof window !== 'undefined' && typeof window.claude?.use === 'function') {
  Promise.resolve(window.claude.use('downloads'))
    .then((d) => { guardadorAnfitrion = d; })
    .catch(() => { guardadorAnfitrion = null; });
}

async function descargar(nombre, contenido, tipo = 'application/json') {
  if (guardadorAnfitrion) {
    try {
      await guardadorAnfitrion.save({ filename: nombre, data: contenido });
      return true;
    } catch {
      return false;                 // el visor puede rechazarlo; no es un fallo
    }
  }
  try {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch { return false; }
}

async function alPortapapeles(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch { return false; }
}

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
      hayAlmacenamiento ? null : h('div', { class: 'banda-aviso', role: 'status' }, [
        h('b', {}, ['Tu progreso no se está guardando. ']),
        'Este navegador tiene el almacenamiento bloqueado (suele ser una ventana privada). ',
        'Lo que avances se perderá al cerrar la pestaña.',
      ]),
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

/**
 * Respaldo del progreso. Sin cuenta ni servidor, esto es lo unico que lo salva
 * de un "limpiar datos de navegacion" y la unica via de llevarlo a otro
 * dispositivo, asi que va explicado, no escondido tras un icono.
 */
function construirRespaldo() {
  const aviso = h('p', { class: 'aviso-guardado' });
  const campo = h('textarea', {
    class: 'campo-respaldo', rows: '3', spellcheck: 'false',
    placeholder: 'Pega aquí tu código de respaldo…',
    'aria-label': 'Código de respaldo para importar',
  });
  const resultado = h('p', { class: 'resultado-respaldo' });

  const decir = (txt, clase = '') => {
    resultado.textContent = txt;
    resultado.className = `resultado-respaldo ${clase}`;
  };

  const fecha = new Date().toISOString().slice(0, 10);

  const tarjeta = h('div', { class: 'tarjeta' }, [
    h('h3', {}, ['Respaldo del progreso']),
    aviso,
    h('p', {}, [
      'Tu avance se guarda en este navegador. Si limpias los datos de navegación se borra, ',
      'y no viaja solo a otro dispositivo. Sácale un respaldo de vez en cuando.',
    ]),
    h('div', { class: 'fila-botones' }, [
      h('button', {
        class: 'btn secundario',
        onClick: async (ev) => {
          const ok = await descargar(`voltio-progreso-${fecha}.json`, exportarJSON());
          decir(ok ? 'Archivo descargado.' : 'El navegador no permitió la descarga. Usa el código.',
            ok ? 'ok' : 'mal');
          ev.target.blur();
        },
      }, ['Descargar archivo']),
      h('button', {
        class: 'btn secundario',
        onClick: async (ev) => {
          const codigo = exportarCodigo();
          const ok = await alPortapapeles(codigo);
          if (ok) decir('Código copiado. Pégalo en el otro dispositivo.', 'ok');
          else {
            // Sin portapapeles queda mostrarlo para copiar a mano.
            campo.value = codigo;
            campo.select();
            decir('No pude copiarlo solo: está en el cuadro, cópialo tú.', '');
          }
          ev.target.blur();
        },
      }, ['Copiar código']),
    ]),
    h('h4', {}, ['Restaurar']),
    campo,
    h('div', { class: 'fila-botones' }, [
      h('button', {
        class: 'btn secundario',
        onClick: () => {
          try {
            const r = importar(campo.value);
            decir(`Listo: ${r.lecciones} lecciones y ${r.xp} XP.`, 'ok');
            campo.value = '';
            setTimeout(verAjustes, 1200);
          } catch (e) {
            decir(e.message, 'mal');
          }
        },
      }, ['Restaurar respaldo']),
    ]),
    h('p', { class: 'nota-fina' }, [
      'Al restaurar se conserva lo mejor de cada lado: si ya tenías una lección con más ',
      'estrellas, no la pierdes.',
    ]),
    resultado,
  ]);

  if (!hayAlmacenamiento) {
    aviso.className = 'aviso-guardado mal';
    aviso.textContent = 'Este navegador no permite guardar: tu progreso se perderá al cerrar '
      + 'la pestaña. Suele pasar en ventanas privadas o con las cookies bloqueadas.';
  } else if (!guardadoSano()) {
    aviso.className = 'aviso-guardado mal';
    aviso.textContent = 'La última vez que intenté guardar hubo un error. Saca un respaldo ahora.';
  } else {
    aviso.remove();
  }
  return tarjeta;
}

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
      construirRespaldo(),
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

// ── Actualizaciones de la app instalada ─────────────────────────────────────

function mostrarActualizacion(aplicar) {
  if (document.querySelector('.banda-version')) return;
  const banda = h('div', { class: 'banda-version', role: 'status' }, [
    h('span', {}, ['Hay una versión nueva de Voltio.']),
    h('button', {
      class: 'btn secundario chico',
      onClick: (ev) => { ev.target.textContent = 'Actualizando…'; ev.target.disabled = true; aplicar(); },
    }, ['Actualizar']),
  ]);
  document.body.appendChild(banda);
}

window.addEventListener('voltio:actualizacion', (ev) => {
  mostrarActualizacion(ev.detail.aplicar);
});

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
