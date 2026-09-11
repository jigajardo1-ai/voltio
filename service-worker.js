// service-worker.js — deja la app instalable y funcionando sin internet.
//
// VERSION y ARCHIVOS los reescribe `python build.py` a partir del contenido
// real del proyecto: si se editan a mano se desincronizan y la app se queda
// servindo una version vieja sin que nadie se entere.

const VERSION = 'v25f1eaf';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/circuito.js',
  './js/estado.js',
  './js/motor.js',
  './js/visuales.js',
  './lecciones/01-fundamentos.js',
  './lecciones/02-serie-paralelo.js',
  './lecciones/03-inductores.js',
  './lecciones/04-capacitores.js',
  './lecciones/05-laplace.js',
  './iconos/apple-touch-icon.png',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
  './iconos/icono-maskable-512.png',
];

const CACHE = `voltio-${VERSION}`;

// Al instalar se baja todo de una. Es lo que permite que la app abra sin
// internet desde la primera vez que se usa.
self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ARCHIVOS))
      // Sin esto el service worker nuevo espera a que se cierren todas las
      // pestañas; la pagina pregunta antes de activarlo (ver 'SALTAR_ESPERA').
      .catch(() => undefined),
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(
      nombres.filter((n) => n.startsWith('voltio-') && n !== CACHE)
        .map((n) => caches.delete(n)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (ev) => {
  if (ev.data === 'SALTAR_ESPERA') self.skipWaiting();
});

/**
 * Navegaciones: primero la red, con la copia guardada como red de seguridad.
 * Así, con conexión, siempre se abre la última versión; sin conexión, abre igual.
 */
async function estrategiaNavegacion(peticion) {
  try {
    const red = await fetch(peticion);
    const cache = await caches.open(CACHE);
    cache.put('./', red.clone());
    return red;
  } catch {
    const guardada = await caches.match('./', { ignoreSearch: true });
    return guardada || Response.error();
  }
}

/**
 * Recursos propios: primero la copia guardada, para que abra al instante, y de
 * paso se refresca en segundo plano para la próxima vez.
 */
async function estrategiaRecurso(peticion) {
  const cache = await caches.open(CACHE);
  const guardada = await cache.match(peticion, { ignoreSearch: true });

  const enRed = fetch(peticion).then((red) => {
    if (red && red.ok && red.type === 'basic') cache.put(peticion, red.clone());
    return red;
  }).catch(() => null);

  return guardada || (await enRed) || Response.error();
}

self.addEventListener('fetch', (ev) => {
  const { request } = ev;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Lo de fuera (las tipografías, por ejemplo) se deja al navegador.
  if (url.origin !== self.location.origin) return;

  ev.respondWith(
    request.mode === 'navigate'
      ? estrategiaNavegacion(request)
      : estrategiaRecurso(request),
  );
});
