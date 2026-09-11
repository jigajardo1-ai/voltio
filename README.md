# Voltio

App tipo Duolingo para aprender electricidad: teoría corta, animaciones que muestran el
mecanismo, alternativas que explican el error y circuitos con valores por completar.

Sin toolchain: HTML + módulos ES nativos. No hay `npm install` ni build obligatorio.

## Correr en local

Los módulos ES no cargan desde `file://`, así que hace falta un servidor estático:

```bash
python -m http.server 8777
```

Y abrir <http://localhost:8777>.

Para una versión de un solo archivo que sí funciona con doble clic:

```bash
python build.py
```

Eso deja `dist/voltio.html` con todo el CSS y JS incrustado. `python build.py --artifact`
genera el fragmento para publicar como Artifact.

## Estructura

```
index.html              Cascarón; carga js/app.js como módulo
css/app.css             Todos los estilos, con tokens y modo oscuro
js/
  app.js                Mapa de aprendizaje, navegación, reglas de desbloqueo
  motor.js              Reproduce una lección: pasos, corrección, feedback, XP
  circuito.js           Motor SVG de circuitos (serie, paralelo, mixto)
  visuales.js           Animaciones y widgets interactivos de las lecciones
  estado.js             Progreso en localStorage: XP, racha, vidas, estrellas
lecciones/
  01-fundamentos.js     Corriente, voltaje, resistencia, ley de Ohm
  02-serie-paralelo.js  Serie, paralelo, divisor de voltaje, mixtos
  03-inductores.js      Esqueleto (temario definido, pasos por escribir)
  04-capacitores.js     Esqueleto
  05-laplace.js         Esqueleto
pruebas/
  contenido.html        Valida todas las lecciones (lo primero al escribir contenido)
  circuitos.html        Banco visual de circuitos: desbordes y etiquetas encimadas
  figuras.html          Banco visual de las animaciones
  formatos.html         Lección sintética con un paso de cada tipo
  parser.html           Casos del parser de respuestas numéricas
build.py                Empaqueta todo en un archivo único
```

## Cómo agregar contenido

Una lección es una lista de pasos. Cada paso declara su `tipo` y el motor sabe pintarlo,
corregirlo y dar feedback.

```js
{
  tipo: 'alternativas',
  pregunta: '¿Qué corriente circula?',
  circuito: { tipo: 'serie', fuente: { etiqueta: '12 V' },
              ramas: [{ nombre: 'R', valor: '220 Ω' }] },
  opciones: ['54.5 mA', '2640 A', '18.3 A', '5.45 A'],
  correcta: 0,                    // índice en el array original, antes de barajar
  explicacion: '<p>I = V/R…</p>', // se muestra siempre, sobre todo al fallar
}
```

Tipos disponibles:

| tipo | para qué sirve | campos propios |
|---|---|---|
| `info` | teoría, definiciones, animaciones | `titulo`, `cuerpo`, `emoji`, `textoBoton` |
| `alternativas` | una sola correcta | `pregunta`, `opciones`, `correcta`, `explicacion` |
| `multiple` | varias correctas a la vez | `pregunta`, `opciones`, `correctas` (array) |
| `entrada` | respuesta numérica libre | `enunciado`, `respuesta`, `unidad`, `tolerancia` |
| `completar` | rellenar valores en el circuito | `enunciado`, `huecos`, `solucion` |
| `emparejar` | unir dos columnas | `enunciado`, `pares` (`{a, b}`) |
| `ordenar` | poner una secuencia en orden | `enunciado`, `pasos` (ya en orden correcto) |
| `senalar` | tocar un componente del diagrama | `enunciado`, `circuito` con `id`, `correcta`, `nombreCorrecto` |

Notas de cada formato:

- `multiple` se corrige **como conjunto**: sobra una o falta una y cuenta como error. No
  pongas todas las opciones como correctas.
- `emparejar` no lleva botón: se cierra solo al unir todos los pares, y corrige al instante.
- `ordenar` se responde tocando en orden, no arrastrando (con el dedo el arrastre falla y
  lo evaluado es el orden, no la destreza). El array `pasos` va **en el orden correcto**;
  la app los baraja.
- `senalar` necesita que las ramas del circuito lleven `id`, y `correcta` debe coincidir con
  uno de ellos. Solo pon `id` en circuitos de pasos `senalar`: en otros los vuelve clicables
  sin razón, y el validador lo marca.

Todos aceptan además `circuito` (spec declarativo) o `visual` (función que devuelve un nodo),
y `pista` con una ayuda plegable.

Para un ejercicio de completar, el hueco se declara en dos lados: dentro del circuito para
que aparezca el campo, y en `huecos` para saber qué se espera.

```js
{
  tipo: 'completar',
  enunciado: 'La corriente es <b>20 mA</b>. ¿Cuánto vale R₂?',
  circuito: {
    tipo: 'serie',
    fuente: { etiqueta: '10 V' },
    ramas: [{ nombre: 'R₁', valor: '150 Ω' },
            { nombre: 'R₂', hueco: { id: 'r2', unidad: 'Ω' }, destacado: true }],
  },
  huecos: [{ id: 'r2', respuesta: 350, unidad: 'Ω', etiqueta: 'R₂' }],
  solucion: '<p>R_eq = 10/0.02 = 500 Ω, entonces R₂ = 350 Ω.</p>',
}
```

El parser acepta `350`, `350 Ω`, `0,35k` y `350ohm` como la misma respuesta, con 1 % de
tolerancia por defecto (ajustable con `tolerancia`).

Un módulo nuevo se registra en el array `MODULOS` de `js/app.js`.

## Pruebas

No hay runner: son páginas que se abren en el navegador con el servidor levantado. Todas
importan los módulos con marca de tiempo, así que no hace falta vaciar la caché al iterar.

| página | qué comprueba |
|---|---|
| `/pruebas/contenido.html` | Todas las lecciones: índices de respuesta fuera de rango, huecos sin corrección, `senalar` apuntando a un `id` inexistente. **Es la que conviene mirar al escribir contenido.** |
| `/pruebas/parser.html` | El parser numérico acepta `350`, `350 Ω`, `0,35k`, `2k2`… |
| `/pruebas/circuitos.html` | Dibuja las topologías con el `viewBox` marcado. En consola, `desbordes()` y `colisiones()` deben devolver `[]`. |
| `/pruebas/figuras.html` | Lo mismo para las animaciones. Trae un informe visible arriba, y comprueba aparte que el halo de la ampolleta (que lleva blur, invisible a `getBBox`) quepa en el lienzo. |
| `/pruebas/formatos.html` | Lección sintética con un paso de cada tipo, para probar los formatos sin avanzar por el curso. |

Después de tocar `circuito.js` o `visuales.js`, mira los dos bancos visuales; después de
escribir lecciones, el validador de contenido.

## Estado

- **Listo:** fundamentos (5 lecciones, incluida potencia) y serie/paralelo (4 lecciones):
  72 pasos en total, con XP, racha, vidas, estrellas y progreso guardado en el navegador.
- **Por escribir:** inductores, capacitores y Laplace. El temario de cada uno ya está en
  su archivo; falta convertirlo en pasos.
