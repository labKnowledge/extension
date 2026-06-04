# QuietView

**Hide clutter on any site. Click, rule, and keep your view quiet.**

QuietView is a Chrome extension that lets you hide distracting page elements on any website — chat sidebars, news feeds, cookie banners, dashboard widgets, and more. Point at what you want gone, and your rules persist per site.

## Use Cases

- **WhatsApp Web** — hide the chat list or header for a focused conversation view
- **Social feeds** — remove trending sidebars and recommendation panels
- **Dashboards** — strip widgets you never use
- **Any site** — hide cookie banners, promo bars, or noisy UI chrome

## Features

- **Element picker** — click any element on the page to hide it
- **CSS selector rules** — paste a selector for precise control
- **HTML snippet rules** — paste an element snippet; QuietView derives a matching selector
- **Hide modes** — `display: none` (removes layout space) or `visibility: hidden` (preserves layout)
- **Per-site persistence** — rules are saved by origin (e.g. `https://web.whatsapp.com`)
- **Export / import** — share rules as JSON across machines or browsers
- **Keyboard shortcut** — `Ctrl+Shift+Y` / `Cmd+Shift+Y` to start the picker
- **SPA support** — rules re-apply automatically as dynamic pages update

On WhatsApp Web, a default hide rule is auto-seeded for the chat list sidebar if none exists.

## Install (Developer Mode)

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `extension`.

## How to Use

1. Open a target website tab (for example WhatsApp Web).
2. Click the QuietView extension icon to open the popup.
   - If the content script is not loaded yet, the popup retries by injecting scripts automatically.
   - Unsupported tabs (such as `chrome://`) show a friendly message.
3. Choose one of:
   - **Start picker** — click any element on the page to create a hide rule.
   - **Add selector rule** — paste a CSS selector and add.
   - **Add snippet rule** — paste an HTML element snippet and add.
   - Select hide mode before creating a rule.
4. In the **Rules** section:
   - **Show** — disable a rule (restores hidden elements).
   - **Hide** — re-enable a rule.
   - **Delete** — remove a rule permanently.
   - **Export JSON** — download current site rules.
   - **Import JSON** — replace current site rules from a JSON file.

## Rule Behavior

- Hide mode options:
  - `display:none !important` (layout space removed)
  - `visibility:hidden !important` (layout space preserved)
- Safe restore is handled by rule markers:
  - `data-quietview-rule-ids`
  - `data-quietview-orig-display`
- If multiple rules hide the same element, removing one rule does not restore it until all related rules are disabled or deleted.

## WhatsApp Web Test Checklist

- Picker hides header/chat list area.
- Pasted snippet hides the same area.
- Direct selector hides expected nodes.
- Toggle Show/Hide restores and re-hides correctly.
- Refresh page keeps enabled rules active.
- Delete rule removes behavior after refresh.

## Technical Notes

- `background.js` — storage CRUD, rule upsert/toggle/delete, legacy migration from `areaHiderRules`.
- `content.js` — applies/restores rules, picker overlay, snippet and selector handling, dynamic re-apply.
- `utils/selector.js` — selector generation helpers and snippet candidate extraction.
- `popup.js` — UI actions and tab messaging.
- `manifest.json` commands — keyboard shortcut `start-picker`.

Dynamic apps (SPAs) are supported via a debounced `MutationObserver` that re-applies enabled rules as the DOM updates.
