// motor.js — reproduce una leccion paso a paso y devuelve el resultado.
//
// Una leccion es una lista de pasos. Cada paso se declara con un `tipo` y el
// motor sabe pintarlo, corregirlo y dar feedback. Los pasos fallados se vuelven
// a encolar al final: la leccion no termina hasta que todo quedo bien.

import { construirCircuito } from './circuito.js';
import { perderVida, sincronizarVidas, estado } from './estado.js';

// ── Utilidades de respuesta numerica ────────────────────────────────────────

const PREFIJOS = { p: 1e-12, n: 1e-9, u: 1e-6, µ: 1e-6, μ: 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, g: 1e9, G: 1e9 };

/**
 * Convierte lo que escribio el usuario a numero. Acepta coma decimal, prefijos
 * de ingenieria ("2k2" y "2k2" incluidos) y unidades pegadas al final.
 */
export function aNumero(bruto) {
  if (bruto === null || bruto === undefined) return NaN;
  let s = String(bruto).trim().replace(/\s+/g, '');
  if (!s) return NaN;
  s = s.replace(/(ohm|ohms|Ω|Ω|V|A|W|F|H|s)$/i, '');       // unidad al final, si viene
  s = s.replace(',', '.');

  // Notacion "2k2" / "4M7": el prefijo hace de punto decimal.
  const conPrefijoIntermedio = s.match(/^(-?\d+)([pnuµμmkKMgG])(\d+)$/);
  if (conPrefijoIntermedio) {
    const [, ent, pre, dec] = conPrefijoIntermedio;
    return parseFloat(`${ent}.${dec}`) * PREFIJOS[pre];
  }

  const conSufijo = s.match(/^(-?\d*\.?\d+(?:[eE][-+]?\d+)?)([pnuµμmkKMgG])$/);
  if (conSufijo) return parseFloat(conSufijo[1]) * PREFIJOS[conSufijo[2]];

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

/** Compara con tolerancia relativa (por defecto 1%), con piso para el cero. */
export function coincide(valor, esperado, tolerancia = 0.01) {
  if (!Number.isFinite(valor)) return false;
  const margen = Math.max(Math.abs(esperado) * tolerancia, 1e-9);
  return Math.abs(valor - esperado) <= margen;
}

/** Formatea un numero con prefijo de ingenieria: 4700 -> "4.7 k". */
export function formatear(v, unidad = '') {
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  const tabla = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
  const [div, pre] = tabla.find(([d]) => abs >= d) || [1, ''];
  const escalado = v / div;
  const texto = Math.abs(escalado % 1) < 1e-9
    ? escalado.toFixed(0)
    : escalado.toFixed(Math.abs(escalado) < 10 ? 2 : 1).replace(/\.?0+$/, '');
  return `${texto} ${pre}${unidad}`.trim();
}

// ── Construccion del DOM de cada tipo de paso ───────────────────────────────

function h(tag, attrs = {}, hijos = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(n.dataset, v);
    else n.setAttribute(k, String(v));
  }
  for (const c of [].concat(hijos)) {
    if (c === null || c === undefined || c === false) continue;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return n;
}

/** Zona visual del paso: circuito declarativo, nodo suelto o funcion perezosa. */
function construirVisual(paso) {
  if (paso.circuito) return h('div', { class: 'visual' }, [construirCircuito(paso.circuito)]);
  if (typeof paso.visual === 'function') {
    const v = paso.visual();
    return v ? h('div', { class: 'visual' }, [v]) : null;
  }
  if (paso.visual) return h('div', { class: 'visual' }, [paso.visual]);
  return null;
}

function mezclar(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Motor ───────────────────────────────────────────────────────────────────

/**
 * Reproduce una leccion dentro de `contenedor`.
 * Devuelve una promesa con { completada, aciertos, fallos, xp, estrellas }.
 */
export function reproducirLeccion(leccion, contenedor, { alSalir } = {}) {
  return new Promise((resolver) => {
    const cola = leccion.pasos.map((p, i) => ({ ...p, _id: i }));
    const total = cola.length;
    let indice = 0;
    let aciertos = 0;
    let fallos = 0;
    let resueltos = 0;          // pasos distintos ya superados (para la barra)
    const yaFallado = new Set();

    contenedor.innerHTML = '';
    const barraInterior = h('i');
    const marcadorVidas = h('span', { class: 'vidas' });
    const cabecera = h('header', { class: 'lec-cabecera' }, [
      h('button', { class: 'salir', 'aria-label': 'Salir de la leccion', onClick: pedirSalida }, ['✕']),
      h('div', { class: 'barra', role: 'progressbar', 'aria-label': 'Progreso de la leccion' }, [barraInterior]),
      marcadorVidas,
    ]);
    const escena = h('main', { class: 'lec-escena' });
    const pie = h('footer', { class: 'lec-pie' });
    contenedor.append(cabecera, escena, pie);

    function pintarVidas() {
      const v = sincronizarVidas();
      marcadorVidas.innerHTML = '';
      marcadorVidas.append(h('span', { class: 'corazon' }, ['♥']), h('b', {}, [String(v)]));
      marcadorVidas.classList.toggle('sin-vidas', v === 0);
    }

    function avanzarBarra() {
      barraInterior.style.width = `${Math.round((resueltos / total) * 100)}%`;
    }

    function pedirSalida() {
      if (resueltos === total || confirm('¿Salir de la leccion? Vas a perder el avance de esta sesion.')) {
        alSalir?.();
        resolver({ completada: false, aciertos, fallos, xp: 0, estrellas: 0 });
      }
    }

    // ── Feedback inferior ──
    function mostrarFeedback({ ok, titulo, detalle, alContinuar }) {
      pie.innerHTML = '';
      pie.className = `lec-pie ${ok ? 'ok' : 'mal'}`;
      const cuerpo = h('div', { class: 'fb-cuerpo' }, [
        h('div', { class: 'fb-icono' }, [ok ? '✓' : '✕']),
        h('div', {}, [
          h('strong', {}, [titulo]),
          detalle ? h('div', { class: 'fb-detalle', html: detalle }) : null,
        ]),
      ]);
      const boton = h('button', { class: 'btn principal', onClick: alContinuar }, ['Continuar']);
      pie.append(cuerpo, boton);
      boton.focus();
      pie.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function limpiarPie() { pie.innerHTML = ''; pie.className = 'lec-pie'; }

    /** Contabiliza el resultado y decide si el paso se re-encola. */
    function resolverPaso(paso, ok, feedback) {
      if (ok) {
        aciertos++;
        resueltos++;
        avanzarBarra();
      } else {
        fallos++;
        if (!yaFallado.has(paso._id)) {
          yaFallado.add(paso._id);
          cola.push({ ...paso, _reintento: true });   // vuelve al final de la cola
        }
        perderVida();
        pintarVidas();
      }
      mostrarFeedback({ ...feedback, ok, alContinuar: siguiente });
    }

    // ── Renderizadores por tipo ──

    function pintarInfo(paso) {
      escena.append(
        h('div', { class: 'paso paso-info' }, [
          paso.emoji ? h('div', { class: 'paso-emoji' }, [paso.emoji]) : null,
          h('h2', {}, [paso.titulo || '']),
          construirVisual(paso),
          paso.cuerpo ? h('div', { class: 'prosa', html: paso.cuerpo }) : null,
        ]),
      );
      pie.innerHTML = '';
      pie.className = 'lec-pie';
      const b = h('button', { class: 'btn principal', onClick: () => { resueltos++; avanzarBarra(); siguiente(); } },
        [paso.textoBoton || 'Entendido']);
      pie.append(b);
      b.focus();
    }

    function pintarAlternativas(paso) {
      // Se baraja pero conservando cual era la correcta.
      const opciones = paso.mezclar === false
        ? paso.opciones.map((o, i) => ({ o, i }))
        : mezclar(paso.opciones.map((o, i) => ({ o, i })));
      let elegida = null;

      const lista = h('div', { class: 'opciones' + (paso.columnas ? ` col-${paso.columnas}` : '') });
      opciones.forEach(({ o, i }, pos) => {
        const texto = typeof o === 'string' ? o : o.texto;
        const btn = h('button', {
          class: 'opcion', type: 'button', dataset: { indice: String(i) },
          onClick: () => {
            lista.querySelectorAll('.opcion').forEach((x) => x.classList.remove('elegida'));
            btn.classList.add('elegida');
            elegida = i;
            comprobar.disabled = false;
          },
        }, [
          h('kbd', {}, [String(pos + 1)]),
          h('span', { html: texto }),
        ]);
        lista.appendChild(btn);
      });

      escena.append(h('div', { class: 'paso paso-preg' }, [
        h('h2', { class: 'enunciado', html: paso.pregunta }),
        construirVisual(paso),
        lista,
      ]));

      const comprobar = h('button', {
        class: 'btn principal', disabled: 'true',
        onClick: () => {
          const ok = elegida === paso.correcta;
          lista.querySelectorAll('.opcion').forEach((b) => {
            b.disabled = true;
            const i = Number(b.dataset.indice);
            if (i === paso.correcta) b.classList.add('correcta');
            else if (i === elegida) b.classList.add('incorrecta');
          });
          const buena = paso.opciones[paso.correcta];
          const textoBueno = typeof buena === 'string' ? buena : buena.texto;
          resolverPaso(paso, ok, {
            titulo: ok ? (paso.elogio || '¡Correcto!') : 'No es esa',
            detalle: ok
              ? (paso.explicacion || '')
              : `<p class="respuesta-buena">Respuesta correcta: <b>${textoBueno}</b></p>${paso.explicacion || ''}`,
          });
        },
      }, ['Comprobar']);
      comprobar.disabled = true;
      pie.append(comprobar);

      // Atajos 1..9 para responder con teclado.
      const porTeclado = (ev) => {
        const n = Number(ev.key);
        if (n >= 1 && n <= opciones.length) lista.querySelectorAll('.opcion')[n - 1]?.click();
        if (ev.key === 'Enter' && !comprobar.disabled) comprobar.click();
      };
      escena.dataset.teclado = '1';
      document.addEventListener('keydown', porTeclado);
      escena._limpiar = () => document.removeEventListener('keydown', porTeclado);
    }

    function pintarCompletar(paso) {
      const bloque = h('div', { class: 'paso paso-completar' }, [
        h('h2', { class: 'enunciado', html: paso.enunciado }),
        construirVisual(paso),
        paso.pista ? h('details', { class: 'pista' }, [
          h('summary', {}, ['Ver pista']),
          h('div', { class: 'prosa', html: paso.pista }),
        ]) : null,
      ]);
      escena.append(bloque);

      const inputs = [...bloque.querySelectorAll('input[data-hueco]')];
      const comprobar = h('button', { class: 'btn principal', disabled: 'true' }, ['Comprobar']);

      const revisarLlenado = () => {
        comprobar.disabled = !inputs.every((i) => i.value.trim() !== '');
      };
      inputs.forEach((i) => {
        i.addEventListener('input', revisarLlenado);
        i.addEventListener('keydown', (ev) => {
          if (ev.key !== 'Enter') return;
          ev.preventDefault();
          if (!comprobar.disabled) comprobar.click();
        });
      });
      inputs[0]?.focus();

      comprobar.addEventListener('click', () => {
        let todoOk = true;
        const errores = [];
        for (const input of inputs) {
          const def = paso.huecos.find((x) => x.id === input.dataset.hueco);
          if (!def) continue;
          const v = aNumero(input.value);
          const ok = coincide(v, def.respuesta, def.tolerancia ?? 0.01);
          input.closest('.cz-hueco')?.classList.add(ok ? 'ok' : 'mal');
          input.disabled = true;
          if (!ok) {
            todoOk = false;
            errores.push(`<li><b>${def.etiqueta || def.id}</b> = ${formatear(def.respuesta, def.unidad || '')}</li>`);
          }
        }
        comprobar.disabled = true;
        resolverPaso(paso, todoOk, {
          titulo: todoOk ? (paso.elogio || '¡Circuito resuelto!') : 'Hay valores que no cuadran',
          detalle: todoOk
            ? (paso.explicacion || '')
            : `<ul class="lista-errores">${errores.join('')}</ul>${paso.solucion || paso.explicacion || ''}`,
        });
      });
      pie.append(comprobar);
    }

    function pintarEntrada(paso) {
      const campo = h('input', {
        type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false',
        class: 'entrada-grande', placeholder: paso.placeholder || '?',
        'aria-label': paso.enunciado?.replace(/<[^>]+>/g, '') || 'Respuesta',
      });
      escena.append(h('div', { class: 'paso paso-entrada' }, [
        h('h2', { class: 'enunciado', html: paso.enunciado }),
        construirVisual(paso),
        h('div', { class: 'campo-unidad' }, [campo, paso.unidad ? h('span', {}, [paso.unidad]) : null]),
        paso.pista ? h('details', { class: 'pista' }, [
          h('summary', {}, ['Ver pista']), h('div', { class: 'prosa', html: paso.pista }),
        ]) : null,
      ]));

      const comprobar = h('button', { class: 'btn principal', disabled: 'true' }, ['Comprobar']);
      campo.addEventListener('input', () => { comprobar.disabled = campo.value.trim() === ''; });
      campo.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' && !comprobar.disabled) { ev.preventDefault(); comprobar.click(); }
      });
      campo.focus();

      comprobar.addEventListener('click', () => {
        const v = aNumero(campo.value);
        const ok = coincide(v, paso.respuesta, paso.tolerancia ?? 0.01);
        campo.disabled = true;
        campo.classList.add(ok ? 'ok' : 'mal');
        comprobar.disabled = true;
        resolverPaso(paso, ok, {
          titulo: ok ? (paso.elogio || '¡Exacto!') : 'No es ese numero',
          detalle: ok
            ? (paso.explicacion || '')
            : `<p class="respuesta-buena">Respuesta: <b>${formatear(paso.respuesta, paso.unidad || '')}</b></p>${paso.solucion || paso.explicacion || ''}`,
        });
      });
      pie.append(comprobar);
    }

    // ── Bucle principal ──

    function siguiente() {
      escena._limpiar?.();
      escena._limpiar = null;

      if (indice >= cola.length) return terminar();

      if (sincronizarVidas() === 0) return sinVidas();

      const paso = cola[indice++];
      escena.innerHTML = '';
      limpiarPie();
      pintarVidas();

      if (paso._reintento) {
        escena.append(h('div', { class: 'aviso-reintento' }, ['Volvamos a esta']));
      }

      const pintores = {
        info: pintarInfo,
        alternativas: pintarAlternativas,
        completar: pintarCompletar,
        entrada: pintarEntrada,
      };
      (pintores[paso.tipo] || pintarInfo)(paso);
      escena.scrollTop = 0;
    }

    function sinVidas() {
      escena.innerHTML = '';
      limpiarPie();
      escena.append(h('div', { class: 'paso paso-fin' }, [
        h('div', { class: 'paso-emoji' }, ['💔']),
        h('h2', {}, ['Te quedaste sin vidas']),
        h('p', { class: 'prosa' }, ['Se recarga una vida cada 20 minutos. Puedes repasar teoria mientras tanto.']),
      ]));
      pie.append(h('button', { class: 'btn principal', onClick: () => {
        alSalir?.();
        resolver({ completada: false, aciertos, fallos, xp: 0, estrellas: 0 });
      } }, ['Volver al mapa']));
    }

    function terminar() {
      const estrellas = fallos === 0 ? 3 : fallos <= 2 ? 2 : 1;
      const xp = (leccion.xp || 20) + (fallos === 0 ? 10 : 0);
      const precision = aciertos + fallos > 0 ? Math.round((aciertos / (aciertos + fallos)) * 100) : 100;

      escena.innerHTML = '';
      limpiarPie();
      barraInterior.style.width = '100%';
      escena.append(h('div', { class: 'paso paso-fin' }, [
        h('div', { class: 'paso-emoji celebra' }, [fallos === 0 ? '⚡' : '🎉']),
        h('h2', {}, [fallos === 0 ? '¡Leccion perfecta!' : '¡Leccion completada!']),
        h('div', { class: 'estrellas' }, [1, 2, 3].map((i) =>
          h('span', { class: i <= estrellas ? 'on' : '' }, ['★']))),
        h('div', { class: 'resumen' }, [
          h('div', { class: 'tarjeta-res xp' }, [h('b', {}, [`+${xp}`]), h('span', {}, ['XP'])]),
          h('div', { class: 'tarjeta-res' }, [h('b', {}, [`${precision}%`]), h('span', {}, ['Precision'])]),
        ]),
      ]));
      pie.append(h('button', { class: 'btn principal', onClick: () =>
        resolver({ completada: true, aciertos, fallos, xp, estrellas }) }, ['Seguir']));
    }

    pintarVidas();
    avanzarBarra();
    siguiente();
  });
}

export { h };
