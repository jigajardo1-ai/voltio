#!/usr/bin/env python3
"""Voltio como aplicacion de escritorio.

Abre una ventana propia con la app dentro. No abre el navegador ni lo necesita:
usa el WebView2 que Windows ya trae, igual que lo usan muchas aplicaciones del
sistema. Tampoco se compila a .exe, a proposito: un ejecutable empaquetado sin
firma digital lo bloquean los antivirus, y esto es un script que se puede leer.

    python escritorio/voltio_app.py

El acceso directo del escritorio lo crea `python herramientas/acceso_directo.py`.
"""

from __future__ import annotations

import os
import socket
import sys
import threading
import urllib.request
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

APP = 'Voltio'

# El contenido se sirve desde 127.0.0.1 en un puerto fijo, y no desde file://,
# por una razon concreta: el progreso vive en localStorage, que se guarda por
# origen. Un puerto distinto en cada arranque seria un origen distinto y el
# avance se perderia al cerrar la app.
PUERTO = 17280

# De aqui se baja la version nueva cuando hay internet.
ORIGEN = 'https://jigajardo1-ai.github.io/voltio/app/voltio.html'


def carpeta_datos() -> Path:
    """Perfil del WebView y copia descargada de la app. Aqui vive el progreso."""
    base = os.environ.get('LOCALAPPDATA') or os.path.expanduser('~')
    destino = Path(base) / 'Voltio'
    destino.mkdir(parents=True, exist_ok=True)
    return destino


def copia_incluida() -> Path:
    """La que viene con el repo, por si nunca hubo internet."""
    return Path(__file__).resolve().parent.parent / 'dist' / 'voltio.html'


def html_a_usar(datos: Path) -> Path | None:
    """La descargada si existe; si no, la del repo."""
    bajada = datos / 'app.html'
    if bajada.exists() and bajada.stat().st_size > 1024:
        return bajada
    incluida = copia_incluida()
    return incluida if incluida.exists() else None


def buscar_actualizacion(datos: Path) -> None:
    """Descarga la ultima version para el proximo arranque.

    Va en un hilo aparte y se traga cualquier error: sin internet la app tiene
    que abrir igual, con la copia que ya tenga. Se aplica en el siguiente
    arranque y no en caliente, para no recargar la ventana mientras se usa.
    """
    try:
        pedido = urllib.request.Request(ORIGEN, headers={'User-Agent': 'Voltio-escritorio'})
        with urllib.request.urlopen(pedido, timeout=15) as r:
            nuevo = r.read()
        if len(nuevo) < 1024 or b'<title>' not in nuevo[:4096]:
            return                              # respuesta rara: no tocar nada
        destino = datos / 'app.html'
        if destino.exists() and destino.read_bytes() == nuevo:
            return
        # Escritura en dos pasos: si se corta la luz a medias, no queda un
        # archivo truncado que impida abrir la app.
        temporal = destino.with_suffix('.tmp')
        temporal.write_bytes(nuevo)
        temporal.replace(destino)
    except Exception:
        pass


class Silencioso(SimpleHTTPRequestHandler):
    """El de siempre, pero sin una linea de log por peticion."""

    def log_message(self, formato, *args):  # noqa: A002
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def puerto_libre(preferido: int) -> int:
    with socket.socket() as s:
        try:
            s.bind(('127.0.0.1', preferido))
            return preferido
        except OSError:
            pass
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def main() -> int:
    try:
        import webview
    except ImportError:
        print('Falta pywebview. Instala con:  pip install --user pywebview',
              file=sys.stderr)
        return 1

    datos = carpeta_datos()
    fuente = html_a_usar(datos)
    if fuente is None:
        print('No encuentro la app. Corre antes:  python build.py', file=sys.stderr)
        return 1

    # Se busca actualizacion en paralelo: la ventana no espera a la red.
    threading.Thread(target=buscar_actualizacion, args=(datos,), daemon=True).start()

    puerto = puerto_libre(PUERTO)
    manejador = partial(Silencioso, directory=str(fuente.parent))
    ThreadingHTTPServer.allow_reuse_address = True
    servidor = ThreadingHTTPServer(('127.0.0.1', puerto), manejador)
    threading.Thread(target=servidor.serve_forever, daemon=True).start()

    webview.create_window(
        APP,
        f'http://127.0.0.1:{puerto}/{fuente.name}',
        width=1000,
        height=880,
        min_size=(420, 560),
        background_color='#F4F6F9',
    )
    # Dos cosas que deciden si el progreso sobrevive:
    #   - private_mode=False: por defecto pywebview arranca en modo privado y
    #     borra localStorage al salir.
    #   - storage_path fijo: el perfil del WebView guarda ahi el avance, asi que
    #     cambiar esta ruta equivale a empezar de cero.
    webview.start(private_mode=False, storage_path=str(datos))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
