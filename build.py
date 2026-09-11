#!/usr/bin/env python3
"""Empaqueta Voltio en un solo archivo HTML.

El proyecto se desarrolla modular (un archivo por leccion, imports ES), pero
para publicarlo conviene un archivo unico sin dependencias de red. Este script
resuelve el grafo de imports, aplana los modulos en orden topologico dentro de
un mismo scope y deja el resultado en dist/.

    python build.py            -> dist/voltio.html   (pagina completa, doble clic)
    python build.py --artifact -> dist/artifact.html (fragmento, sin <html>/<head>)

Como todos los modulos terminan compartiendo un solo scope, los nombres de
nivel superior tienen que ser unicos en el proyecto. Lo unico que se traduce
son los renombres (`x as y`), que se vuelven un alias explicito.
"""

from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).parent
DIST = RAIZ / "dist"

RE_IMPORT = re.compile(
    r"^[ \t]*import\s+(?:(?P<clausula>[^'\"]+?)\s+from\s+)?"
    r"['\"](?P<ruta>\.[^'\"]+)['\"][ \t]*;?[ \t]*$",
    re.MULTILINE,
)
RE_EXPORT_DEFAULT = re.compile(r"^[ \t]*export\s+default\s+", re.MULTILINE)
RE_EXPORT_DECL = re.compile(r"^[ \t]*export\s+(?=(?:const|let|var|function|class|async)\b)", re.MULTILINE)
RE_EXPORT_LISTA = re.compile(r"^[ \t]*export\s*\{(?P<items>[^}]*)\}[ \t]*;?[ \t]*$", re.MULTILINE)


class ErrorBuild(Exception):
    pass


def nombre_modulo(ruta: Path) -> str:
    """Identificador JS valido para el default export de un modulo."""
    base = ruta.stem.replace("-", "_").replace(".", "_")
    if base[0].isdigit():
        base = "_" + base
    return f"__def_{base}"


def alias_de(items: str) -> str:
    """De 'a as b, c' devuelve las lineas `const b = a;` que hacen falta.

    Los nombres sin `as` ya quedan visibles al compartir scope, asi que solo
    los renombrados necesitan un puente.
    """
    lineas = []
    for bruto in items.split(","):
        pieza = bruto.strip()
        if not pieza or pieza == "default":
            continue
        if " as " in pieza:
            origen, destino = (x.strip() for x in pieza.split(" as ", 1))
            if origen != destino:
                lineas.append(f"const {destino} = {origen};")
    return "\n".join(lineas)


def recolectar(entrada: Path, vistos: dict[Path, str], orden: list[Path]) -> None:
    """Recorre el grafo de imports en profundidad; las hojas quedan primero."""
    ruta = entrada.resolve()
    if ruta in vistos:
        return
    if not ruta.exists():
        raise ErrorBuild(f"import no resuelto: {ruta}")
    vistos[ruta] = ""                      # marca temprana: corta ciclos
    fuente = ruta.read_text(encoding="utf-8")

    for m in RE_IMPORT.finditer(fuente):
        recolectar((ruta.parent / m.group("ruta")).resolve(), vistos, orden)

    vistos[ruta] = fuente
    orden.append(ruta)


def aplanar(fuente: str, ruta: Path) -> str:
    """Quita imports/exports, conservando los renombres como alias."""

    def reemplazo_import(m: re.Match) -> str:
        clausula = (m.group("clausula") or "").strip()
        destino = (ruta.parent / m.group("ruta")).resolve()
        if not clausula:
            return ""                                   # import por efecto secundario

        partes = []
        # Forma `def, { a as b }` o solo una de las dos.
        llave = clausula.find("{")
        if llave == -1:
            partes.append(f"const {clausula} = {nombre_modulo(destino)};")
        else:
            cabeza = clausula[:llave].rstrip().rstrip(",").strip()
            if cabeza:
                partes.append(f"const {cabeza} = {nombre_modulo(destino)};")
            cuerpo = clausula[llave + 1: clausula.rfind("}")]
            alias = alias_de(cuerpo)
            if alias:
                partes.append(alias)
        return "\n".join(partes)

    def reemplazo_export_lista(m: re.Match) -> str:
        return alias_de(m.group("items"))

    fuera = RE_IMPORT.sub(reemplazo_import, fuente)
    fuera = RE_EXPORT_DEFAULT.sub(f"const {nombre_modulo(ruta)} = ", fuera)
    fuera = RE_EXPORT_DECL.sub("", fuera)
    fuera = RE_EXPORT_LISTA.sub(reemplazo_export_lista, fuera)
    return fuera


def construir_js() -> str:
    vistos: dict[Path, str] = {}
    orden: list[Path] = []
    recolectar(RAIZ / "js" / "app.js", vistos, orden)

    partes = []
    for ruta in orden:
        rel = ruta.relative_to(RAIZ).as_posix()
        partes.append(f"/* ── {rel} ── */\n{aplanar(vistos[ruta], ruta)}")

    bundle = "\n\n".join(partes)
    sobrantes = [ln for ln in bundle.splitlines()
                 if re.match(r"^[ \t]*(import|export)\s", ln)]
    if sobrantes:
        raise ErrorBuild("quedaron sentencias de modulo sin aplanar:\n  " + "\n  ".join(sobrantes[:5]))
    return bundle


FAVICON = ("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>"
           "<text y='.9em' font-size='90'>&#9889;</text></svg>")


# Lo que el service worker tiene que guardar para que la app abra sin internet.
PATRONES_PWA = ["index.html", "manifest.webmanifest", "css/*.css", "js/*.js",
                "lecciones/*.js", "iconos/*.png"]


def archivos_pwa() -> list[str]:
    rutas: list[str] = []
    for patron in PATRONES_PWA:
        rutas += sorted(p.relative_to(RAIZ).as_posix() for p in RAIZ.glob(patron))
    return rutas


def actualizar_service_worker() -> str:
    """Reescribe VERSION y ARCHIVOS con el contenido real del proyecto.

    La version sale del hash de los archivos servidos: cambia sola cuando cambia
    algo y no cambia cuando no. Si se llevara a mano, tarde o temprano alguien
    publica sin tocarla y las apps instaladas se quedan con la version vieja.
    """
    sw = RAIZ / "service-worker.js"
    if not sw.exists():
        return ""

    rutas = archivos_pwa()
    h = hashlib.sha256()
    for r in rutas:
        h.update(r.encode())
        h.update((RAIZ / r).read_bytes())
    version = "v" + h.hexdigest()[:7]

    listado = "\n".join(f"  './{r}'," for r in rutas)
    texto = sw.read_text(encoding="utf-8")
    texto = re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{version}';", texto)
    texto = re.sub(r"const ARCHIVOS = \[.*?\];",
                   f"const ARCHIVOS = [\n  './',\n{listado}\n];", texto, flags=re.S)
    sw.write_text(texto, encoding="utf-8")
    return version


def main() -> int:
    modo_artifact = "--artifact" in sys.argv
    version = actualizar_service_worker()
    css = (RAIZ / "css" / "app.css").read_text(encoding="utf-8")
    js = construir_js()
    DIST.mkdir(exist_ok=True)

    # Unico recurso de red del bundle. El CSP de Artifacts admite Google Fonts,
    # y la pila de respaldo en el CSS cubre el caso de que no cargue.
    fuentes = ('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
               '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
               'family=IBM+Plex+Mono:wght@400;600&'
               'family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">\n')

    envoltura = fuentes + f"<style>\n{css}\n</style>\n" \
                '<div id="app"><noscript>Voltio necesita JavaScript.</noscript></div>\n' \
                f"<script>\n(function(){{\n'use strict';\n{js}\n}})();\n</script>\n"

    if modo_artifact:
        salida = DIST / "artifact.html"
        salida.write_text("<title>Voltio</title>\n" + envoltura, encoding="utf-8")
    else:
        salida = DIST / "voltio.html"
        salida.write_text(
            '<!doctype html>\n<html lang="es">\n<head>\n'
            '<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<meta name="color-scheme" content="light dark">\n'
            "<title>Voltio — Aprende electricidad</title>\n"
            f'<link rel="icon" href="{FAVICON}">\n'
            f"</head>\n<body>\n{envoltura}</body>\n</html>\n",
            encoding="utf-8",
        )

    kb = salida.stat().st_size / 1024
    print(f"OK  {salida.relative_to(RAIZ)}  ({kb:.0f} kB)")
    if version:
        print(f"OK  service-worker.js  ({version}, {len(archivos_pwa())} archivos)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ErrorBuild as e:
        print(f"ERROR: {e}", file=sys.stderr)
        raise SystemExit(1)
