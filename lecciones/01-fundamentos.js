// 01-fundamentos.js — voltaje, corriente, resistencia y la ley de Ohm.

import { analogiaHidraulica, trianguloOhm, laboratorioOhm, seccionConductor } from '../js/visuales.js';

export default {
  id: 'fundamentos',
  titulo: 'Fundamentos',
  subtitulo: 'Voltaje, corriente y resistencia',
  icono: '⚡',
  color: 'ambar',
  lecciones: [

    // ── 1.1 ──────────────────────────────────────────────────────────────
    {
      id: 'f-corriente',
      titulo: 'La corriente',
      xp: 20,
      pasos: [
        {
          tipo: 'info',
          emoji: '🌊',
          titulo: 'Corriente: carga en movimiento',
          visual: () => analogiaHidraulica('corriente'),
          cuerpo: `
            <p>La <b>corriente eléctrica</b> es el paso de carga por un punto del circuito.
            No es "electricidad que se gasta": es carga que <i>circula</i>.</p>
            <p class="formula">I = Q / t</p>
            <p>Si por un punto pasa <b>1 coulomb cada segundo</b>, ahí hay <b>1 ampere</b>.</p>
            <p class="dato">Se mide en <b>amperes (A)</b>, en honor a André-Marie Ampère.</p>`,
        },
        {
          tipo: 'alternativas',
          pregunta: '¿Qué mide exactamente la corriente eléctrica?',
          opciones: [
            'La cantidad de carga que pasa por un punto cada segundo',
            'La fuerza con que la fuente empuja las cargas',
            'La energía total almacenada en la batería',
            'La oposición que el material pone al paso de carga',
          ],
          correcta: 0,
          explicacion: `<p>Corriente es <b>caudal de carga</b>: I = Q/t. Las otras tres describen
            voltaje, energía y resistencia respectivamente.</p>`,
        },
        {
          tipo: 'alternativas',
          pregunta: 'Por un conductor pasan <b>6 coulomb en 2 segundos</b>. ¿Cuánta corriente circula?',
          opciones: ['3 A', '12 A', '0.33 A', '6 A'],
          correcta: 0,
          explicacion: `<p>I = Q/t = 6 C / 2 s = <b>3 A</b>. Ojo con invertir la división: t/Q daría 0.33,
            que es un error clásico.</p>`,
        },
        {
          tipo: 'alternativas',
          pregunta: 'En un circuito <b>abierto</b> (un cable cortado), ¿qué pasa con la corriente?',
          opciones: [
            'Es cero: no hay camino cerrado por donde circular',
            'Se duplica, porque ya no hay resistencia',
            'Sigue igual, la carga salta el corte',
            'Depende solo del voltaje de la fuente',
          ],
          correcta: 0,
          circuito: {
            tipo: 'serie',
            fuente: { etiqueta: '9 V' },
            ramas: [{ nombre: 'R', valor: '100 Ω' }],
            corriente: { velocidad: 0 },
            nota: 'circuito abierto: nada circula',
          },
          explicacion: `<p>La corriente necesita un <b>camino cerrado</b>. Sin lazo completo no
            circula carga, por mucho voltaje que tenga la fuente.</p>`,
        },
        {
          tipo: 'entrada',
          enunciado: 'Si por una sección pasan <b>0.5 C</b> en <b>250 ms</b>, ¿cuál es la corriente?',
          unidad: 'A',
          respuesta: 2,
          pista: '<p>Pasa todo a unidades base: 250 ms = 0.25 s. Después, I = Q/t.</p>',
          solucion: '<p>I = 0.5 C / 0.25 s = <b>2 A</b>.</p>',
        },
      ],
    },

    // ── 1.2 ──────────────────────────────────────────────────────────────
    {
      id: 'f-voltaje',
      titulo: 'El voltaje',
      xp: 20,
      pasos: [
        {
          tipo: 'info',
          emoji: '🔋',
          titulo: 'Voltaje: la diferencia que empuja',
          visual: () => analogiaHidraulica('voltaje'),
          cuerpo: `
            <p>El <b>voltaje</b> es la energía que gana o pierde cada unidad de carga al moverse
            entre dos puntos. Por eso su nombre formal es <b>diferencia de potencial</b>.</p>
            <p class="formula">V = E / Q</p>
            <p><b>1 volt</b> = 1 joule por coulomb.</p>
            <p class="dato">Clave: el voltaje <b>siempre es entre dos puntos</b>. Decir "el voltaje
            en este nodo" solo tiene sentido si hay una referencia (tierra) implícita.</p>`,
        },
        {
          tipo: 'alternativas',
          pregunta: '¿Por qué se dice que el voltaje es una magnitud <b>entre dos puntos</b>?',
          opciones: [
            'Porque es una diferencia de potencial: siempre se mide respecto de una referencia',
            'Porque el voltímetro tiene dos puntas de prueba',
            'Porque la batería tiene dos terminales',
            'Porque el voltaje se reparte a la mitad entre ambos puntos',
          ],
          correcta: 0,
          explicacion: `<p>Es una <b>diferencia</b>. Que el instrumento tenga dos puntas es la
            consecuencia, no la causa. Un solo punto no tiene voltaje propio sin referencia.</p>`,
        },
        {
          tipo: 'alternativas',
          pregunta: 'Una batería entrega <b>36 J</b> a cada <b>3 C</b> de carga que la atraviesa. ¿Qué voltaje tiene?',
          opciones: ['12 V', '108 V', '0.083 V', '39 V'],
          correcta: 0,
          explicacion: `<p>V = E/Q = 36 J / 3 C = <b>12 V</b>. El volt es literalmente joule por coulomb.</p>`,
        },
        {
          tipo: 'alternativas',
          pregunta: 'En la analogía hidráulica, ¿a qué corresponde el voltaje?',
          visual: () => analogiaHidraulica('voltaje'),
          opciones: [
            'A la altura del estanque (la presión disponible)',
            'Al caudal de agua que baja por la cañería',
            'Al ancho de la cañería',
            'Al volumen total de agua acumulada',
          ],
          correcta: 0,
          explicacion: `<p>La <b>altura</b> es lo que empuja. El caudal es la corriente y el
            estrechamiento es la resistencia. El volumen se parece más a la carga almacenada.</p>`,
        },
      ],
    },

    // ── 1.3 ──────────────────────────────────────────────────────────────
    {
      id: 'f-resistencia',
      titulo: 'La resistencia',
      xp: 20,
      pasos: [
        {
          tipo: 'info',
          emoji: '🧱',
          titulo: 'Resistencia: cuánto cuesta pasar',
          visual: () => analogiaHidraulica('resistencia'),
          cuerpo: `
            <p>La <b>resistencia</b> mide la oposición de un material al paso de la corriente.
            Se mide en <b>ohm (Ω)</b>.</p>
            <p class="formula">R = ρ · L / A</p>
            <p>Depende de tres cosas: el material (<b>ρ</b>, resistividad), el <b>largo L</b>
            (más largo, más resistencia) y la <b>sección A</b> (más grueso, menos resistencia).</p>
            <p class="dato">Esa energía que "cuesta pasar" no desaparece: se convierte en calor.
            Es exactamente el principio de una estufa eléctrica.</p>`,
        },
        {
          tipo: 'info',
          emoji: '🪢',
          titulo: 'Grueso contra delgado',
          visual: () => seccionConductor(),
          cuerpo: `<p>Con el mismo material y el mismo largo, el conductor de mayor sección deja
            pasar la carga con mucha menos oposición. Por eso los cables de alta corriente son gruesos.</p>`,
          textoBoton: 'Tiene sentido',
        },
        {
          tipo: 'alternativas',
          pregunta: 'Si <b>duplicas el largo</b> de un cable sin cambiar nada más, su resistencia…',
          opciones: [
            'Se duplica',
            'Se reduce a la mitad',
            'Queda igual',
            'Se multiplica por cuatro',
          ],
          correcta: 0,
          explicacion: `<p>En R = ρL/A el largo está en el <b>numerador</b>: al doble de largo,
            el doble de resistencia.</p>`,
        },
        {
          tipo: 'alternativas',
          pregunta: 'Si <b>duplicas el diámetro</b> de un cable, ¿qué pasa con su resistencia?',
          opciones: [
            'Cae a la cuarta parte',
            'Cae a la mitad',
            'Se duplica',
            'No cambia',
          ],
          correcta: 0,
          explicacion: `<p>Trampa clásica: la fórmula usa el <b>área</b>, no el diámetro.
            Al doble de diámetro, A = πd²/4 crece <b>×4</b>, así que R cae a <b>1/4</b>.</p>`,
        },
        {
          tipo: 'alternativas',
          pregunta: '¿Cuál de estos materiales tiene la <b>mayor</b> resistividad?',
          opciones: ['Vidrio', 'Cobre', 'Aluminio', 'Plata'],
          correcta: 0,
          explicacion: `<p>El vidrio es un <b>aislante</b>: resistividad enorme. La plata es el mejor
            conductor metálico, seguida del cobre; el aluminio conduce algo peor, pero pesa mucho menos,
            y por eso se usa en líneas aéreas de transmisión.</p>`,
        },
      ],
    },

    // ── 1.4 ──────────────────────────────────────────────────────────────
    {
      id: 'f-ohm',
      titulo: 'La ley de Ohm',
      xp: 30,
      pasos: [
        {
          tipo: 'info',
          emoji: '🔺',
          titulo: 'V = I · R',
          visual: () => trianguloOhm(),
          cuerpo: `
            <p>Las tres magnitudes que viste están amarradas por una sola relación:</p>
            <p class="formula">V = I · R &nbsp;&nbsp; I = V / R &nbsp;&nbsp; R = V / I</p>
            <p>El triángulo es el truco para no olvidarla: <b>tapa con el dedo</b> la magnitud que
            buscas y lo que queda a la vista es la operación.</p>`,
        },
        {
          tipo: 'info',
          emoji: '🎛️',
          titulo: 'Pruébala tú',
          visual: () => laboratorioOhm({ v0: 9, r0: 100 }),
          cuerpo: `<p>Mueve los deslizadores. Fíjate en dos cosas: la <b>velocidad</b> de los puntos
            (que es la corriente) y el <b>brillo</b> de la ampolleta (que es la potencia, P = V·I).</p>
            <p class="dato">Sube R con V fijo y la corriente cae. Sube V con R fija y la corriente sube
            proporcionalmente. Esa es toda la ley de Ohm.</p>`,
          textoBoton: 'Listo, ya jugué',
        },
        {
          tipo: 'alternativas',
          pregunta: 'Una resistencia de <b>220 Ω</b> conectada a <b>12 V</b>. ¿Qué corriente circula?',
          circuito: {
            tipo: 'serie',
            fuente: { etiqueta: '12 V' },
            ramas: [{ nombre: 'R', valor: '220 Ω', destacado: true }],
            corriente: { etiqueta: 'I', velocidad: 1 },
          },
          opciones: ['54.5 mA', '2640 A', '18.3 A', '5.45 A'],
          correcta: 0,
          explicacion: `<p>I = V/R = 12 / 220 = <b>0.0545 A = 54.5 mA</b>. La opción de 2640 sale de
            multiplicar en vez de dividir.</p>`,
        },
        {
          tipo: 'entrada',
          enunciado: 'Por una resistencia circulan <b>0.25 A</b> cuando tiene <b>5 V</b> encima. ¿Cuánto vale R?',
          unidad: 'Ω',
          respuesta: 20,
          pista: '<p>Tapa la R en el triángulo: queda V arriba de I.</p>',
          solucion: '<p>R = V/I = 5 / 0.25 = <b>20 Ω</b>.</p>',
        },
        {
          tipo: 'entrada',
          enunciado: '¿Qué voltaje hay sobre una resistencia de <b>1.5 kΩ</b> por la que pasan <b>8 mA</b>?',
          unidad: 'V',
          respuesta: 12,
          pista: '<p>Pasa todo a unidades base: 1.5 kΩ = 1500 Ω y 8 mA = 0.008 A.</p>',
          solucion: '<p>V = I·R = 0.008 × 1500 = <b>12 V</b>. Atajo útil: mA × kΩ = V directamente.</p>',
        },
        {
          tipo: 'alternativas',
          pregunta: 'Mantienes <b>V fijo</b> y <b>triplicas R</b>. ¿Qué pasa con la corriente?',
          opciones: [
            'Cae a un tercio',
            'Se triplica',
            'Queda igual',
            'Cae a un noveno',
          ],
          correcta: 0,
          explicacion: `<p>I = V/R con V constante: R e I son <b>inversamente proporcionales</b>.
            Triple de R, un tercio de corriente.</p>`,
        },
        {
          tipo: 'completar',
          enunciado: 'Completa el valor que falta para que el circuito entregue exactamente <b>100 mA</b>.',
          circuito: {
            tipo: 'serie',
            fuente: { etiqueta: '15 V' },
            ramas: [{ nombre: 'R', hueco: { id: 'r', unidad: 'Ω', etiqueta: 'R' } }],
            corriente: { etiqueta: 'I = 100 mA', velocidad: 1.4 },
          },
          huecos: [{ id: 'r', respuesta: 150, unidad: 'Ω', etiqueta: 'R' }],
          pista: '<p>R = V/I, con I en amperes: 100 mA = 0.1 A.</p>',
          solucion: '<p>R = 15 / 0.1 = <b>150 Ω</b>.</p>',
        },
      ],
    },
  ],
};
