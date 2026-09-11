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
escritorio/
  voltio_app.py         App de escritorio: ventana nativa sobre WebView2
herramientas/
  iconos.py             Genera los PNG y el .ico (sin dependencias)
manifest.webmanifest    Datos de la app instalable
service-worker.js       Caché offline; lo regenera build.py
iconos/                 PNG generados
build.py                Empaqueta todo y actualiza el service worker
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

## Instalar como app

El sitio publicado es una PWA: se instala en el PC y en el teléfono desde el navegador,
sin pasar por ninguna tienda.

<https://jigajardo1-ai.github.io/voltio>

- **Android / Chrome:** menú ⋮ → "Instalar aplicación".
- **iPhone / Safari:** botón compartir → "Añadir a pantalla de inicio".
- **PC (Chrome o Edge):** icono de instalar en la barra de direcciones.

Una vez instalada funciona sin internet, porque `service-worker.js` guarda todos los
archivos la primera vez. Cada `git push` actualiza el sitio, y la app instalada detecta la
versión nueva al abrirse y ofrece actualizar.

**`python build.py` es obligatorio antes de publicar**: reescribe la versión y la lista de
archivos del service worker a partir del contenido real. Si se llevaran a mano, tarde o
temprano se publica sin tocarlas y las apps instaladas se quedan calladas en la versión
vieja. Los iconos se generan aparte con `python herramientas/iconos.py`, y solo hace falta
si cambia el diseño.

## App de escritorio (.exe)

Además de la PWA, hay un ejecutable de Windows. Se compila solo en GitHub Actions
(`.github/workflows/exe.yml`), así que no hace falta instalar nada para generarlo: se
dispara desde la pestaña *Actions* o publicando una etiqueta `v*`.

No empaqueta un navegador: usa el **WebView2** que Windows 11 ya trae, así que pesa unos
pocos MB en vez de los ~100 de Electron. El progreso vive en `%LOCALAPPDATA%\Voltio`.

Para probarlo sin compilar:

```bash
pip install pywebview
python build.py
python escritorio/voltio_app.py
```

Dos detalles que parecen menores y no lo son:

- La app se sirve desde `127.0.0.1` con **puerto fijo**, no desde `file://`. El progreso se
  guarda en `localStorage`, que va por origen: un puerto distinto en cada arranque sería un
  origen distinto y el avance se perdería al cerrar.
- `webview.start()` va con `private_mode=False`. Por defecto pywebview arranca en modo
  privado y borra `localStorage` al salir, que es exactamente lo que no queremos.

**Sobre la firma:** el ejecutable no está firmado digitalmente, así que Windows muestra
"Windows protegió su PC" y algunos antivirus lo marcan como falso positivo. Firmarlo cuesta
una cuota anual; sin eso, esa fricción no se puede evitar.

## Guardado del progreso

El avance se guarda solo en `localStorage`, por navegador y dispositivo. No hay cuenta ni
servidor, así que se pierde si limpias los datos de navegación y no viaja solo a otro
equipo. Para eso están los respaldos, en Ajustes:

- **Descargar archivo** — un `.json` legible.
- **Copiar código** — el mismo contenido en base64, unos 300 caracteres: cabe en un mensaje
  y sirve para pasar el progreso al celular.

Restaurar acepta los dos formatos indistintamente, y **fusiona**: se queda con lo mejor de
cada lado, así que traer un respaldo viejo nunca te baja estrellas ya ganadas.

Si el navegador tiene el almacenamiento bloqueado (ventana privada, cookies bloqueadas), la
app lo detecta al arrancar y lo avisa en el mapa. Antes fallaba en silencio, que es la peor
forma de fallar: te enteras después de una hora de juego.

En el Artifact publicado la descarga usa la capacidad `downloads` del visor, porque ahí los
enlaces con `download` quedan inertes; fuera de ese contexto se usa un blob normal.

**Pendiente:** guardado vinculado a cuenta de Google (Firebase Auth + Firestore). No puede
funcionar dentro del Artifact —su CSP bloquea los scripts y las llamadas de Google— pero sí
en la versión local o desplegada en un hosting con https.

## Estado

- **Listo:** fundamentos (5 lecciones, incluida potencia) y serie/paralelo (4 lecciones):
  72 pasos en total, con XP, racha, vidas, estrellas y progreso guardado en el navegador.
- **Por escribir:** inductores, capacitores y Laplace. El temario de cada uno ya está en
  su archivo; falta convertirlo en pasos.
