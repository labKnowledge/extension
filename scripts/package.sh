#!/usr/bin/env bash
# Build the Chrome Web Store / AMO upload zip, refusing anything the store
# would reject (long description, missing icons, bad JSON).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

node -e '
  const fs = require("fs");
  const m = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
  const errors = [];
  if (m.manifest_version !== 3) errors.push("manifest_version must be 3");
  if (!m.description || m.description.length > 132) errors.push(`description is ${m.description?.length} chars (max 132)`);
  if (m.name.length > 45) errors.push(`name is ${m.name.length} chars (keep <= 45)`);
  for (const [size, file] of Object.entries(m.icons || {})) {
    if (!fs.existsSync(file)) errors.push(`missing icon ${size}: ${file}`);
  }
  for (const file of m.content_scripts.flatMap((c) => c.js)) {
    if (!fs.existsSync(file)) errors.push(`missing content script ${file}`);
  }
  if (errors.length) { console.error("Store check failed:\n - " + errors.join("\n - ")); process.exit(1); }
  console.log(`Store check OK: ${m.name} v${m.version} (description ${m.description.length}/132)`);
'

for f in *.js utils/*.js; do node --check "$f"; done

VERSION="$(node -p 'require("./manifest.json").version')"
DIST="${ROOT}/dist"
OUT="${DIST}/quietview-${VERSION}-store.zip"
mkdir -p "$DIST"
rm -f "$OUT"

zip -qr "$OUT" . \
  -x ".git/*" \
  -x ".claude/*" \
  -x "dist/*" \
  -x "store/*" \
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

echo "Created $OUT ($(du -h "$OUT" | cut -f1))"
