#!/usr/bin/env python3
"""Genera los iconos de la app instalable.

Sin dependencias: escribe los PNG a mano con `zlib` y `struct`, ambos de la
biblioteca estandar. Rasteriza con cobertura subpixel, asi que los bordes salen
suaves sin necesitar Pillow.

    python herramientas/iconos.py

Deja los PNG en `iconos/`. Solo hay que volver a correrlo si cambia el diseno.
"""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

RAIZ = Path(__file__).parent.parent
SALIDA = RAIZ / "iconos"

# Rayo en coordenadas 0..100, el mismo trazo que el favicon de la app.
RAYO = [(57, 6), (22, 56), (44, 56), (39, 94), (76, 43), (53, 43)]

AMBAR_CLARO = (0xF5, 0xB6, 0x2A)
AMBAR_OSCURO = (0xE0, 0x87, 0x00)

SS = 4          # subfilas por fila para el antialiasing vertical


def _spans(poligono: list[tuple[float, float]], y: float) -> list[tuple[float, float]]:
    """Tramos [x0, x1) donde la recta horizontal `y` cae dentro del poligono."""
    cortes = []
    n = len(poligono)
    for i in range(n):
        x1, y1 = poligono[i]
        x2, y2 = poligono[(i + 1) % n]
        if y1 == y2:
            continue
        # Intervalo semiabierto: evita contar dos veces un vertice compartido.
        if (y1 <= y < y2) or (y2 <= y < y1):
            cortes.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
    cortes.sort()
    return list(zip(cortes[0::2], cortes[1::2]))


def _acumular(fila: list[float], x0: float, x1: float, peso: float, ancho: int) -> None:
    """Suma `peso` entre x0 y x1, repartiendo fraccion en los pixeles del borde."""
    x0 = max(0.0, x0)
    x1 = min(float(ancho), x1)
    if x1 <= x0:
        return
    i0, i1 = int(x0), int(x1)
    if i0 == i1:
        fila[i0] += (x1 - x0) * peso
        return
    fila[i0] += (i0 + 1 - x0) * peso
    for i in range(i0 + 1, min(i1, ancho)):
        fila[i] += peso
    if i1 < ancho:
        fila[i1] += (x1 - i1) * peso


def _cobertura_poligono(poligono, tam: int) -> list[list[float]]:
    """Mapa de cobertura 0..1 del poligono sobre un lienzo de `tam` x `tam`."""
    cob = [[0.0] * tam for _ in range(tam)]
    paso = 1.0 / SS
    for sy in range(tam * SS):
        y = (sy + 0.5) * paso
        fila = cob[sy // SS]
        for x0, x1 in _spans(poligono, y):
            _acumular(fila, x0, x1, paso, tam)
    return cob


def _cobertura_rect_redondeado(tam: int, radio: float) -> list[list[float]]:
    """Cobertura de un cuadrado de esquinas redondeadas, suavizada por distancia."""
    cob = [[0.0] * tam for _ in range(tam)]
    for y in range(tam):
        py = y + 0.5
        fila = cob[y]
        for x in range(tam):
            px = x + 0.5
            # Distancia al rectangulo interior (el que queda al meter el radio).
            dx = max(radio - px, px - (tam - radio), 0.0)
            dy = max(radio - py, py - (tam - radio), 0.0)
            if dx == 0.0 and dy == 0.0:
                fila[x] = 1.0
                continue
            d = (dx * dx + dy * dy) ** 0.5
            # Franja de un pixel para el borde: suficiente para que no dentelle.
            fila[x] = min(1.0, max(0.0, radio - d + 0.5))
    return cob


def _escribir_png(ruta: Path, tam: int, pixeles: bytearray) -> None:
    def trozo(tipo: bytes, datos: bytes) -> bytes:
        return (struct.pack(">I", len(datos)) + tipo + datos
                + struct.pack(">I", zlib.crc32(tipo + datos) & 0xFFFFFFFF))

    filas = bytearray()
    ancho_fila = tam * 4
    for y in range(tam):
        filas.append(0)                       # filtro "None"
        filas += pixeles[y * ancho_fila:(y + 1) * ancho_fila]

    png = b"\x89PNG\r\n\x1a\n"
    png += trozo(b"IHDR", struct.pack(">IIBBBBB", tam, tam, 8, 6, 0, 0, 0))
    png += trozo(b"IDAT", zlib.compress(bytes(filas), 9))
    png += trozo(b"IEND", b"")
    ruta.write_bytes(png)


def construir(tam: int, escala: float, redondeado: bool) -> bytearray:
    """Rayo blanco sobre fondo ambar en degradado diagonal."""
    u = (tam / 100.0) * escala
    off = (tam - 100.0 * u) / 2.0
    rayo = [(off + x * u, off + y * u) for x, y in RAYO]

    cob_rayo = _cobertura_poligono(rayo, tam)
    cob_fondo = (_cobertura_rect_redondeado(tam, tam * 0.22) if redondeado
                 else [[1.0] * tam for _ in range(tam)])

    px = bytearray(tam * tam * 4)
    for y in range(tam):
        for x in range(tam):
            # Degradado diagonal, de claro arriba-izquierda a oscuro abajo-derecha.
            t = (x + y) / (2.0 * (tam - 1))
            fondo = tuple(
                round(AMBAR_CLARO[i] + (AMBAR_OSCURO[i] - AMBAR_CLARO[i]) * t)
                for i in range(3)
            )
            a_rayo = cob_rayo[y][x]
            color = tuple(round(fondo[i] + (255 - fondo[i]) * a_rayo) for i in range(3))

            a_fondo = cob_fondo[y][x]
            i = (y * tam + x) * 4
            px[i:i + 4] = bytes((*color, round(a_fondo * 255)))
    return px


ICONOS = [
    # (archivo, tamano, escala del rayo, esquinas redondeadas)
    ("icono-192.png", 192, 0.82, True),
    ("icono-512.png", 512, 0.82, True),
    # "Maskable": Android lo recorta en circulo, asi que el rayo va mas chico y
    # el fondo ocupa todo el cuadrado.
    ("icono-maskable-512.png", 512, 0.58, False),
    # iOS redondea el PNG por su cuenta: entregarlo ya redondeado deja halos.
    ("apple-touch-icon.png", 180, 0.82, False),
]


def main() -> int:
    SALIDA.mkdir(exist_ok=True)
    for nombre, tam, escala, redondeado in ICONOS:
        px = construir(tam, escala, redondeado)
        ruta = SALIDA / nombre
        _escribir_png(ruta, tam, px)
        print(f"OK  {ruta.relative_to(RAIZ)}  ({ruta.stat().st_size / 1024:.0f} kB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
