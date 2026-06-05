# QuietView — Store listing copy

Use this document when submitting to the Chrome Web Store and Firefox Add-ons (AMO).

## Product name

**QuietView**

## Short description (132 chars max for Chrome)

Hide distracting page elements on any site. Pick, paste, or rule — your layout stays quiet.

## Long description

QuietView helps you focus by hiding clutter on any website — chat sidebars, news feeds, promo bars, dashboard widgets, and more.

**How it works**

1. Open a site and click the QuietView icon.
2. **Pick** an element on the page, **paste a CSS selector**, or **paste an HTML snippet**.
3. Your rules are saved per site and re-applied automatically, including on dynamic (SPA) pages.

**Features**

- Visual element picker
- CSS selector and HTML snippet rules
- `display: none` or `visibility: hidden` hide modes
- Per-site persistence
- Export and import rules as JSON
- Keyboard shortcut: Ctrl+Shift+Y (Cmd+Shift+Y on Mac)

QuietView stores rules locally on your device. No account required. No data sold.

## Category

- Chrome: **Productivity**
- Firefox: **Appearance** or **Other**

## Privacy policy URL

**https://eligapris.com/quietview/privacy**

Publish content from [`PRIVACY.md`](../PRIVACY.md) at that URL. The extension popup Privacy link opens this page.

## Support

- **Publisher:** Eligapris
- **Support email:** support@eligapris.com
- **Homepage:** https://eligapris.com/quietview
- **Company site:** https://eligapris.com

## Permission justifications (Chrome Web Store)

| Permission | Justification |
|------------|---------------|
| `storage` | Save hide rules per website origin on the user’s device |
| `activeTab` | Read and message the tab the user is actively using when they open the popup |
| `scripting` | Inject content scripts on the active tab when needed for picker and rule application |
| `downloads` | Save exported JSON rule files when the user clicks Export |
| Host permission `<all_urls>` | Users choose arbitrary websites to hide elements; extension does not send page data to external servers |

## Screenshot captions (suggested)

1. **Popup** — QuietView popup showing rules for the current site
2. **Picker** — Element picker highlight on a busy page
3. **Before/after** — Sidebar hidden on WhatsApp Web or a news site

Recommended sizes: 1280×800 or 640×400 (Chrome); 1280×720 (Firefox).

## Firefox-specific

- **Add-on ID:** `quietview@eligapris.com` (set in `manifest.json`; permanent after first signing)
- **Minimum Firefox version:** 109.0
- **Data collection:** None — declare no data collection in AMO submission

## Version

**1.0.1**
