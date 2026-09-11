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

# Ruta con la que una instancia se identifica: sirve para distinguir nuestra app
# de cualquier otro programa que ocupe el mismo puerto.
SENAL = '/__voltio__'

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


def _icono() -> Path:
    return Path(__file__).resolve().parent.parent / 'iconos' / 'voltio.ico'


def identidad_en_barra_de_tareas() -> None:
    """Hace que Windows trate esto como Voltio y no como 'Python'.

    Sin esto la ventana se agrupa bajo el interprete en la barra de tareas y
    hereda su icono. Hay que llamarlo antes de crear la ventana.
    """
    if sys.platform != 'win32':
        return
    try:
        import ctypes
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID('Voltio.Escritorio')
    except Exception:
        pass


def poner_icono_ventana() -> bool:
    """Cambia el icono de la ventana por el rayo de la app.

    pywebview no expone el icono en Windows, asi que la ventana se queda con el
    de pythonw.exe. Se arregla mandandole WM_SETICON por la API del sistema.
    Devuelve True cuando encontro una ventana y se lo puso.
    """
    if sys.platform != 'win32':
        return True
    try:
        import ctypes
        from ctypes import wintypes

        ico = _icono()
        if not ico.exists():
            return True                       # sin icono no hay nada que reintentar

        user32 = ctypes.windll.user32
        kernel32 = ctypes.windll.kernel32
        WM_SETICON, ICON_SMALL, ICON_BIG = 0x0080, 0, 1
        IMAGE_ICON, LR_LOADFROMFILE = 1, 0x0010

        # Se cargan dos tamanos: el chico va en la barra de titulo y el grande
        # en Alt+Tab y la barra de tareas.
        medidas = ((49, 50, ICON_SMALL), (11, 12, ICON_BIG))
        cargados = []
        for mx, my, cual in medidas:
            h = user32.LoadImageW(None, str(ico), IMAGE_ICON,
                                  user32.GetSystemMetrics(mx),
                                  user32.GetSystemMetrics(my), LR_LOADFROMFILE)
            if h:
                cargados.append((cual, h))
        if not cargados:
            return True

        # Solo las ventanas de este proceso: buscarlas por titulo podria acertarle
        # a la ventana de otro programa que se llame igual.
        pid_propio = kernel32.GetCurrentProcessId()
        ventanas: list[int] = []

        @ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
        def recorrer(hwnd, _lparam):
            pid = wintypes.DWORD()
            user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            if pid.value == pid_propio and user32.IsWindowVisible(hwnd):
                ventanas.append(hwnd)
            return True

        user32.EnumWindows(recorrer, 0)
        for hwnd in ventanas:
            for cual, h in cargados:
                user32.SendMessageW(hwnd, WM_SETICON, cual, h)
        return bool(ventanas)
    except Exception:
        return True                           # el icono no vale romper la app


def al_abrir() -> None:
    """La ventana todavia no existe cuando pywebview arranca: hay que esperarla."""
    import time
    for _ in range(40):                       # se rinde a los ~4 s
        time.sleep(0.1)
        if poner_icono_ventana():
            return


class Silencioso(SimpleHTTPRequestHandler):
    """El de siempre, pero sin una linea de log por peticion."""

    def log_message(self, formato, *args):  # noqa: A002
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        if self.path == SENAL:
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.send_header('Content-Length', '6')
            self.end_headers()
            self.wfile.write(b'voltio')
            return
        super().do_GET()


def puerto_ocupado(puerto: int) -> bool:
    with socket.socket() as s:
        try:
            s.bind(('127.0.0.1', puerto))
            return False
        except OSError:
            return True


def responde_voltio(puerto: int) -> bool:
    """Distingue nuestra propia app de cualquier otro servicio en ese puerto."""
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{puerto}{SENAL}', timeout=2) as r:
            return r.read(32) == b'voltio'
    except Exception:
        return False


def traer_al_frente() -> bool:
    """Enfoca la ventana de la instancia que ya esta abierta."""
    if sys.platform != 'win32':
        return False
    try:
        import ctypes
        user32 = ctypes.windll.user32
        # Aqui si se busca por titulo: la ventana es de otro proceso.
        hwnd = user32.FindWindowW(None, APP)
        if not hwnd:
            return False
        user32.ShowWindow(hwnd, 9)            # SW_RESTORE, por si esta minimizada
        user32.SetForegroundWindow(hwnd)
        return True
    except Exception:
        return False


def avisar(texto: str) -> None:
    """Un cuadro de dialogo, porque con pythonw.exe stderr no lo lee nadie."""
    print(texto, file=sys.stderr)
    if sys.platform != 'win32':
        return
    try:
        import ctypes
        ctypes.windll.user32.MessageBoxW(None, texto, APP, 0x30)   # MB_ICONWARNING
    except Exception:
        pass


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

    if puerto_ocupado(PUERTO):
        # Abrir en otro puerto cambiaria el origen, y con el el progreso: el
        # usuario veria su avance desaparecer sin explicacion. Mejor no abrir.
        if responde_voltio(PUERTO):
            if traer_al_frente():
                return 0                      # ya estaba abierta: se enfoca y listo
            avisar('Voltio ya esta abierto. Busca su ventana en la barra de tareas.')
            return 0
        avisar(f'No puedo abrir Voltio: otro programa esta usando el puerto {PUERTO}.\n\n'
               'Cierralo y vuelve a intentar. El puerto es fijo a proposito: '
               'cambiarlo haria desaparecer tu progreso.')
        return 1

    puerto = PUERTO
    manejador = partial(Silencioso, directory=str(fuente.parent))
    ThreadingHTTPServer.allow_reuse_address = True
    servidor = ThreadingHTTPServer(('127.0.0.1', puerto), manejador)
    threading.Thread(target=servidor.serve_forever, daemon=True).start()

    identidad_en_barra_de_tareas()            # antes de crear la ventana

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
    webview.start(al_abrir, private_mode=False, storage_path=str(datos))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
