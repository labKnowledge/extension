#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SVG="$ROOT/icons/icon.svg"
OUT="$ROOT/icons"

if ! command -v rsvg-convert >/dev/null 2>&1 && ! command -v convert >/dev/null 2>&1; then
  echo "Install librsvg (rsvg-convert) or ImageMagick (convert) to generate PNG icons." >&2
  exit 1
fi

render() {
  local size="$1"
  local file="$OUT/icon-${size}.png"
  if command -v rsvg-convert >/dev/null 2>&1; then
    rsvg-convert -w "$size" -h "$size" "$SVG" -o "$file"
  else
    convert -background none -resize "${size}x${size}" "$SVG" "$file"
  fi
  echo "Wrote $file"
}

for size in 16 32 48 96 128; do
  render "$size"
done
