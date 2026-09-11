// visuales.js — animaciones y widgets interactivos de las lecciones.
//
// Cada funcion devuelve un nodo listo para insertar. La regla que se sigue aca
// es que el visual tiene que mostrar el mecanismo, no decorar: si el usuario
// mueve algo, la magnitud fisica que cambia se ve cambiar.

import { svgEl as s, svgTxt as t, electrones, defsFlecha, cable, zigzag } from './circuito.js';
import { h, formatear } from './motor.js';

// ── Analogia hidraulica ─────────────────────────────────────────────────────

/**
 * Estanque, canieria y valvula: la analogia clasica agua/electricidad.
 * `resaltar` pinta una de las tres magnitudes ('voltaje' | 'corriente' |
 * 'resistencia') para que la leccion pueda apuntar a una sola a la vez.
 */
export function analogiaHidraulica(resaltar = null) {
  const W = 480, H = 260;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'viz viz-agua', role: 'img',
    'aria-label': 'Analogia hidraulica: estanque, canieria y valvula' });
  svg.appendChild(defsFlecha());

  const marca = (q) => (resaltar === q ? ' resalta' : resaltar ? ' atenua' : '');

  // Estanque elevado = diferencia de potencial.
  const gT = s('g', { class: 'viz-g' + marca('voltaje') });
  gT.appendChild(s('rect', { x: 24, y: 40, width: 96, height: 104, rx: 6, class: 'viz-tanque' }));
  const agua = s('rect', { x: 27, y: 62, width: 90, height: 79, rx: 4, class: 'viz-agua-fill' });
  gT.appendChild(agua);
  gT.appendChild(s('line', { x1: 136, y1: 62, x2: 136, y2: 186, class: 'viz-cota' }));
  gT.appendChild(s('line', { x1: 130, y1: 62, x2: 142, y2: 62, class: 'viz-cota' }));
  gT.appendChild(s('line', { x1: 130, y1: 186, x2: 142, y2: 186, class: 'viz-cota' }));
  gT.appendChild(s('text', { x: 148, y: 118, class: 'viz-rot' }, [t('altura = voltaje')]));
  svg.appendChild(gT);

  // Canieria con agua corriendo = corriente.
  const gC = s('g', { class: 'viz-g' + marca('corriente') });
  gC.appendChild(s('path', { d: 'M72 144 L72 186 L420 186', class: 'viz-tubo' }));
  gC.appendChild(electrones('M72 150 L72 186 L420 186',
    { cantidad: 7, dur: 3, clase: 'viz-gota', radio: 5 }));
  gC.appendChild(s('text', { x: 300, y: 214, 'text-anchor': 'middle', class: 'viz-rot' },
    [t('caudal = corriente')]));
  svg.appendChild(gC);

  // Estrechamiento = resistencia.
  const gR = s('g', { class: 'viz-g' + marca('resistencia') });
  gR.appendChild(s('path', { d: 'M280 172 L296 186 L280 200 Z', class: 'viz-valvula' }));
  gR.appendChild(s('path', { d: 'M312 172 L296 186 L312 200 Z', class: 'viz-valvula' }));
  gR.appendChild(s('text', { x: 296, y: 162, 'text-anchor': 'middle', class: 'viz-rot' },
    [t('estrechamiento = resistencia')]));
  svg.appendChild(gR);

  // El nivel del estanque respira: recuerda que la fuente sostiene la presion.
  const anim = s('animate', {
    attributeName: 'height', values: '79;72;79', dur: '4s', repeatCount: 'indefinite',
  });
  const animY = s('animate', {
    attributeName: 'y', values: '62;69;62', dur: '4s', repeatCount: 'indefinite',
  });
  agua.append(anim, animY);
  return svg;
}

// ── Triangulo mnemotecnico de la ley de Ohm ─────────────────────────────────

/** V arriba, I y R abajo: tapa la que buscas y te queda la formula. */
export function trianguloOhm(tapada = null) {
  const svg = s('svg', { viewBox: '0 0 260 200', class: 'viz viz-triangulo', role: 'img',
    'aria-label': 'Triangulo de la ley de Ohm' });
  svg.appendChild(s('path', { d: 'M130 16 L242 186 L18 186 Z', class: 'viz-tri' }));
  svg.appendChild(s('line', { x1: 62, y1: 118, x2: 198, y2: 118, class: 'viz-tri-div' }));
  svg.appendChild(s('line', { x1: 130, y1: 118, x2: 130, y2: 186, class: 'viz-tri-div' }));

  const celda = (x, y, letra, clave) => {
    const g = s('g', { class: 'viz-celda' + (tapada === clave ? ' tapada' : '') });
    g.appendChild(s('text', { x, y, 'text-anchor': 'middle', class: 'viz-letra' }, [t(letra)]));
    if (tapada === clave) {
      g.appendChild(s('circle', { cx: x, cy: y - 11, r: 26, class: 'viz-tapa-circ' }));
    }
    return g;
  };
  svg.appendChild(celda(130, 88, 'V', 'V'));
  svg.appendChild(celda(88, 168, 'I', 'I'));
  svg.appendChild(celda(174, 168, 'R', 'R'));
  return svg;
}

// ── Laboratorio interactivo de la ley de Ohm ────────────────────────────────

/**
 * Sliders de V y R; se ve al instante como cambia I, como cambia la potencia y
 * como responde la ampolleta. Es el widget donde la ley de Ohm deja de ser una
 * formula y pasa a ser una intuicion.
 */
export function laboratorioOhm({ v0 = 9, r0 = 100 } = {}) {
  // El halo de la ampolleta lleva blur(9px), que se extiende unos 27 px mas alla
  // de su radio. El riel superior va suficientemente abajo para que quepa entero.
  const W = 470, H = 250;
  const yT = 76, yB = 210, xL = 60, xR = 380;
  const cyF = (yT + yB) / 2;
  const cxAmp = 220;

  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'viz viz-lab', role: 'img',
    'aria-label': 'Circuito con fuente y resistencia variables alimentando una ampolleta' });
  svg.appendChild(defsFlecha());

  // Malla: fuente a la izquierda, ampolleta arriba, resistencia a la derecha.
  svg.appendChild(s('polyline', { points: `${xL},${cyF - 23} ${xL},${yT} ${cxAmp - 30},${yT}`, class: 'cz-cable' }));
  svg.appendChild(s('polyline', {
    points: `${cxAmp + 30},${yT} ${xR},${yT} ${xR},${yB} ${xL},${yB} ${xL},${cyF + 23}`,
    class: 'cz-cable',
  }));

  // Fuente
  svg.appendChild(s('line', { x1: xL - 17, y1: cyF - 8, x2: xL + 17, y2: cyF - 8, class: 'cz-barra-larga' }));
  svg.appendChild(s('line', { x1: xL - 8, y1: cyF + 8, x2: xL + 8, y2: cyF + 8, class: 'cz-barra-corta' }));
  const etqV = s('text', { x: xL - 24, y: cyF + 5, 'text-anchor': 'end', class: 'cz-valor' }, [t('')]);
  svg.appendChild(etqV);

  // Ampolleta
  const halo = s('circle', { cx: cxAmp, cy: yT, r: 34, class: 'viz-halo' });
  svg.appendChild(halo);
  const bulbo = s('circle', { cx: cxAmp, cy: yT, r: 21, class: 'viz-bulbo' });
  svg.appendChild(bulbo);
  svg.appendChild(s('path', {
    d: `M${cxAmp - 11} ${yT} q5.5 -11 11 0 q5.5 11 11 0`, class: 'viz-filamento',
  }));
  svg.appendChild(s('line', { x1: cxAmp - 30, y1: yT, x2: cxAmp - 21, y2: yT, class: 'cz-cable' }));
  svg.appendChild(s('line', { x1: cxAmp + 21, y1: yT, x2: cxAmp + 30, y2: yT, class: 'cz-cable' }));

  // Resistencia (rama derecha, vertical)
  const largo = 66, amp = 11, n = 6, paso = largo / n, ini = cyF - largo / 2;
  const pts = [[xR, ini]];
  for (let i = 0; i < n; i++) pts.push([xR + (i % 2 === 0 ? -1 : 1) * amp, ini + paso * (i + 0.5)]);
  pts.push([xR, ini + largo]);
  svg.appendChild(s('rect', { x: xR - 6, y: ini - 6, width: 12, height: largo + 12, class: 'cz-tapa' }));
  svg.appendChild(s('path', {
    d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' '), class: 'cz-zig',
  }));
  const etqR = s('text', { x: xR + 24, y: cyF + 5, class: 'cz-valor' }, [t('')]);
  svg.appendChild(etqR);

  // Electrones: su velocidad es la corriente.
  const loop = `M${xL} ${cyF - 23} L${xL} ${yT} L${xR} ${yT} L${xR} ${yB} L${xL} ${yB} L${xL} ${cyF + 23}`;
  let capaE = electrones(loop, { cantidad: 9, dur: 4 });
  svg.appendChild(capaE);

  // ── Controles y lectura ──
  const lecturaI = h('b');
  const lecturaP = h('b');
  const salV = h('output');
  const salR = h('output');

  const slV = h('input', { type: 'range', min: '1', max: '24', step: '0.5', value: String(v0),
    'aria-label': 'Voltaje de la fuente' });
  const slR = h('input', { type: 'range', min: '10', max: '1000', step: '10', value: String(r0),
    'aria-label': 'Resistencia' });

  function actualizar() {
    const V = Number(slV.value);
    const R = Number(slR.value);
    const I = V / R;
    const P = V * I;

    salV.textContent = `${V} V`;
    salR.textContent = formatear(R, 'Ω');
    etqV.firstChild.nodeValue = `${V} V`;
    etqR.firstChild.nodeValue = formatear(R, 'Ω');
    lecturaI.textContent = formatear(I, 'A');
    lecturaP.textContent = formatear(P, 'W');

    // El brillo satura: mas alla de ~0.9 W la ampolleta ya esta a full.
    const brillo = Math.min(1, P / 0.9);
    halo.setAttribute('opacity', (brillo * 0.85).toFixed(3));
    halo.setAttribute('r', String(26 + brillo * 16));
    bulbo.style.setProperty('--brillo', brillo.toFixed(3));

    // Redibujar los electrones es la unica via fiable de cambiar el `dur` de
    // animateMotion en todos los navegadores.
    const dur = Math.max(0.35, Math.min(9, 0.45 / Math.max(I, 1e-4)));
    const nuevo = electrones(loop, { cantidad: 9, dur });
    svg.replaceChild(nuevo, capaE);
    capaE = nuevo;
  }

  slV.addEventListener('input', actualizar);
  slR.addEventListener('input', actualizar);

  const panel = h('div', { class: 'lab' }, [
    svg,
    h('div', { class: 'lab-lecturas' }, [
      h('div', { class: 'lect' }, [h('span', {}, ['Corriente I']), lecturaI]),
      h('div', { class: 'lect' }, [h('span', {}, ['Potencia P']), lecturaP]),
    ]),
    h('div', { class: 'lab-controles' }, [
      h('label', {}, [h('span', {}, ['Voltaje V ', salV]), slV]),
      h('label', {}, [h('span', {}, ['Resistencia R ', salR]), slR]),
    ]),
  ]);
  actualizar();
  return panel;
}

// ── Cable ancho vs cable angosto ────────────────────────────────────────────

/** Por que un conductor mas delgado resiste mas: menos ancho, menos paso. */
export function seccionConductor() {
  const svg = s('svg', { viewBox: '0 0 460 200', class: 'viz', role: 'img',
    'aria-label': 'Comparacion entre conductor grueso y delgado' });

  const via = (y, alto, dur, rot) => {
    const g = s('g', {});
    g.appendChild(s('rect', { x: 70, y: y - alto / 2, width: 320, height: alto, rx: alto / 2, class: 'viz-tubo-r' }));
    const cant = Math.max(3, Math.round(alto / 9));
    for (let i = 0; i < cant; i++) {
      const yy = y - alto / 2 + (alto / (cant + 1)) * (i + 1);
      g.appendChild(electrones(`M74 ${yy} L386 ${yy}`, { cantidad: 5, dur }));
    }
    g.appendChild(s('text', { x: 30, y: y + 5, 'text-anchor': 'middle', class: 'viz-rot' }, [t(rot)]));
    return g;
  };

  svg.appendChild(via(60, 46, 2.4, 'ancho'));
  svg.appendChild(s('text', { x: 400, y: 65, class: 'viz-rot viz-ok' }, [t('R baja')]));
  svg.appendChild(via(150, 16, 5.5, 'angosto'));
  svg.appendChild(s('text', { x: 400, y: 155, class: 'viz-rot viz-mal' }, [t('R alta')]));
  return svg;
}

// ── Serie vs paralelo, lado a lado ──────────────────────────────────────────

/**
 * Un solo camino contra varios.
 *
 * Se dibuja con el mismo lenguaje que los circuitos de los ejercicios —cable
 * gris, zigzag, electrones ambar— y no con formas abstractas: la comparacion
 * solo sirve si el alumno reconoce aqui lo mismo que va a ver despues.
 */
export function serieVsParalelo() {
  const W = 520, H = 250;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'viz', role: 'img',
    'aria-label': 'Comparacion entre una conexion serie y una paralelo' });

  const yT = 74, yB = 188;
  const cyF = (yT + yB) / 2;

  /** Media fuente: solo las dos barras, sin etiqueta de valor. */
  const pila = (cx) => {
    const g = s('g', {});
    g.appendChild(s('line', { x1: cx - 15, y1: cyF - 7, x2: cx + 15, y2: cyF - 7, class: 'cz-barra-larga' }));
    g.appendChild(s('line', { x1: cx - 7, y1: cyF + 7, x2: cx + 7, y2: cyF + 7, class: 'cz-barra-corta' }));
    return g;
  };

  // ── Serie: un lazo, y todo lo que circula pasa por las dos resistencias ──
  const sL = 40, sR = 214;
  svg.appendChild(s('text', { x: (sL + sR) / 2, y: 34, 'text-anchor': 'middle', class: 'viz-titulo' },
    [t('SERIE')]));
  svg.appendChild(cable([[sL, cyF - 22], [sL, yT], [sR, yT]]));
  svg.appendChild(cable([[sR, yT], [sR, yB], [sL, yB], [sL, cyF + 22]]));
  svg.appendChild(pila(sL));

  const pasoS = (sR - sL) / 3;
  [1, 2].forEach((k) => {
    const cx = sL + pasoS * k;
    svg.appendChild(s('rect', { x: cx - 20, y: yT - 6, width: 40, height: 12, class: 'cz-tapa' }));
    svg.appendChild(zigzag(cx, yT, 34, false, 9));
    svg.appendChild(s('text', { x: cx, y: yT - 16, 'text-anchor': 'middle', class: 'viz-rot' },
      [t(`R${k === 1 ? '₁' : '₂'}`)]));
  });

  svg.appendChild(electrones(
    `M${sL} ${cyF - 22} L${sL} ${yT} L${sR} ${yT} L${sR} ${yB} L${sL} ${yB} L${sL} ${cyF + 22}`,
    { cantidad: 7, dur: 5 }));
  svg.appendChild(s('text', { x: (sL + sR) / 2, y: 220, 'text-anchor': 'middle', class: 'viz-rot' },
    [t('misma I, se suman las R')]));

  // ── Paralelo: dos ramas, y el flujo se reparte entre ellas ──
  const pL = 306, pR = 480;
  svg.appendChild(s('text', { x: (pL + pR) / 2, y: 34, 'text-anchor': 'middle', class: 'viz-titulo' },
    [t('PARALELO')]));
  const ramas = [pL + 76, pR];
  svg.appendChild(cable([[pL, cyF - 22], [pL, yT], [pR, yT]]));
  svg.appendChild(cable([[pL, cyF + 22], [pL, yB], [pR, yB]]));
  svg.appendChild(pila(pL));

  ramas.forEach((x, i) => {
    svg.appendChild(cable([[x, yT], [x, yB]]));
    svg.appendChild(s('rect', { x: x - 6, y: cyF - 20, width: 12, height: 40, class: 'cz-tapa' }));
    svg.appendChild(zigzag(x, cyF, 34, true, 9));
    svg.appendChild(s('text', {
      x: i === 0 ? x - 14 : x + 14, y: cyF + 4,
      'text-anchor': i === 0 ? 'end' : 'start', class: 'viz-rot',
    }, [t(i === 0 ? 'R₁' : 'R₂')]));
  });

  // Dos recorridos distintos: el que se desvia por la primera rama va mas
  // rapido y lleva mas puntos, porque por ahi pasa mas corriente.
  svg.appendChild(electrones(
    `M${pL} ${cyF - 22} L${pL} ${yT} L${ramas[0]} ${yT} L${ramas[0]} ${yB} L${pL} ${yB} L${pL} ${cyF + 22}`,
    { cantidad: 5, dur: 3 }));
  svg.appendChild(electrones(
    `M${pL} ${cyF - 22} L${pL} ${yT} L${ramas[1]} ${yT} L${ramas[1]} ${yB} L${pL} ${yB} L${pL} ${cyF + 22}`,
    { cantidad: 6, dur: 4.2 }));
  svg.appendChild(s('circle', { cx: ramas[0], cy: yT, r: 4, class: 'cz-nodo' }));
  svg.appendChild(s('circle', { cx: ramas[0], cy: yB, r: 4, class: 'cz-nodo' }));

  svg.appendChild(s('text', { x: (pL + pR) / 2, y: 220, 'text-anchor': 'middle', class: 'viz-rot' },
    [t('mismo V, se reparte la I')]));
  return svg;
}

// ── Divisor de voltaje animado ──────────────────────────────────────────────

/** La caida se reparte en proporcion a cada R: se ve como dos barras. */
export function barrasDivisor(v, r1, r2) {
  const total = r1 + r2;
  const v1 = (v * r1) / total;
  const v2 = (v * r2) / total;
  const anchoTotal = 380;
  const svg = s('svg', { viewBox: '0 0 440 150', class: 'viz', role: 'img',
    'aria-label': 'Reparto del voltaje entre dos resistencias' });

  const barra = (y, ancho, texto, clase) => {
    const g = s('g', {});
    g.appendChild(s('rect', { x: 30, y, width: ancho, height: 38, rx: 8, class: `viz-barra ${clase}` }));
    // Con repartos muy desiguales la barra chica no alcanza para su propio
    // rotulo: entonces el texto se escribe al lado, en color de texto normal.
    const anchoTexto = texto.length * 8.2;
    const cabeDentro = ancho >= anchoTexto + 14;
    g.appendChild(s('text', {
      x: cabeDentro ? 30 + ancho / 2 : 30 + ancho + 10,
      y: y + 25,
      'text-anchor': cabeDentro ? 'middle' : 'start',
      class: cabeDentro ? 'viz-barra-txt' : 'viz-barra-txt fuera',
    }, [t(texto)]));
    return g;
  };
  svg.appendChild(s('text', { x: 30, y: 22, class: 'viz-rot' }, [t(`Fuente: ${v} V`)]));
  svg.appendChild(barra(34, anchoTotal * (r1 / total), `V₁ = ${v1.toFixed(2)} V`, 'b1'));
  svg.appendChild(barra(86, anchoTotal * (r2 / total), `V₂ = ${v2.toFixed(2)} V`, 'b2'));
  svg.appendChild(s('text', { x: 30, y: 142, class: 'viz-rot' },
    [t(`R₁ = ${formatear(r1, 'Ω')}   ·   R₂ = ${formatear(r2, 'Ω')}`)]));
  return svg;
}
