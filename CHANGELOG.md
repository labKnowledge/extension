# Changelog

All notable changes to QuietView are documented in this file.

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
