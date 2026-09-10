// 02-serie-paralelo.js — como se combinan las resistencias y como se reparten
// voltaje y corriente en cada topologia.

import { serieVsParalelo, barrasDivisor } from '../js/visuales.js';

export default {
  id: 'topologias',
  titulo: 'Serie y paralelo',
  subtitulo: 'Combinar resistencias',
  icono: '🔀',
  color: 'azul',
  lecciones: [

    // ── 2.1 ──────────────────────────────────────────────────────────────
    {
      id: 't-serie',
      titulo: 'En serie',
      xp: 25,
      pasos: [
        {
          tipo: 'info',
          emoji: '➡️',
          titulo: 'Un solo camino',
          visual: () => serieVsParalelo(),
          cuerpo: `
            <p>Dos elementos están <b>en serie</b> cuando comparten un nodo por el que no se va
            nadie más: toda la carga que sale de uno entra al otro.</p>
            <p class="formula">I es la misma en todos &nbsp;·&nbsp; R<sub>eq</sub> = R₁ + R₂ + R₃ + …</p>
            <p>El voltaje de la fuente <b>se reparte</b> entre ellas, y a la que tiene más
            resistencia le toca más voltaje.</p>`,
        },
        {
          tipo: 'alternativas',
          pregunta: '¿Qué magnitud es <b>igual</b> en todas las resistencias de una conexión serie?',
          circuito: {
            tipo: 'serie',
            fuente: { etiqueta: '12 V' },
            ramas: [{ nombre: 'R₁', valor: '100 Ω' }, { nombre: 'R₂', valor: '200 Ω' }],
            corriente: { etiqueta: 'I' },
          },
          opciones: [
            'La corriente',
            'El voltaje sobre cada una',
            'La potencia disipada',
            'Ninguna: todo cambia de una a otra',
          ],
          correcta: 0,
          explicacion: `<p>Hay <b>un solo camino</b>, así que la misma corriente atraviesa todo.
            El voltaje y la potencia, en cambio, se reparten según cada R.</p>`,
        },
        {
          tipo: 'entrada',
          enunciado: 'Tres resistencias en serie: <b>330 Ω</b>, <b>470 Ω</b> y <b>1 kΩ</b>. ¿Cuál es la R equivalente?',
          circuito: {
            tipo: 'serie',
            fuente: { etiqueta: '9 V' },
            ramas: [
              { nombre: 'R₁', valor: '330 Ω' },
              { nombre: 'R₂', valor: '470 Ω' },
              { nombre: 'R₃', valor: '1 kΩ' },
            ],
            corriente: { velocidad: 0.7 },
          },
          unidad: 'Ω',
          respuesta: 1800,
          pista: '<p>En serie simplemente se suman. Cuidado con el kilo: 1 kΩ = 1000 Ω.</p>',
          solucion: '<p>330 + 470 + 1000 = <b>1800 Ω = 1.8 kΩ</b>.</p>',
        },
        {
          tipo: 'alternativas',
          pregunta: 'En serie, la resistencia equivalente siempre es…',
          opciones: [
            'Mayor que la más grande de todas',
            'Menor que la más chica de todas',
            'El promedio de todas',
            'Igual a la más grande',
          ],
          correcta: 0,
          explicacion: `<p>Sumar solo puede aumentar. Agregar una resistencia en serie siempre
            <b>estorba más</b> el paso de corriente.</p>`,
        },
        {
          tipo: 'completar',
          enunciado: 'Por este circuito circulan <b>10 mA</b>. Completa el voltaje de la fuente.',
          circuito: {
            tipo: 'serie',
            fuente: { hueco: { id: 'v', unidad: 'V', etiqueta: 'Fuente' } },
            ramas: [{ nombre: 'R₁', valor: '330 Ω' }, { nombre: 'R₂', valor: '470 Ω' }],
            corriente: { etiqueta: 'I = 10 mA', velocidad: 1 },
          },
          huecos: [{ id: 'v', respuesta: 8, unidad: 'V', etiqueta: 'Fuente' }],
          pista: '<p>Primero suma las resistencias, después aplica V = I · R<sub>eq</sub>.</p>',
          solucion: '<p>R<sub>eq</sub> = 330 + 470 = 800 Ω. V = 0.01 × 800 = <b>8 V</b>.</p>',
        },
        {
          tipo: 'completar',
          enunciado: 'La corriente medida es <b>20 mA</b>. ¿Qué valor debe tener R₂?',
          circuito: {
            tipo: 'serie',
            fuente: { etiqueta: '10 V' },
            ramas: [
              { nombre: 'R₁', valor: '150 Ω' },
              { nombre: 'R₂', hueco: { id: 'r2', unidad: 'Ω', etiqueta: 'R₂' }, destacado: true },
            ],
            corriente: { etiqueta: 'I = 20 mA', velocidad: 1.2 },
          },
          huecos: [{ id: 'r2', respuesta: 350, unidad: 'Ω', etiqueta: 'R₂' }],
          pista: '<p>Saca la R<sub>eq</sub> total con la ley de Ohm y réstale R₁.</p>',
          solucion: `<p>R<sub>eq</sub> = 10 / 0.02 = 500 Ω. Como están en serie,
            R₂ = 500 − 150 = <b>350 Ω</b>.</p>`,
        },
      ],
    },

    // ── 2.2 ──────────────────────────────────────────────────────────────
    {
      id: 't-paralelo',
      titulo: 'En paralelo',
      xp: 25,
      pasos: [
        {
          tipo: 'info',
          emoji: '🔱',
          titulo: 'Varios caminos, mismo voltaje',
          circuito: {
            tipo: 'paralelo',
            fuente: { etiqueta: '12 V' },
            ramas: [{ nombre: 'R₁', valor: '100 Ω' }, { nombre: 'R₂', valor: '100 Ω' }],
            corriente: { velocidad: 1.6 },
          },
          cuerpo: `
            <p>Dos elementos están <b>en paralelo</b> cuando sus dos extremos comparten los mismos
            nodos. Al estar entre los mismos puntos, tienen <b>el mismo voltaje</b>.</p>
            <p class="formula">1/R<sub>eq</sub> = 1/R₁ + 1/R₂ + …</p>
            <p>Para solo dos resistencias existe el atajo del <b>producto sobre la suma</b>:</p>
            <p class="formula">R<sub>eq</sub> = R₁·R₂ / (R₁ + R₂)</p>
            <p class="dato">Agregar una rama en paralelo es abrir otro camino: la corriente total
            <b>sube</b> y la resistencia equivalente <b>baja</b>.</p>`,
        },
        {
          tipo: 'alternativas',
          pregunta: '¿Qué magnitud es <b>igual</b> en dos resistencias conectadas en paralelo?',
          opciones: [
            'El voltaje sobre cada una',
            'La corriente por cada una',
            'La potencia de cada una',
            'La resistencia de cada una',
          ],
          correcta: 0,
          explicacion: `<p>Comparten ambos nodos, y el voltaje es una diferencia <b>entre nodos</b>:
            si los nodos son los mismos, la diferencia también.</p>`,
        },
        {
          tipo: 'entrada',
          enunciado: 'Dos resistencias de <b>100 Ω</b> en paralelo. ¿Cuál es la R equivalente?',
          circuito: {
            tipo: 'paralelo',
            fuente: { etiqueta: '10 V' },
            ramas: [{ nombre: 'R₁', valor: '100 Ω' }, { nombre: 'R₂', valor: '100 Ω' }],
            corriente: { velocidad: 1.6 },
          },
          unidad: 'Ω',
          respuesta: 50,
          pista: '<p>Con <i>n</i> resistencias <b>iguales</b> en paralelo: R<sub>eq</sub> = R/n.</p>',
          solucion: '<p>100·100 / (100+100) = 10000/200 = <b>50 Ω</b>. La mitad, como manda la regla R/n.</p>',
        },
        {
          tipo: 'entrada',
          enunciado: '<b>300 Ω</b> en paralelo con <b>600 Ω</b>. ¿R equivalente?',
          unidad: 'Ω',
          respuesta: 200,
          pista: '<p>Producto sobre suma: (300 × 600) / (300 + 600).</p>',
          solucion: '<p>180000 / 900 = <b>200 Ω</b>. Menor que 300, que es la más chica: siempre pasa.</p>',
        },
        {
          tipo: 'alternativas',
          pregunta: 'En paralelo, la resistencia equivalente siempre es…',
          opciones: [
            'Menor que la más chica de todas',
            'Mayor que la más grande de todas',
            'El promedio de todas',
            'La suma de todas',
          ],
          correcta: 0,
          explicacion: `<p>Cada rama nueva es un camino extra, así que en conjunto <b>estorban menos</b>
            que cualquiera por separado. Si te da un valor mayor que la más chica, revisa: te equivocaste.</p>`,
        },
        {
          tipo: 'alternativas',
          pregunta: 'Una rama en paralelo se <b>corta</b> (queda abierta). ¿Qué pasa con la otra rama?',
          circuito: {
            tipo: 'paralelo',
            fuente: { etiqueta: '12 V' },
            ramas: [{ nombre: 'R₁', valor: '100 Ω' }, { nombre: 'R₂', valor: '100 Ω' }],
            corriente: { velocidad: 1.4 },
          },
          opciones: [
            'Sigue con el mismo voltaje y la misma corriente que antes',
            'Se apaga también',
            'Le llega el doble de voltaje',
            'Su corriente cae a la mitad',
          ],
          correcta: 0,
          explicacion: `<p>Cada rama ve directamente el voltaje de la fuente, así que su corriente
            no depende de las otras. Por eso las ampolletas de una casa se conectan en <b>paralelo</b>:
            si una se quema, el resto sigue funcionando.</p>`,
        },
        {
          tipo: 'completar',
          enunciado: 'Por R₂ circulan <b>30 mA</b>. Completa su valor.',
          circuito: {
            tipo: 'paralelo',
            fuente: { etiqueta: '24 V' },
            ramas: [
              { nombre: 'R₁', valor: '1.2 kΩ' },
              { nombre: 'R₂', hueco: { id: 'r2', unidad: 'Ω', etiqueta: 'R₂' }, destacado: true },
            ],
            corriente: { velocidad: 1.5 },
          },
          huecos: [{ id: 'r2', respuesta: 800, unidad: 'Ω', etiqueta: 'R₂' }],
          pista: '<p>R₂ está directamente sobre la fuente: tiene los 24 V completos encima.</p>',
          solucion: `<p>R₂ = 24 / 0.03 = <b>800 Ω</b>. Fíjate que R₁ no entra en el cálculo para nada:
            en paralelo cada rama es independiente.</p>`,
        },
      ],
    },

    // ── 2.3 ──────────────────────────────────────────────────────────────
    {
      id: 't-divisor',
      titulo: 'Divisor de voltaje',
      xp: 25,
      pasos: [
        {
          tipo: 'info',
          emoji: '⚖️',
          titulo: 'El voltaje se reparte en proporción',
          visual: () => barrasDivisor(12, 100, 200),
          cuerpo: `
            <p>En una serie, la misma corriente pasa por todas. Como V = I·R, a cada resistencia le
            toca voltaje <b>en proporción directa a su valor</b>.</p>
            <p class="formula">V₁ = V · R₁ / (R₁ + R₂)</p>
            <p>En el ejemplo, R₂ es el doble de R₁, así que se queda con el doble de voltaje:
            4 V y 8 V, que suman los 12 V de la fuente.</p>
            <p class="dato">Este es probablemente el circuito más usado de toda la electrónica:
            sensores, referencias, ajustes de ganancia. Vale la pena que te salga de memoria.</p>`,
        },
        {
          tipo: 'alternativas',
          pregunta: 'En un divisor con R₁ = 1 kΩ y R₂ = 3 kΩ, ¿cuál se lleva más voltaje?',
          opciones: [
            'R₂, porque tiene mayor resistencia',
            'R₁, porque va primero',
            'Las dos exactamente lo mismo',
            'Depende de la corriente que circule',
          ],
          correcta: 0,
          explicacion: `<p>Misma corriente en ambas, así que gana la de mayor R. R₂ se lleva
            3/4 del total y R₁ solo 1/4.</p>`,
        },
        {
          tipo: 'entrada',
          enunciado: 'Divisor con <b>V = 10 V</b>, <b>R₁ = 2 kΩ</b> y <b>R₂ = 3 kΩ</b>. ¿Cuánto vale V₂ (sobre R₂)?',
          circuito: {
            tipo: 'serie',
            fuente: { etiqueta: '10 V' },
            ramas: [
              { nombre: 'R₁', valor: '2 kΩ' },
              { nombre: 'R₂', valor: '3 kΩ', destacado: true },
            ],
            corriente: { velocidad: 0.8 },
          },
          unidad: 'V',
          respuesta: 6,
          pista: '<p>V₂ = V · R₂/(R₁+R₂). La fracción es la parte de la resistencia total que aporta R₂.</p>',
          solucion: '<p>V₂ = 10 × 3000/5000 = 10 × 0.6 = <b>6 V</b>. Y sobre R₁ quedan los otros 4 V.</p>',
        },
        {
          tipo: 'alternativas',
          pregunta: 'Quieres sacar <b>la mitad</b> del voltaje de entrada. ¿Cómo eliges las resistencias?',
          opciones: [
            'R₁ = R₂, con cualquier valor',
            'R₂ debe ser el doble de R₁',
            'R₁ debe ser el doble de R₂',
            'R₂ tiene que valer exactamente 1 kΩ',
          ],
          correcta: 0,
          explicacion: `<p>Si son iguales, cada una se lleva la mitad. El valor absoluto solo
            define cuánta corriente consume el divisor, no la razón de división.</p>`,
        },
        {
          tipo: 'completar',
          enunciado: 'Necesitas que sobre R₂ queden exactamente <b>3 V</b>. Completa R₂.',
          circuito: {
            tipo: 'serie',
            fuente: { etiqueta: '12 V' },
            ramas: [
              { nombre: 'R₁', valor: '3 kΩ' },
              { nombre: 'R₂', hueco: { id: 'r2', unidad: 'Ω', etiqueta: 'R₂' }, destacado: true },
            ],
            corriente: { velocidad: 0.8 },
          },
          huecos: [{ id: 'r2', respuesta: 1000, unidad: 'Ω', etiqueta: 'R₂' }],
          pista: `<p>Si R₂ se queda con 3 de 12 V, a R₁ le tocan 9 V. Las resistencias están en la
            misma proporción que los voltajes.</p>`,
          solucion: `<p>R₂/R₁ = V₂/V₁ = 3/9 = 1/3, así que R₂ = 3000/3 = <b>1000 Ω = 1 kΩ</b>.</p>`,
        },
      ],
    },

    // ── 2.4 ──────────────────────────────────────────────────────────────
    {
      id: 't-mixtos',
      titulo: 'Circuitos mixtos',
      xp: 35,
      pasos: [
        {
          tipo: 'info',
          emoji: '🧩',
          titulo: 'Resolver de adentro hacia afuera',
          circuito: {
            tipo: 'mixto',
            fuente: { etiqueta: '12 V' },
            serie: [{ nombre: 'R₁', valor: '100 Ω' }],
            paralelo: [{ nombre: 'R₂', valor: '200 Ω' }, { nombre: 'R₃', valor: '200 Ω' }],
            corriente: { velocidad: 1.2 },
          },
          cuerpo: `
            <p>Ningún circuito real es puro serie o puro paralelo. La estrategia siempre es la misma:
            <b>colapsar los bloques más internos primero</b>.</p>
            <ol>
              <li>R₂ ∥ R₃ = 200·200/400 = <b>100 Ω</b></li>
              <li>Eso queda en serie con R₁: R<sub>eq</sub> = 100 + 100 = <b>200 Ω</b></li>
              <li>Corriente total: I = 12/200 = <b>60 mA</b></li>
              <li>Sobre R₁ caen 0.06 × 100 = 6 V, y los otros <b>6 V</b> quedan sobre el paralelo</li>
            </ol>`,
        },
        {
          tipo: 'entrada',
          enunciado: 'Mismo circuito. ¿Cuánta corriente pasa por <b>R₂</b>?',
          circuito: {
            tipo: 'mixto',
            fuente: { etiqueta: '12 V' },
            serie: [{ nombre: 'R₁', valor: '100 Ω' }],
            paralelo: [
              { nombre: 'R₂', valor: '200 Ω', destacado: true },
              { nombre: 'R₃', valor: '200 Ω' },
            ],
            corriente: { velocidad: 1.2 },
          },
          unidad: 'A',
          respuesta: 0.03,
          pista: '<p>Ya sabes que sobre el paralelo quedan 6 V, y R₂ los ve completos.</p>',
          solucion: `<p>I₂ = 6/200 = <b>30 mA</b>. Como R₂ = R₃, los 60 mA totales se parten
            en dos mitades iguales.</p>`,
        },
        {
          tipo: 'alternativas',
          pregunta: 'En el circuito mixto, si <b>cortas R₃</b>, ¿qué pasa con la corriente total?',
          opciones: [
            'Baja, porque sube la resistencia equivalente',
            'Sube, porque hay menos resistencias',
            'Queda igual, R₃ estaba en paralelo',
            'Se hace cero: el circuito queda abierto',
          ],
          correcta: 0,
          explicacion: `<p>Sin R₃, el bloque paralelo deja de existir y queda solo R₂ = 200 Ω.
            La R<sub>eq</sub> pasa de 200 a 300 Ω, así que la corriente cae de 60 mA a 40 mA.
            El circuito <b>no</b> se abre: R₂ sigue dando camino.</p>`,
        },
        {
          tipo: 'completar',
          enunciado: 'La corriente total medida es <b>60 mA</b>. Completa el valor de R₂.',
          circuito: {
            tipo: 'mixto',
            fuente: { etiqueta: '12 V' },
            serie: [{ nombre: 'R₁', valor: '100 Ω' }],
            paralelo: [
              { nombre: 'R₂', hueco: { id: 'r2', unidad: 'Ω', etiqueta: 'R₂' }, destacado: true },
              { nombre: 'R₃', valor: '300 Ω' },
            ],
            corriente: { etiqueta: 'I = 60 mA', velocidad: 1.2 },
          },
          huecos: [{ id: 'r2', respuesta: 150, unidad: 'Ω', etiqueta: 'R₂' }],
          pista: `<p>Con I y V sacas la R<sub>eq</sub> total; réstale R₁ para tener el paralelo,
            y después despeja de 1/R<sub>p</sub> = 1/R₂ + 1/R₃.</p>`,
          solucion: `<p>R<sub>eq</sub> = 12/0.06 = 200 Ω, así que el paralelo vale 200 − 100 = 100 Ω.<br>
            1/R₂ = 1/100 − 1/300 = 2/300, entonces R₂ = <b>150 Ω</b>.</p>`,
        },
        {
          tipo: 'completar',
          enunciado: 'Completa <b>los dos</b> valores para que circulen <b>50 mA</b> y sobre R₁ caigan <b>5 V</b>.',
          circuito: {
            tipo: 'mixto',
            fuente: { hueco: { id: 'v', unidad: 'V', etiqueta: 'Fuente' } },
            serie: [{ nombre: 'R₁', hueco: { id: 'r1', unidad: 'Ω', etiqueta: 'R₁' } }],
            paralelo: [{ nombre: 'R₂', valor: '400 Ω' }, { nombre: 'R₃', valor: '400 Ω' }],
            corriente: { etiqueta: 'I = 50 mA', velocidad: 1.3 },
          },
          huecos: [
            { id: 'v', respuesta: 15, unidad: 'V', etiqueta: 'Fuente' },
            { id: 'r1', respuesta: 100, unidad: 'Ω', etiqueta: 'R₁' },
          ],
          pista: `<p>R₁ es directo con la ley de Ohm. Para la fuente, calcula además cuánto cae
            sobre el paralelo y suma las dos caídas.</p>`,
          solucion: `<p>R₁ = 5 / 0.05 = <b>100 Ω</b>.<br>
            El paralelo vale 400∥400 = 200 Ω, y ahí caen 0.05 × 200 = 10 V.<br>
            La fuente debe entregar 5 + 10 = <b>15 V</b>.</p>`,
        },
      ],
    },
  ],
};
