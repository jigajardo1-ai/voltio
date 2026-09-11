#!/usr/bin/env python3
"""Crea el acceso directo de Voltio en el escritorio y el menu inicio.

    python herramientas/acceso_directo.py            # crear
    python herramientas/acceso_directo.py --quitar   # borrar

Apunta a `pythonw.exe` y no a `python.exe`: el primero abre la ventana sin
arrastrar una consola negra detras.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LANZADOR = RAIZ / "escritorio" / "voltio_app.py"
ICONO = RAIZ / "iconos" / "voltio.ico"
NOMBRE = "Voltio.lnk"


def pythonw() -> Path:
    """El interprete sin consola. Si no esta, se usa el normal."""
    candidato = Path(sys.executable).with_name("pythonw.exe")
    return candidato if candidato.exists() else Path(sys.executable)


def destinos() -> list[Path]:
    escritorio = Path(os.path.expanduser("~")) / "Desktop"
    # OneDrive redirige el escritorio; si es el caso, ese es el bueno.
    onedrive = os.environ.get("OneDrive")
    if onedrive and (Path(onedrive) / "Desktop").is_dir():
        escritorio = Path(onedrive) / "Desktop"

    inicio = (Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows"
              / "Start Menu" / "Programs")

    salida = [escritorio / NOMBRE]
    if inicio.parent.is_dir():
        salida.append(inicio / NOMBRE)
    return salida


def crear(ruta: Path) -> None:
    """Se crea via WScript.Shell, que es la forma que Windows ofrece sin extras."""
    guion = f'''
$w = New-Object -ComObject WScript.Shell
$s = $w.CreateShortcut("{ruta}")
$s.TargetPath = "{pythonw()}"
$s.Arguments = '"{LANZADOR}"'
$s.WorkingDirectory = "{RAIZ}"
$s.IconLocation = "{ICONO},0"
$s.Description = "Voltio - Aprende electricidad"
$s.WindowStyle = 1
$s.Save()
'''
    ruta.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", guion],
                   check=True, capture_output=True)


def main() -> int:
    quitar = "--quitar" in sys.argv

    if not quitar:
        if not LANZADOR.exists():
            print(f"No encuentro {LANZADOR}", file=sys.stderr)
            return 1
        if not ICONO.exists():
            print("Falta el icono. Corre antes:  python herramientas/iconos.py",
                  file=sys.stderr)
            return 1

    for ruta in destinos():
        if quitar:
            if ruta.exists():
                ruta.unlink()
                print(f"Quitado  {ruta}")
        else:
            crear(ruta)
            print(f"OK  {ruta}")

    if not quitar:
        print("\nListo. Busca el rayo de Voltio en el escritorio.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
