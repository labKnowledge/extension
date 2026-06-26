#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(node -e "
  const fs = require('fs');
  const m = JSON.parse(fs.readFileSync('${ROOT}/manifest.json', 'utf8'));
  console.log(m.version);
")"
DIST="${ROOT}/dist"
OUT="${DIST}/quietview-${VERSION}.zip"

mkdir -p "$DIST"
rm -f "$OUT"

cd "$ROOT"
zip -r "$OUT" . \
  -x ".git/*" \
  -x "dist/*" \
  -x "*.zip" \
  -x ".DS_Store" \
  -x "web-ext-artifacts/*" \
  -x "scripts/*" \
  -x "docs/*" \
  -x "screenshots/*" \
  -x "assets/*" \
  -x "*.sh" \
  -x "*.md" \
  -x ".gitignore"

echo "Created $OUT"
