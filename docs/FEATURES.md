# QuietView: Feature Catalogue

Every feature we've identified, grouped by theme and ranked. Status lives in [`../PROGRESS.md`](../PROGRESS.md). The reasoning behind each feature is in [`MARKET_RESEARCH.md`](MARKET_RESEARCH.md).

**Product rule:** QuietView has two verbs, **Hide** and **Focus**. A feature earns a place only if it makes one of them faster, more reliable or more trustworthy, or helps new people discover them. Users never configure what we can infer.

**Priority key:** **P0** = needed for the growth plan in the next 4 weeks · **P1** = within the 3-month window · **P2** = after the 1,000-user milestone · ✅ = shipped

---

## 1. Focus mode (the differentiator)

| Feature | Priority | Notes |
|---|---|---|
| Pick any element and make it fill the screen | ✅ v1.1 | Native fullscreen when the browser allows it, with an in-tab fill as fallback. One click, no settings. |
| Esc or the floating "Exit focus" pill restores the page exactly | ✅ v1.1 | Pill sits in the top layer, so it's visible even in native fullscreen. Fades to 25% after 2.5s. |
| Black letterbox for video, images, canvas and iframes | ✅ v1.1 | Requested in Maximize Video reviews. |
| Page background color carried into focus | ✅ v1.1 | Avoids white flashes on dark sites. |
| Neutralize transformed or filtered ancestors | ✅ v1.1 | Fixes the main reason "fullscreen anything" tools fail. |
| End focus cleanly if the site removes the element (SPA) | ✅ v1.1 | |
| Shortcut: Alt+Shift+F | ✅ v1.1 | |
| **Remember focus per site** ("always open WhatsApp focused on the chat") | P0 | Nobody does this. Uses in-tab fill on load, since fullscreen needs a click. One switch: "Focus this every time". |
| Smart target: on hover, prefer the meaningful container (video, main, article, chat pane, canvas) | P1 | Uses size and semantics. Reduces how often users need ↑. |
| Dim instead of remove (spotlight with 85% dark backdrop, page still visible) | P1 | One key cycles fill → dim. No settings page. |
| Pop out to an always-on-top window (Document Picture-in-Picture) | P2 | Chrome 116+. For chats, timers and dashboards. |
| Focus queue: Tab moves focus to the next sibling (e.g. next post or video) | P2 | |

## 2. Hiding

| Feature | Priority | Notes |
|---|---|---|
| Click-to-hide picker with live outline and element name and size | ✅ v1.1 | |
| ↑ / ↓ to select the parent or child, Enter to confirm, Esc to cancel | ✅ v1.1 | Lets users grab a whole panel without aiming at its edge. |
| Undo toast after every hide | ✅ v1.1 | |
| Rules persist per site and re-apply on SPA navigation | ✅ v1.0 | |
| Picker never fails with "matched N elements"; falls back to an exact path | ✅ v1.1 | |
| Readable rule names ("Trending sidebar", not a 200-character class soup) | ✅ v1.1 | |
| Stable-first selectors (id → data-testid → aria-label → classes → path) | ✅ v1.1 | |
| Remove vs. keep the space, remembered as a preference | ✅ v1.1 | Under More options. |
| CSS selector and HTML snippet rules | ✅ v1.0 | Moved under More options in v1.1. |
| Floating show/hide-all toggle on pages with rules | ✅ v1.0 | |
| **Self-healing rules**: store several fingerprints (attributes, ARIA, text anchor, path, size) and fall back through them | P0 | Fixes the top category complaint. |
| **"Needs re-pick" badge** when a rule matches nothing for N visits | P0 | Shows the failure instead of failing silently. |
| **Hide similar**: one click hides every matching card (e.g. all Shorts shelves) | P1 | Toast offers "Hide all 12 like this". |
| Blur instead of hide (for privacy and screen-sharing) | P1 | Big demand, given the 1.2M-user WhatsApp privacy extension. |
| Text rules: "hide blocks containing 'Sponsored'" | P1 | Plain words, no regex. |
| "What's hidden here" overlay: outlines everything hidden, click to restore | P1 | Addresses "this page looks broken". |
| Right-click → "Hide this" / "Focus this" | P1 | Context menu that skips the picker entirely. |
| Element picking inside iframes | P2 | |

## 3. Recipes (one-click outcomes for popular sites)

| Feature | Priority | Notes |
|---|---|---|
| **Recipe pack v1**: YouTube (Shorts, recommendations, comments), X (trends, who to follow), LinkedIn (feed), Reddit (sidebar), Facebook (Reels), Instagram (Reels tab), WhatsApp (chat list), Gmail (promos tab), sticky news headers | P0 | Popup shows "Suggested for youtube.com" when a recipe exists. |
| Recipes shipped as data and updatable without a store review | P1 | Signed JSON. Fall back to the bundled copy. |
| Share a cleanup by link (export a site's rules as a short importable URL) | P1 | Growth loop plus SEO pages. |
| Detox bundle: one click applies all feed killers | P1 | |
| "Report broken recipe" link that opens a prefilled GitHub issue | P1 | No telemetry needed. |
| Community recipe gallery on eligapris.com/quietview | P2 | |

## 4. Control and modes

| Feature | Priority | Notes |
|---|---|---|
| Per-rule switch, remove with Undo, remove all for a site with Undo | ✅ v1.1 | |
| Shortcuts shown in the popup, with a link to change them | ✅ v1.1 | |
| Pause QuietView on this site for 15 minutes | P1 | One click. Restores itself automatically. |
| Schedules: "Hide feeds 9–5 on weekdays" | P2 | One preset per site, not a cron editor. |
| Named modes (Work, Study, Off) | P2 | Only if schedules prove insufficient. |
| Toolbar badge with the number hidden on the current site | P1 | Shows the value at a glance and nudges the user to open the popup. |

## 5. Trust and portability

| Feature | Priority | Notes |
|---|---|---|
| Local-only storage, no analytics, no account | ✅ v1.0 | |
| Export all sites / import merges (never overwrites) | ✅ v1.1 | Reads v1 and v2 formats. |
| WhatsApp default rule seeded once, so deleting it is respected | ✅ v1.1 | Previously it came back on every popup open. |
| Firefox background fix (`importScripts` guard) | ✅ v1.1 | |
| Light and dark popup | ✅ v1.1 | |
| Optional sync via `storage.sync` (no Google login prompt) | P1 | Watch the quota: about 100KB, 8KB per item. Chunk per site. |
| Open-source the repo (MIT) | P1 | Trust signal for HN and Firefox audiences. |
| Optional host permissions (activeTab by default, grant per site) | P2 | Cleaner permission prompt and faster CWS review. Costs some convenience, so validate first. |
| Localize the extension UI (es, pt-BR, de, fr, ja) | P2 | Do the listing first; it's cheaper. |

## 6. Growth hooks inside the product

| Feature | Priority | Notes |
|---|---|---|
| One-time rating prompt after 3 successful hides or focuses | ✅ v1.1 | Local counters only, never shown again once answered. |
| "Rate" link in the popup footer | ✅ v1.1 | Goes to the CWS or AMO review page automatically. |
| Welcome page on first install: a 20-second interactive demo page (hide this, focus this) | P0 | Gets new users to the first success fast. That drives retention and reviews. |
| Uninstall feedback URL (one question, no tracking) | P1 | `chrome.runtime.setUninstallURL` → eligapris.com/quietview/bye |
| "Share this cleanup" button | P1 | See Recipes. |
| What's-new note after updates (popup, dismissible once) | P1 | Keeps users aware of new features like Focus. |

## 7. Store and website

| Item | Priority | Notes |
|---|---|---|
| Keyword title and short description | ✅ v1.1 | See MARKET_RESEARCH.md. |
| QuietView in the eligapris.com product catalog, nav-reachable | ✅ | /products/quietview plus the existing /quietview landing page. |
| New store screenshots: 5 × 1280×800 (Hide, Focus, ↑ picker, Undo, Privacy) | P0 | Current screenshots predate v1.1. |
| 1400×560 marquee and 440×280 tile | P0 | |
| 30-second demo video on the listing and site | P0 | |
| Firefox AMO and Edge Add-ons listings | P0 | |
| Localized listings (ja, es, pt-BR, de, fr, ko, zh) | P1 | |
| How-to landing pages ("Hide YouTube Shorts", "Make a video fill the window"…) | P1 | One page per job, each with an importable recipe. |
