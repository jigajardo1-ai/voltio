#!/usr/bin/env python3
"""Comprueba que el progreso sobrevive al cerrar la app de escritorio.

Es la prueba que no se puede hacer desde el navegador: abre la ventana real,
escribe en localStorage, la cierra, la vuelve a abrir y comprueba si sigue ahi.

    python pruebas/persistencia.py escribir
    python pruebas/persistencia.py leer
    python pruebas/persistencia.py limpiar   # borra lo que dejo la prueba

`python pruebas/persistencia.py` a secas encadena las dos fases en procesos
separados, que es como pasa de verdad al cerrar y reabrir la app.
"""

from __future__ import annotations

import subprocess
import sys
import threading
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'escritorio'))
from voltio_app import PUERTO, carpeta_datos, html_a_usar  # noqa: E402

MARCA = 'voltio.prueba.persistencia'


def fase(accion: str) -> int:
    import webview

    datos = carpeta_datos()
    fuente = html_a_usar(datos)
    if fuente is None:
        print('Falta el HTML. Corre antes:  python build.py', file=sys.stderr)
        return 1

    import socket
    from functools import partial
    from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

    # Mismo puerto que la app: el localStorage va por origen, y con otro puerto
    # la prueba no estaria mirando el mismo sitio que usa la app de verdad.
    with socket.socket() as s:
        try:
            s.bind(('127.0.0.1', PUERTO))
        except OSError:
            print(f'El puerto {PUERTO} esta ocupado: cierra la app antes.', file=sys.stderr)
            return 2

    manejador = partial(SimpleHTTPRequestHandler, directory=str(fuente.parent))
    ThreadingHTTPServer.allow_reuse_address = True
    servidor = ThreadingHTTPServer(('127.0.0.1', PUERTO), manejador)
    threading.Thread(target=servidor.serve_forever, daemon=True).start()

    resultado: dict[str, object] = {}

    def trabajo(ventana):
        import time
        time.sleep(2.5)                       # que termine de cargar la pagina
        if accion == 'escribir':
            ventana.evaluate_js(
                f'localStorage.setItem("{MARCA}", "valor-de-prueba");'
                'localStorage.setItem("voltio.progreso.v1", JSON.stringify('
                '{xp: 123, racha: 2, ultimoDia: "2026-09-10", vidas: 5, vidasRecarga: null,'
                ' completadas: {"f-corriente": {estrellas: 3, mejorXp: 30}}}));'
                f'localStorage.getItem("{MARCA}")')
            resultado['escrito'] = ventana.evaluate_js(
                f'localStorage.getItem("{MARCA}")')
        elif accion == 'limpiar':
            # La prueba escribe en el perfil real: hay que dejarlo como estaba,
            # o el usuario se encuentra con un progreso inventado.
            resultado['antes'] = ventana.evaluate_js(
                'JSON.stringify(Object.keys(localStorage))')
            ventana.evaluate_js(
                f'localStorage.removeItem("{MARCA}");'
                'localStorage.removeItem("voltio.progreso.v1");')
            resultado['despues'] = ventana.evaluate_js(
                'JSON.stringify(Object.keys(localStorage))')
        else:
            resultado['marca'] = ventana.evaluate_js(f'localStorage.getItem("{MARCA}")')
            resultado['progreso'] = ventana.evaluate_js(
                'localStorage.getItem("voltio.progreso.v1")')
            resultado['claves'] = ventana.evaluate_js(
                'JSON.stringify(Object.keys(localStorage))')
            resultado['origen'] = ventana.evaluate_js('location.origin')
        time.sleep(0.5)
        ventana.destroy()

    ventana = webview.create_window('Prueba de persistencia',
                                    f'http://127.0.0.1:{PUERTO}/{fuente.name}',
                                    width=500, height=400)
    webview.start(trabajo, ventana, private_mode=False, storage_path=str(datos))

    print(f'--- fase: {accion} ---')
    for k, v in resultado.items():
        print(f'  {k}: {v}')
    return 0


def main() -> int:
    if len(sys.argv) > 1 and sys.argv[1] in ('escribir', 'leer', 'limpiar'):
        return fase(sys.argv[1])

    # Dos procesos distintos: reutilizar el mismo no probaria nada, porque el
    # dato podria estar vivo solo en memoria.
    for accion in ('escribir', 'leer'):
        r = subprocess.run([sys.executable, __file__, accion],
                           capture_output=True, text=True)
        print(r.stdout.strip() or r.stderr.strip())
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
