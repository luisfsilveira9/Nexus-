#!/bin/sh
# Gera os ícones do app em public/ a partir dos mestres de assets/app/ (docs/arte/guia-visual.md §10).
# NX-015. Requer rsvg-convert (pacote librsvg2-bin no Ubuntu). Uso: npm run gerar:icones
# Os PNGs ficam no repositório: o build e a CI não precisam do rsvg-convert.
set -eu
cd "$(dirname "$0")/.."
ORIG=assets/app
DEST=public
mkdir -p "$DEST"
cp "$ORIG/app_icone_padrao.svg" "$DEST/favicon.svg"
rsvg-convert -w 32 -h 32 "$ORIG/app_icone_padrao.svg" -o "$DEST/favicon-32.png"
rsvg-convert -w 180 -h 180 "$ORIG/app_icone_maskable.svg" -o "$DEST/apple-touch-icon.png"
rsvg-convert -w 192 -h 192 "$ORIG/app_icone_padrao.svg" -o "$DEST/icon-192.png"
rsvg-convert -w 512 -h 512 "$ORIG/app_icone_padrao.svg" -o "$DEST/icon-512.png"
rsvg-convert -w 192 -h 192 "$ORIG/app_icone_maskable.svg" -o "$DEST/icon-maskable-192.png"
rsvg-convert -w 512 -h 512 "$ORIG/app_icone_maskable.svg" -o "$DEST/icon-maskable-512.png"
rsvg-convert -w 512 -h 512 "$ORIG/app_icone_mono.svg" -o "$DEST/icon-mono-512.png"
ls -l "$DEST"
