# Changelog

All notable changes to QuietView are documented in this file.

## [1.1.0] - 2026-10-01

### Added

- **Focus mode:** pick any element and make it fill the screen. Native fullscreen when allowed, in-tab fill otherwise. Media is letterboxed in black. Exit with Esc or the floating "Exit focus" button. Shortcut: Alt+Shift+F
- Picker: ↑ / ↓ to select the parent or child, Enter to confirm, a hint bar showing the element's name and size
- Undo after hiding an element (on-page toast) and after removing rules (popup)
- Readable rule names ("Trending sidebar") instead of raw selectors
- "Export all sites"; import now merges and never overwrites
- Dark mode popup; shortcuts shown on the action buttons; "Change keyboard shortcuts" link
- One-time rating prompt after a few successful uses (local counters only)

### Changed

- Popup redesigned around two actions: **Hide an element** and **Focus on an element**. Hide mode, CSS selector, HTML snippet and backup moved under "More options"
- Hide mode is now a saved preference ("Remove it and close the gap" / "Leave an empty space")
- Selectors prefer stable attributes (id, data-testid, aria-label) and fall back to an exact path, so picking never fails with "matched N elements"
- Hide shortcut is now Alt+Shift+H (was Ctrl+Shift+Y, which clashed with Type For Me). Existing installs keep their binding
- Store name: "QuietView: Hide Elements & Focus Mode", with a new short description

### Fixed

- The default WhatsApp Web rule came back every time the popup opened after you deleted it
- Firefox: the background script failed because `importScripts` is unavailable there
- Keyboard shortcut did nothing on tabs opened before install or update (now injects and retries)

## [1.0.1] - 2026-06-03

### Changed

- Publisher branding: Eligapris (eligapris.com), support@eligapris.com
- Privacy policy and footer links point to https://eligapris.com/quietview/privacy
- Firefox add-on ID: `quietview@eligapris.com`
- Manifest `homepage_url` and `author` set for store listings

## [1.0.0] - 2026-06-03

### Added

- Initial public release branding (QuietView)
- Element picker, CSS selector rules, and HTML snippet rules
- Per-site rule persistence with export/import (JSON format version 1)
- Hide modes: `display: none` and `visibility: hidden`
- Keyboard shortcut: Ctrl+Shift+Y / Cmd+Shift+Y
- Unique selector resolution (full class list + path fallback) for React/Meta-style UIs
- Chrome Web Store and Firefox AMO packaging support
- Legacy migration from Area Hider (`areaHiderRules`, `data-areahider-*` DOM markers)
- Default WhatsApp Web sidebar rule seeding

### Fixed

- Picker no longer saves ambiguous selectors (e.g. bare `div` on WhatsApp Web)
- Snippet and manual selector flows reject multi-match selectors
