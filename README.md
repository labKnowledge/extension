# QuietView

**Hide what distracts you. Focus on what matters.**

QuietView is a browser extension by [Eligapris](https://eligapris.com) with two actions:

- **Hide an element:** click anything on a page (a feed, sidebar, banner or widget) and it stays hidden on that site.
- **Focus on an element:** click a video, chat, article or chart and it fills your screen. Press Esc to come back.

No CSS, no account, and nothing leaves your browser.

- **Product page:** https://eligapris.com/quietview
- **Support:** support@eligapris.com
- **Roadmap and growth tracker:** [PROGRESS.md](PROGRESS.md) · [docs/FEATURES.md](docs/FEATURES.md) · [docs/MARKET_RESEARCH.md](docs/MARKET_RESEARCH.md)

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

## Features

- **Picker for Hide and Focus:** hover to outline, **↑ / ↓** to select the parent or child, click or Enter to confirm, Esc to cancel
- **Focus mode:** native fullscreen when allowed, in-tab fill otherwise; black letterbox for media; Esc or "Exit focus" restores the page exactly
- **Undo** after every hide and every removal
- **Per-site persistence** with re-apply on single-page apps
- **Readable rule names** and stable-first selectors (id → data-testid → aria-label → classes → exact path)
- **Floating toggle** to show everything again on pages with rules
- **More options:** remove vs. keep space, CSS selector rules, HTML snippet rules, export all / merge import
- **Shortcuts:** Alt+Shift+H (hide), Alt+Shift+F (focus). Change them at `chrome://extensions/shortcuts`

On WhatsApp Web, a default rule that hides the chat list is added once. Deleting it is respected.

## Privacy

- **Online:** https://eligapris.com/quietview/privacy
- **Source in repo:** [PRIVACY.md](PRIVACY.md)

QuietView stores rules locally only; no remote data collection.

## Pre-release QA checklist

1. Load unpacked in Chrome: Hide (click, ↑ + Enter, Undo), Focus (Esc, Exit button, video letterbox), popup rules, export/import
2. Load temporary add-on in Firefox: same flows plus both shortcuts
3. WhatsApp Web: default rule appears once; delete it, reopen the popup, and confirm it stays deleted
4. YouTube: focus the player; hide the Shorts shelf and reload
5. Legacy upgrade: existing `areaHiderRules` in storage still loads

## Build release zip

```bash
./scripts/package.sh
```

Output: `dist/quietview-<version>.zip` for Chrome Web Store and Firefox AMO upload.

## Generate all assets (icons, screenshots, store graphics)

```bash
./scripts/build-assets.sh
```

Generates:
- Extension icons (16, 32, 48, 96, 128px)
- Store icon (128px)
- Store screenshots (1280×800, 640×400)
- Feature banner (1280×320)

Requirements: ImageMagick, Chrome/Chromium

See [`scripts/ASSETS.md`](scripts/ASSETS.md) for details.

## Regenerate icons only

```bash
./scripts/generate-icons.sh
```

Requires ImageMagick (`convert`) or `rsvg-convert`.

## Technical notes

- `utils/constants.js` — brand name, colors, storage keys
- `background.js` — storage CRUD, legacy migration from `areaHiderRules`
- `content.js`: applies and restores rules, the shared Hide/Focus picker, toasts, floating toggle
- `utils/focus.js`: Focus mode (fullscreen plus in-tab fallback, exit control, clean restore)
- `utils/selector.js`: stable-first selector generation, readable element names
- `popup.js`: popup UI and tab messaging

## License

MIT — see [LICENSE](LICENSE).
