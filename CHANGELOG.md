# Changelog

All notable changes to QuietView are documented in this file.

## [1.2.0] - 2026-10-01

Includes the unreleased 1.1.0 work.

### Added

- **Redact mode** for bloggers, tutors and screen recorders: click any element or drag a box to blur or black it out. **Auto-detect** covers emails, phone numbers, card numbers (Luhn-checked), API keys and tokens (Stripe, OpenAI, GitHub, Slack, AWS, Google, JWTs), IP addresses and password fields. It uses the CSS Highlight API, so page text is never modified. **Screenshot** captures the tab with redactions applied and QuietView's own UI hidden, saves a PNG and copies it to the clipboard. Keys: A auto-detect, B blur/black, Z undo, S screenshot, Esc done. Shortcut Alt+Shift+R; also on the right-click menu ("Redact this element")
- **Self-repairing rules:** each rule stores a fingerprint of what it hid. When a site change breaks the selector, QuietView finds the same element again and updates the rule. It only does this on a clear, unambiguous match. The popup shows "repaired automatically after a site change"
- **"Not found on this page · Fix it":** rules that match nothing are flagged in the popup. "Fix it" re-picks the element and updates the existing rule
- **One-click cleanups** for YouTube (Shorts, recommendations next to videos, home feed, comments, end-of-video suggestions), Reddit, X, Twitch, and WhatsApp Web (including "blur chat list")
- **Focus here every visit:** a toggle in Focus mode that re-focuses that element automatically whenever you open the site. Stop it from the popup
- **Right-click menu:** "Hide this element" and "Focus on this element" act on exactly what you clicked
- **"Hide all N like this"** offered after a hide when similar elements exist (e.g. every card in a feed)
- **Blur mode:** a third hide style that blurs the element and shows it when you hover, for privacy and screen-sharing
- **Toolbar badge** showing how many elements are hidden on the current tab
- **Welcome page** on install with a hands-on demo of Hide and Focus

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

### Under the hood

- New hide engine (`utils/hider.js`): rules tag elements with attributes and one stylesheet acts on them. The page's inline styles are never touched, so pausing and removing restore pages exactly
- Focus mode fullscreens the page instead of the element, so QuietView's exit control and toasts stay visible and clickable
- Landmark tags (`main`, `video`, `article`…) and aria-labels are preferred as selectors because they survive redesigns

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
