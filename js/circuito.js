// circuito.js — motor de dibujo de circuitos en SVG.
//
// Todo se arma con un spec declarativo y sale un <svg> listo para insertar.
// Las resistencias van con el zigzag clasico porque se lee mejor de un vistazo
// que el rectangulo IEC, que es lo que importa en una leccion.

const NS = 'http://www.w3.org/2000/svg';
let contadorId = 0;
const nuevoId = (pre) => `${pre}-${++contadorId}`;

/** Crea un nodo SVG con atributos y, opcionalmente, hijos. */
function el(tag, attrs = {}, hijos = []) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null) continue;
    n.setAttribute(k, String(v));
  }
  for (const h of [].concat(hijos)) if (h) n.appendChild(h);
  return n;
}

const txt = (s) => document.createTextNode(s);

// ── Simbolos ────────────────────────────────────────────────────────────────

/**
 * Zigzag de resistencia sobre un tramo horizontal o vertical.
 * (cx, cy) es el centro del simbolo; largo es la extension total del zigzag.
 */
function zigzag(cx, cy, largo, vertical, amplitud = 11) {
  const n = 6;                       // dientes
  const paso = largo / n;
  const ini = -largo / 2;
  const pts = [[ini, 0]];
  for (let i = 0; i < n; i++) {
    pts.push([ini + paso * (i + 0.5), (i % 2 === 0 ? -1 : 1) * amplitud]);
  }
  pts.push([largo / 2, 0]);
  const d = pts
    .map(([u, v], i) => {
      const [px, py] = vertical ? [cx + v, cy + u] : [cx + u, cy + v];
      return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(' ');
  return el('path', { d, class: 'cz-zig' });
}

/** Campo editable incrustado en el diagrama (para los ejercicios de completar). */
function campoHueco(x, y, ancho, hueco) {
  const fo = el('foreignObject', { x, y, width: ancho, height: 32, class: 'cz-fo' });
  const cont = document.createElement('div');
  cont.className = 'cz-hueco';
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'decimal';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = '?';
  input.dataset.hueco = hueco.id;
  input.setAttribute('aria-label', hueco.etiqueta || hueco.id);
  cont.appendChild(input);
  if (hueco.unidad) {
    const u = document.createElement('span');
    u.className = 'cz-unidad';
    u.textContent = hueco.unidad;
    cont.appendChild(u);
  }
  fo.appendChild(cont);
  return fo;
}

/** Resistencia completa: zigzag + etiqueta (valor fijo o hueco por completar). */
function resistor(cfg) {
  const {
    cx, cy, largo = 66, vertical = false,
    nombre = '', valor = '', hueco = null, destacado = false, ladoEtiqueta = 'auto',
    id = null,
  } = cfg;

  const g = el('g', {
    class: 'cz-comp' + (destacado ? ' cz-destacado' : '') + (id ? ' cz-senalable' : ''),
    'data-comp': id,
    tabindex: id ? '0' : null,
    role: id ? 'button' : null,
    'aria-label': id ? `Componente ${nombre || id}` : null,
  });
  if (id) {
    // Area de acierto generosa: el zigzag es un trazo fino y con el dedo no se
    // acierta. El rectangulo transparente se dibuja primero, debajo de todo.
    const m = 26;
    g.appendChild(el('rect', {
      x: cx - (vertical ? m : largo / 2 + 10), y: cy - (vertical ? largo / 2 + 10 : m),
      width: vertical ? m * 2 : largo + 20, height: vertical ? largo + 20 : m * 2,
      class: 'cz-golpe', rx: 8,
    }));
  }
  g.appendChild(zigzag(cx, cy, largo, vertical));

  // El zigzag ocupa +-11 alrededor del eje, asi que las etiquetas tienen que
  // despegarse lo suficiente para no quedar encima de los dientes.
  const lado = ladoEtiqueta === 'auto' ? (vertical ? 'derecha' : 'arriba') : ladoEtiqueta;
  let tx = cx, tyNombre = cy, tyValor = cy, anchor = 'middle';
  // Un campo editable es mas alto que una linea de texto, asi que cuando lo hay
  // el nombre se corre un poco mas para dejarle sitio.
  const conCampo = Boolean(hueco);
  if (lado === 'arriba')    { tyNombre = cy - (conCampo ? 54 : 44); tyValor = cy - 26; }
  if (lado === 'abajo')     { tyNombre = cy + 34; tyValor = cy + 52; }
  if (lado === 'derecha')   { tx = cx + 26; tyNombre = cy - (conCampo ? 14 : 6); tyValor = cy + 12; anchor = 'start'; }
  if (lado === 'izquierda') { tx = cx - 26; tyNombre = cy - (conCampo ? 14 : 6); tyValor = cy + 12; anchor = 'end'; }

  if (nombre) {
    g.appendChild(el('text',
      { x: tx, y: tyNombre, 'text-anchor': anchor, class: 'cz-nombre' }, [txt(nombre)]));
  }

  if (hueco) {
    const ancho = 78;
    const fx = anchor === 'start' ? tx - 4 : anchor === 'end' ? tx - ancho + 4 : tx - ancho / 2;
    // El campo mide 32 de alto: se ancla de modo que su borde inferior no
    // alcance el zigzag.
    const fy = lado === 'abajo' ? tyNombre + 8 : lado === 'arriba' ? cy - 46 : cy - 4;
    g.appendChild(campoHueco(fx, fy, ancho, hueco));
  } else if (valor) {
    g.appendChild(el('text',
      { x: tx, y: nombre ? tyValor : tyNombre, 'text-anchor': anchor, class: 'cz-valor' }, [txt(valor)]));
  }
  return g;
}

/** Fuente DC vertical: barra larga (+) sobre barra corta (−). */
function fuenteDC(cx, cy, etiqueta, hueco = null) {
  const g = el('g', { class: 'cz-comp cz-fuente' });
  g.appendChild(el('line', { x1: cx - 17, y1: cy - 8, x2: cx + 17, y2: cy - 8, class: 'cz-barra-larga' }));
  g.appendChild(el('line', { x1: cx - 8,  y1: cy + 8, x2: cx + 8,  y2: cy + 8, class: 'cz-barra-corta' }));
  g.appendChild(el('text', { x: cx - 23, y: cy - 12, 'text-anchor': 'end', class: 'cz-signo' }, [txt('+')]));
  g.appendChild(el('text', { x: cx - 23, y: cy + 24, 'text-anchor': 'end', class: 'cz-signo' }, [txt('−')]));

  if (hueco) {
    // Al costado no cabe sin chocar con el primer componente del riel: va debajo.
    g.appendChild(campoHueco(cx - 39, cy + 26, 78, hueco));
  } else if (etiqueta) {
    g.appendChild(el('text',
      { x: cx + 24, y: cy + 5, 'text-anchor': 'start', class: 'cz-valor' }, [txt(etiqueta)]));
  }
  return g;
}

/** Cable: polilinea sobre una lista de puntos [[x,y],...]. */
function cable(pts) {
  return el('polyline', { points: pts.map((p) => p.join(',')).join(' '), class: 'cz-cable' });
}

/** Punto de union donde se juntan tres o mas cables. */
function nodo(x, y) { return el('circle', { cx: x, cy: y, r: 4.5, class: 'cz-nodo' }); }

/** Flecha de corriente con etiqueta. `dir` es hacia donde apunta la punta. */
function flechaCorriente(x, y, etiqueta, dir = 'derecha', anclaTexto = 'arriba') {
  const g = el('g', { class: 'cz-flecha' });
  const L = 28;
  const x2 = dir === 'izquierda' ? x - L : x + L;
  g.appendChild(el('line', { x1: x, y1: y, x2, y2: y, 'marker-end': 'url(#cz-punta)' }));
  g.appendChild(el('text', {
    x: (x + x2) / 2,
    y: anclaTexto === 'abajo' ? y + 20 : y - 10,
    'text-anchor': 'middle', class: 'cz-i',
  }, [txt(etiqueta)]));
  return g;
}

/**
 * Puntos animados recorriendo un camino cerrado. Es la forma mas directa de
 * mostrar que algo circula, y de que la velocidad signifique magnitud.
 */
function electrones(pathD, { cantidad = 8, dur = 4, clase = 'cz-e', radio = 4.5 } = {}) {
  const id = nuevoId('cz-camino');
  const g = el('g', { class: 'cz-electrones' });
  g.appendChild(el('path', { id, d: pathD, fill: 'none', stroke: 'none' }));
  for (let i = 0; i < cantidad; i++) {
    const p = el('circle', { r: radio, class: clase });
    const mp = el('mpath', { href: `#${id}` });
    // Safari todavia pide la forma con namespace xlink.
    mp.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${id}`);
    const anim = el('animateMotion', {
      dur: `${dur}s`,
      repeatCount: 'indefinite',
      begin: `${(-dur * i / cantidad).toFixed(2)}s`,
    }, [mp]);
    p.appendChild(anim);
    g.appendChild(p);
  }
  return g;
}

function defsFlecha() {
  return el('defs', {}, [
    el('marker', {
      id: 'cz-punta', viewBox: '0 0 10 10', refX: 8, refY: 5,
      markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse',
    }, [el('path', { d: 'M0 0 L10 5 L0 10 z', class: 'cz-punta' })]),
  ]);
}

// ── Topologias ──────────────────────────────────────────────────────────────

const M = { izq: 84, der: 104, sup: 88, inf: 56 };  // margenes del marco
// El margen derecho es generoso porque en paralelo las etiquetas de la ultima
// rama se dibujan hacia afuera del marco.

/** Serie: fuente al lado izquierdo, resistencias repartidas en el riel superior. */
function armarSerie(spec, svg, W, H) {
  const xL = M.izq, xR = W - M.der, yT = M.sup, yB = H - M.inf;
  const cyF = (yT + yB) / 2;
  const ramas = spec.ramas || [];
  const arriba = ramas.slice(0, 3);
  const derecha = ramas.slice(3, 5);

  const paso = (xR - xL) / (arriba.length + 1);
  const centros = arriba.map((_, i) => xL + paso * (i + 1));
  // Sin esto, con tres resistencias los zigzags se tocan y el riel parece uno solo.
  const largoS = Math.min(66, paso * 0.56);

  svg.appendChild(cable([[xL, cyF - 26], [xL, yT], [xR, yT]]));
  svg.appendChild(cable([[xR, yT], [xR, yB], [xL, yB], [xL, cyF + 26]]));
  svg.appendChild(fuenteDC(xL, cyF, spec.fuente?.etiqueta, spec.fuente?.hueco));

  arriba.forEach((r, i) => {
    svg.appendChild(el('rect',
      { x: centros[i] - largoS / 2 - 3, y: yT - 6, width: largoS + 6, height: 12, class: 'cz-tapa' }));
    svg.appendChild(resistor({
      cx: centros[i], cy: yT, largo: largoS, nombre: r.nombre, valor: r.valor,
      hueco: r.hueco, destacado: r.destacado, id: r.id, ladoEtiqueta: 'arriba',
    }));
  });

  const largoD = Math.min(66, ((yB - yT) / (derecha.length + 1)) * 0.56);
  derecha.forEach((r, i) => {
    const cy = yT + (yB - yT) * ((i + 1) / (derecha.length + 1));
    svg.appendChild(el('rect',
      { x: xR - 6, y: cy - largoD / 2 - 3, width: 12, height: largoD + 6, class: 'cz-tapa' }));
    svg.appendChild(resistor({
      cx: xR, cy, largo: largoD, vertical: true, nombre: r.nombre, valor: r.valor,
      hueco: r.hueco, destacado: r.destacado, id: r.id, ladoEtiqueta: 'izquierda',
    }));
  });

  const loop = `M${xL} ${cyF - 26} L${xL} ${yT} L${xR} ${yT} L${xR} ${yB} L${xL} ${yB} L${xL} ${cyF + 26}`;
  return { loop, xL, xR, yT, yB, cyF, centros, xLibreHasta: (centros[0] ?? xR) - 36 };
}

/** Paralelo: dos rieles horizontales y una rama vertical por resistencia. */
function armarParalelo(spec, svg, W, H) {
  const xL = M.izq, xR = W - M.der, yT = M.sup, yB = H - M.inf;
  const cyF = (yT + yB) / 2;
  const ramas = spec.ramas || [];

  const x0 = xL + 96;
  const xs = ramas.length > 1
    ? ramas.map((_, i) => x0 + ((xR - x0) / (ramas.length - 1)) * i)
    : [(x0 + xR) / 2];
  const xFin = xs[xs.length - 1];

  svg.appendChild(cable([[xL, cyF - 26], [xL, yT], [xFin, yT]]));
  svg.appendChild(cable([[xL, cyF + 26], [xL, yB], [xFin, yB]]));
  svg.appendChild(fuenteDC(xL, cyF, spec.fuente?.etiqueta, spec.fuente?.hueco));

  ramas.forEach((r, i) => {
    const x = xs[i];
    svg.appendChild(cable([[x, yT], [x, yB]]));
    svg.appendChild(el('rect', { x: x - 6, y: cyF - 36, width: 12, height: 72, class: 'cz-tapa' }));
    svg.appendChild(resistor({
      cx: x, cy: cyF, vertical: true, nombre: r.nombre, valor: r.valor,
      hueco: r.hueco, destacado: r.destacado, id: r.id, ladoEtiqueta: 'derecha',
    }));
    if (i > 0 && i < ramas.length - 1) {
      svg.appendChild(nodo(x, yT));
      svg.appendChild(nodo(x, yB));
    }
  });

  const loop = `M${xL} ${cyF - 26} L${xL} ${yT} L${xs[0]} ${yT} L${xs[0]} ${yB} L${xL} ${yB} L${xL} ${cyF + 26}`;
  return { loop, xL, xR, yT, yB, cyF, xs, xLibreHasta: xs[0] };
}

/** Mixto: una resistencia en serie alimentando un paralelo. Base del divisor. */
function armarMixto(spec, svg, W, H) {
  const xL = M.izq, xR = W - M.der, yT = M.sup, yB = H - M.inf;
  const cyF = (yT + yB) / 2;
  const serie = spec.serie || [];
  const par = spec.paralelo || [];

  const xSerie = xL + (xR - xL) * 0.32;
  const xPar0 = xL + (xR - xL) * 0.64;
  const xsP = par.length > 1
    ? par.map((_, i) => xPar0 + ((xR - xPar0) / (par.length - 1)) * i)
    : [(xPar0 + xR) / 2];
  const xFin = xsP[xsP.length - 1];

  svg.appendChild(cable([[xL, cyF - 26], [xL, yT], [xFin, yT]]));
  svg.appendChild(cable([[xL, cyF + 26], [xL, yB], [xFin, yB]]));
  svg.appendChild(fuenteDC(xL, cyF, spec.fuente?.etiqueta, spec.fuente?.hueco));

  if (serie[0]) {
    svg.appendChild(el('rect', { x: xSerie - 36, y: yT - 6, width: 72, height: 12, class: 'cz-tapa' }));
    svg.appendChild(resistor({
      cx: xSerie, cy: yT, nombre: serie[0].nombre, valor: serie[0].valor,
      hueco: serie[0].hueco, destacado: serie[0].destacado, id: serie[0].id, ladoEtiqueta: 'arriba',
    }));
  }

  par.forEach((r, i) => {
    const x = xsP[i];
    svg.appendChild(cable([[x, yT], [x, yB]]));
    svg.appendChild(el('rect', { x: x - 6, y: cyF - 36, width: 12, height: 72, class: 'cz-tapa' }));
    svg.appendChild(resistor({
      cx: x, cy: cyF, vertical: true, nombre: r.nombre, valor: r.valor,
      hueco: r.hueco, destacado: r.destacado, id: r.id, ladoEtiqueta: 'derecha',
    }));
    if (i > 0 && i < par.length - 1) { svg.appendChild(nodo(x, yT)); svg.appendChild(nodo(x, yB)); }
  });

  const loop = `M${xL} ${cyF - 26} L${xL} ${yT} L${xsP[0]} ${yT} L${xsP[0]} ${yB} L${xL} ${yB} L${xL} ${cyF + 26}`;
  return { loop, xL, xR, yT, yB, cyF, xSerie, xsP, xLibreHasta: xSerie - 36 };
}

// ── API publica ─────────────────────────────────────────────────────────────

/**
 * Construye el <svg> de un circuito a partir de un spec declarativo:
 *
 *   {
 *     tipo: 'serie' | 'paralelo' | 'mixto',
 *     fuente: { etiqueta: '12 V', hueco: { id, unidad } },
 *     ramas:  [{ nombre: 'R1', valor: '100 Ω', hueco, destacado }],
 *     serie / paralelo: idem, solo para tipo 'mixto',
 *     corriente: { velocidad: 1, etiqueta: 'I' } | false,
 *     ancho, alto, nota, descripcion
 *   }
 */
export function construirCircuito(spec) {
  const W = spec.ancho || 520;
  const H = spec.alto || 300;
  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, class: 'cz', role: 'img',
    'aria-label': spec.descripcion || 'Diagrama de circuito',
  });
  svg.appendChild(defsFlecha());

  const geo = spec.tipo === 'paralelo' ? armarParalelo(spec, svg, W, H)
            : spec.tipo === 'mixto'    ? armarMixto(spec, svg, W, H)
            :                            armarSerie(spec, svg, W, H);

  if (spec.corriente !== false) {
    const vel = spec.corriente?.velocidad ?? 1;
    // Velocidad 0 = circuito abierto: no circula nada, no se dibuja nada.
    if (vel > 0) svg.appendChild(electrones(geo.loop, { dur: 4 / vel }));
    if (spec.corriente?.etiqueta) {
      // Arriba solo si queda tramo libre entre la fuente y el primer componente;
      // si no, se rotula el riel de retorno, que siempre esta despejado.
      const cabeArriba = geo.xLibreHasta - geo.xL > 128;
      svg.appendChild(cabeArriba
        ? flechaCorriente(geo.xL + 20, geo.yT - 30, spec.corriente.etiqueta, 'derecha', 'arriba')
        : flechaCorriente((geo.xL + geo.xR) / 2 + 14, geo.yB, spec.corriente.etiqueta, 'izquierda', 'abajo'));
    }
  }

  if (spec.nota) {
    svg.appendChild(el('text',
      { x: W / 2, y: H - 14, 'text-anchor': 'middle', class: 'cz-nota' }, [txt(spec.nota)]));
  }
  return svg;
}

export { el as svgEl, txt as svgTxt, resistor, fuenteDC, cable, nodo, electrones, zigzag, flechaCorriente, defsFlecha };
