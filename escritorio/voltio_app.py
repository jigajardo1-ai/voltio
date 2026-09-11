#!/usr/bin/env python3
"""Voltio como aplicacion de escritorio.

Abre una ventana nativa con la app dentro. No empaqueta un navegador: usa el
WebView2 que Windows 11 ya trae instalado, asi que el ejecutable pesa unos
pocos MB en vez de los ~100 de Electron.

    python escritorio/voltio_app.py        # para probar sin compilar

El ejecutable se genera en CI (.github/workflows/exe.yml), no hace falta
compilarlo a mano.
"""

from __future__ import annotations

import os
import socket
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

# El contenido se sirve desde 127.0.0.1 en un puerto fijo, y no desde file://,
# por una razon concreta: el progreso vive en localStorage, que se guarda por
# origen. Un puerto que cambiara en cada arranque daria un origen distinto cada
# vez y el usuario perderia el avance al cerrar la app.
PUERTO = 17280
APP = 'Voltio'


def raiz_recursos() -> Path:
    """Carpeta con el HTML: dentro del ejecutable o el repo, segun el caso."""
    empaquetado = getattr(sys, '_MEIPASS', None)
    if empaquetado:
        return Path(empaquetado) / 'web'
    return Path(__file__).parent.parent / 'dist'


def carpeta_datos() -> Path:
    """Donde WebView2 guarda su perfil, que es donde termina el progreso."""
    base = os.environ.get('LOCALAPPDATA') or os.path.expanduser('~')
    destino = Path(base) / 'Voltio'
    destino.mkdir(parents=True, exist_ok=True)
    return destino


class Silencioso(SimpleHTTPRequestHandler):
    """Igual que el de siempre, pero sin escupir una linea por peticion."""

    def log_message(self, formato, *args):  # noqa: A002
        pass

    def end_headers(self):
        # Sin esto, al actualizar la app el ejecutable seguiria mostrando la
        # version guardada por el WebView.
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def puerto_libre(preferido: int) -> int:
    """El puerto fijo si se puede; si no, uno cualquiera (ver nota de arriba)."""
    with socket.socket() as s:
        try:
            s.bind(('127.0.0.1', preferido))
            return preferido
        except OSError:
            pass
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def servir(directorio: Path, puerto: int) -> ThreadingHTTPServer:
    manejador = partial(Silencioso, directory=str(directorio))
    servidor = ThreadingHTTPServer(('127.0.0.1', puerto), manejador)
    hilo = threading.Thread(target=servidor.serve_forever, daemon=True)
    hilo.start()
    return servidor


def main() -> int:
    try:
        import webview
    except ImportError:
        print('Falta pywebview. Instala con:  pip install pywebview', file=sys.stderr)
        return 1

    recursos = raiz_recursos()
    indice = recursos / 'voltio.html'
    if not indice.exists():
        print(f'No encuentro {indice}. Corre antes:  python build.py', file=sys.stderr)
        return 1

    puerto = puerto_libre(PUERTO)
    if puerto != PUERTO:
        # Solo informativo: el progreso de esta sesion quedara bajo otro origen.
        print(f'Aviso: el puerto {PUERTO} estaba ocupado, uso {puerto}.', file=sys.stderr)
    servir(recursos, puerto)

    webview.create_window(
        APP,
        f'http://127.0.0.1:{puerto}/voltio.html',
        width=980,
        height=860,
        min_size=(420, 560),
        background_color='#F4F6F9',
    )
    # private_mode=False es lo que hace que el progreso sobreviva al cierre: por
    # defecto pywebview arranca en modo privado y borra localStorage al salir.
    webview.start(private_mode=False, storage_path=str(carpeta_datos()))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
