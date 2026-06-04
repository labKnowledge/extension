# QuietView

**Hide clutter. Keep your view quiet.**

QuietView is a browser extension that lets you hide distracting page elements on any website — chat sidebars, news feeds, cookie banners, dashboard widgets, and more. Point at what you want gone, and your rules persist per site.

## Install

### Chrome Web Store

*(Link your published listing here after submission.)*

### Firefox Add-ons (AMO)

*(Link your published listing here after submission.)*

### Developer mode (unpacked)

**Chrome**

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this `extension` folder

**Firefox**

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json` in this folder

Or use [web-ext](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/):

```bash
cd extension
web-ext run
```

## Use cases

- **WhatsApp Web** — hide the chat list or header for a focused conversation view
- **Social feeds** — remove trending sidebars and recommendation panels
- **Dashboards** — strip widgets you never use
- **Any site** — hide cookie banners, promo bars, or noisy UI chrome

## Features

- **Element picker** — click any element on the page to hide it
- **CSS selector rules** — paste a selector for precise control
- **HTML snippet rules** — paste an element snippet; QuietView derives a unique selector
- **Hide modes** — `display: none` (removes layout space) or `visibility: hidden` (preserves layout)
- **Per-site persistence** — rules saved by origin (e.g. `https://web.whatsapp.com`)
- **Export / import** — share rules as JSON across machines or browsers
- **Keyboard shortcut** — `Ctrl+Shift+Y` / `Cmd+Shift+Y` to start the picker
- **SPA support** — rules re-apply as dynamic pages update

On WhatsApp Web, a default hide rule is auto-seeded for the chat list sidebar if none exists.

## How to use

1. Open a target website tab (for example WhatsApp Web).
2. Click the QuietView extension icon.
3. Choose one of:
   - **Start picker** — click an element on the page (popup closes; toast shows result).
   - **Add selector rule** — paste a CSS selector (must match exactly one element).
   - **Add snippet rule** — paste an HTML element snippet.
   - Select hide mode before creating a rule.
4. In **Rules**: Show / Hide / Delete, or Export / Import JSON.

## Privacy

See [PRIVACY.md](PRIVACY.md). QuietView stores rules locally only; no remote data collection.

## Pre-release QA checklist

1. Load unpacked in Chrome — icon, popup header, picker, snippet, export/import
2. Load temporary add-on in Firefox — same flows + keyboard shortcut
3. WhatsApp Web — sidebar hide matches **one** element only
4. Legacy upgrade — existing `areaHiderRules` in storage still loads

## Build release zip

```bash
./scripts/package.sh
```

Output: `dist/quietview-1.0.0.zip` for Chrome Web Store and Firefox AMO upload.

## Regenerate icons

```bash
./scripts/generate-icons.sh
```

Requires ImageMagick (`convert`) or `rsvg-convert`.

## Technical notes

- `utils/constants.js` — brand name, colors, storage keys
- `background.js` — storage CRUD, legacy migration from `areaHiderRules`
- `content.js` — applies/restores rules, picker overlay, unique selector validation
- `utils/selector.js` — selector generation and snippet candidates
- `popup.js` — UI and tab messaging

## License

MIT — see [LICENSE](LICENSE).
