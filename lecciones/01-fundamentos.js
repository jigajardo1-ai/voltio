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
            abierto: true,
            nota: 'el camino está interrumpido',
          },
          explicacion: `<p>La corriente necesita un <b>camino cerrado</b>. Sin lazo completo no
            circula carga, por mucho voltaje que tenga la fuente.</p>
            <p class="dato">Ojo con una confusión frecuente: <b>R sigue valiendo 100 Ω</b>. Eso es
            una propiedad del componente y no cambia porque cortes un cable en otra parte. Lo que
            se vuelve infinito es la resistencia <i>del camino</i>, por culpa del corte. Por eso
            I = V/R da cero: el infinito está en el denominador, pero no lo pone la resistencia.</p>`,
        },
        {
          tipo: 'entrada',
          enunciado: 'Si por una sección pasan <b>0.5 C</b> en <b>250 ms</b>, ¿cuál es la corriente?',
          unidad: 'A',
          respuesta: 2,
          pista: '<p>Pasa todo a unidades base: 250 ms = 0.25 s. Después, I = Q/t.</p>',
          solucion: '<p>I = 0.5 C / 0.25 s = <b>2 A</b>.</p>',
        },
        {
          tipo: 'entrada',
          enunciado: '¿Cuánta carga pasa en <b>1 minuto</b> por un punto donde circulan <b>150 mA</b>?',
          unidad: 'C',
          respuesta: 9,
          pista: '<p>Despeja Q de I = Q/t. Y ojo: el minuto hay que pasarlo a segundos.</p>',
          solucion: '<p>Q = I·t = 0.15 A × 60 s = <b>9 C</b>.</p>',
        },
        {
          tipo: 'multiple',
          pregunta: '¿Cuáles de estas afirmaciones sobre la corriente son <b>correctas</b>?',
          opciones: [
            'Necesita un camino cerrado para circular',
            'Se mide en amperes',
            'Es carga que se desplaza, no energía que se consume',
            'Se gasta a medida que recorre el circuito',
            'Solo existe si hay una batería química',
          ],
          correctas: [0, 1, 2],
          explicacion: `<p>Las tres primeras son la definición misma. Las otras dos son los dos
            malentendidos más comunes: la carga <b>no se gasta</b> (lo que se transforma es la
            energía que transporta), y cualquier fuente de voltaje sirve, no solo una pila.</p>`,
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
        {
          tipo: 'entrada',
          enunciado: '¿Cuánta energía entrega una fuente de <b>5 V</b> a <b>4 C</b> de carga?',
          unidad: 'J',
          respuesta: 20,
          pista: '<p>El volt es joule por coulomb, así que E = V · Q.</p>',
          solucion: '<p>E = 5 × 4 = <b>20 J</b>.</p>',
        },
        {
          tipo: 'emparejar',
          enunciado: 'Une cada magnitud con su unidad',
          pares: [
            { a: 'Voltaje', b: 'volt (V)' },
            { a: 'Corriente', b: 'ampere (A)' },
            { a: 'Resistencia', b: 'ohm (Ω)' },
            { a: 'Carga', b: 'coulomb (C)' },
            { a: 'Energía', b: 'joule (J)' },
          ],
          explicacion: `<p>Las unidades no son arbitrarias: <b>1 V = 1 J/C</b> y <b>1 A = 1 C/s</b>.
            Cada una está definida a partir de las otras.</p>`,
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
        {
          tipo: 'multiple',
          pregunta: '¿Qué cambios hacen que la resistencia de un conductor <b>aumente</b>?',
          opciones: [
            'Hacerlo más largo',
            'Hacerlo más delgado',
            'Cambiarlo por un material de mayor resistividad',
            'Hacerlo más grueso',
            'Acortarlo',
          ],
          correctas: [0, 1, 2],
          explicacion: `<p>En R = ρL/A suben la R las cosas que están en el <b>numerador</b>
            (largo y resistividad) y bajarla las del <b>denominador</b> (área). Engrosar o acortar
            siempre reduce la resistencia.</p>`,
        },
        {
          tipo: 'entrada',
          enunciado: `Un cable tiene <b>4 Ω</b>. Si lo cortas por la mitad y usas solo un trozo,
            ¿cuánta resistencia queda?`,
          unidad: 'Ω',
          respuesta: 2,
          pista: '<p>La resistencia es proporcional al largo: la mitad de largo, la mitad de R.</p>',
          solucion: '<p><b>2 Ω</b>. El material y la sección no cambiaron, solo el largo.</p>',
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
        {
          tipo: 'entrada',
          enunciado: 'Una resistencia de <b>4.7 kΩ</b> conectada a <b>9 V</b>. ¿Qué corriente circula, en mA?',
          unidad: 'mA',
          respuesta: 1.915,
          tolerancia: 0.02,
          pista: '<p>Atajo cómodo: <b>V ÷ kΩ = mA</b> directamente, sin convertir nada.</p>',
          solucion: '<p>I = 9 / 4.7 = <b>1.91 mA</b> (o 9 / 4700 = 0.00191 A, lo mismo).</p>',
        },
        {
          tipo: 'multiple',
          pregunta: '¿Cuáles de estas expresiones son formas <b>válidas</b> de la ley de Ohm?',
          opciones: ['V = I · R', 'I = V / R', 'R = V / I', 'I = R / V', 'V = R / I'],
          correctas: [0, 1, 2],
          explicacion: `<p>Las tres primeras son la misma ecuación despejada. Las dos últimas
            invierten la división: dan unidades que no existen y números absurdos.</p>`,
        },
        {
          tipo: 'completar',
          enunciado: 'Esta resistencia tiene <b>4.5 V</b> encima. Completa la fuente y la resistencia.',
          circuito: {
            tipo: 'serie',
            fuente: { hueco: { id: 'v', unidad: 'V', etiqueta: 'Fuente' } },
            ramas: [{ nombre: 'R', hueco: { id: 'r', unidad: 'Ω', etiqueta: 'R' } }],
            corriente: { etiqueta: 'I = 30 mA', velocidad: 1.2 },
          },
          huecos: [
            { id: 'v', respuesta: 4.5, unidad: 'V', etiqueta: 'Fuente' },
            { id: 'r', respuesta: 150, unidad: 'Ω', etiqueta: 'R' },
          ],
          pista: `<p>Si R es lo único en el lazo, todo el voltaje de la fuente cae sobre ella.
            Después, R = V/I.</p>`,
          solucion: `<p>La fuente entrega los mismos <b>4.5 V</b>, porque no hay nada más donde caer.<br>
            R = 4.5 / 0.03 = <b>150 Ω</b>.</p>`,
        },
      ],
    },

    // ── 1.5 ──────────────────────────────────────────────────────────────
    {
      id: 'f-potencia',
      titulo: 'La potencia',
      xp: 30,
      pasos: [
        {
          tipo: 'info',
          emoji: '🔥',
          titulo: 'Potencia: energía por segundo',
          visual: () => laboratorioOhm({ v0: 12, r0: 220 }),
          cuerpo: `
            <p>La <b>potencia</b> es el ritmo al que se entrega o se consume energía. Se mide en
            <b>watt (W)</b>: 1 W = 1 joule por segundo.</p>
            <p class="formula">P = V · I</p>
            <p>Y como V = I·R, hay dos formas más que salen solas y ahorran un paso:</p>
            <p class="formula">P = I²·R &nbsp;&nbsp; P = V²/R</p>
            <p class="dato">Esto es lo que decide si una resistencia aguanta o se quema. Una de
            1/4 W no puede disipar 2 W, por muy correcto que esté el cálculo de corriente.</p>`,
        },
        {
          tipo: 'entrada',
          enunciado: 'Por una resistencia pasan <b>0.5 A</b> con <b>12 V</b> encima. ¿Qué potencia disipa?',
          unidad: 'W',
          respuesta: 6,
          pista: '<p>Tienes V e I directamente: P = V·I.</p>',
          solucion: '<p>P = 12 × 0.5 = <b>6 W</b>. Esa energía se va en calor.</p>',
        },
        {
          tipo: 'entrada',
          enunciado: '¿Cuánta potencia disipa una resistencia de <b>100 Ω</b> con <b>200 mA</b>?',
          unidad: 'W',
          respuesta: 4,
          pista: '<p>Tienes I y R, así que la forma cómoda es P = I²·R. Pasa los mA a A primero.</p>',
          solucion: '<p>P = 0.2² × 100 = 0.04 × 100 = <b>4 W</b>. Ojo: la corriente va <b>al cuadrado</b>.</p>',
        },
        {
          tipo: 'alternativas',
          pregunta: 'Si <b>duplicas la corriente</b> por una resistencia, su potencia disipada…',
          opciones: [
            'Se multiplica por 4',
            'Se duplica',
            'Queda igual',
            'Se reduce a la mitad',
          ],
          correcta: 0,
          explicacion: `<p>En P = I²·R la corriente está <b>al cuadrado</b>: al doble de I,
            cuatro veces la potencia. Por eso las sobrecorrientes queman componentes tan rápido.</p>`,
        },
        {
          tipo: 'alternativas',
          pregunta: `Una ampolleta dice <b>60 W</b> a <b>220 V</b>. ¿Qué corriente consume?`,
          opciones: ['273 mA', '13.2 A', '3.67 A', '60 mA'],
          correcta: 0,
          explicacion: `<p>I = P/V = 60 / 220 = <b>0.273 A = 273 mA</b>. La opción de 13.2 A sale
            de multiplicar en vez de dividir.</p>`,
        },
        {
          tipo: 'multiple',
          pregunta: 'Tienes una resistencia de <b>1 kΩ</b> y <b>1/4 W</b>. ¿En qué casos <b>aguanta</b>?',
          opciones: [
            'Conectada a 5 V',
            'Conectada a 12 V',
            'Conectada a 24 V',
            'Con 10 mA circulando',
            'Con 30 mA circulando',
          ],
          correctas: [0, 1, 3],
          explicacion: `<p>El límite es 0.25 W. Con P = V²/R: a 5 V son 25 mW ✓, a 12 V son 144 mW ✓,
            pero a 24 V son <b>576 mW</b> ✗. Con P = I²·R: 10 mA dan 100 mW ✓ y 30 mA dan
            <b>900 mW</b> ✗. En la práctica se deja margen y no se trabaja al límite.</p>`,
        },
        {
          tipo: 'emparejar',
          enunciado: 'Une cada fórmula con lo que necesitas conocer para usarla',
          pares: [
            { a: 'P = V · I', b: 'voltaje y corriente' },
            { a: 'P = I² · R', b: 'corriente y resistencia' },
            { a: 'P = V² / R', b: 'voltaje y resistencia' },
            { a: 'I = V / R', b: 'voltaje y resistencia (da corriente)' },
          ],
          explicacion: `<p>Elegir la forma que calza con los datos que ya tienes ahorra un paso
            y evita arrastrar errores de redondeo.</p>`,
        },
      ],
    },
  ],
};
