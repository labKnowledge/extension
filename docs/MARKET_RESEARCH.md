# QuietView: Market Research and Positioning

_Researched 2026-10-01. User counts come from Chrome Web Store (CWS) listings on that date. CWS rounds them. Anything marked **unverified** could not be confirmed on a primary page._

## TL;DR

1. **The category leader is abandoned.** Click to Remove Element (100K users, 4.3★) was last updated in Nov 2023. Its 2026 reviews say "totally ineffective", "breaks Pinterest search", and "UI covers the element".
2. **"Focus any element" is unclaimed.** The only generic tools are broken or abandoned: Fullscreen Anything has 2.5★ and FullscreenEverything 3.0★ (last updated 2022). Video-only versions have millions of users (Turn Off the Lights about 2.2M, PiP 4M). So the demand is proven, but nobody serves it for any element.
3. **No one combines hide, focus and remember-per-site.** That is QuietView's position.
4. **Single-site tools win by selling outcomes.** "No YouTube recommendations" (Unhook, 1M users) beats "click to hide" (generic hiders, 1K–100K). QuietView should sell the result ("YouTube without Shorts") while being the tool that works on every site.
5. **Firefox has almost no competition.** Generic hiders on AMO have 22–35 users.

## Competitor map

### Generic element hiders (direct)

| Extension | Users | Rating | Price | What it does well | Where it fails |
|---|---|---|---|---|---|
| uBlock Origin Lite | 21M | 4.5 | Free | Trust, scale; hidden "custom filter" picker | Picker is buried and produces CSS you edit in a dashboard. Beginners find it hard. No focus, no toggle. |
| **Click to Remove Element** | 100K | 4.3 | Free | One click, undo, shortcuts, import/export | **Not updated since 2023.** Reviews say it's ineffective, breaks sites, and its panel covers content. |
| Stylebot | 200K | 4.3 | Free | Visual CSS editor per site | Aimed at people who know CSS ("couldn't change anything"). |
| Stylus | 1M+ | 4.5 | Free | Community userstyles | No picker; needs CSS. |
| ElementHider (spoilers) | 10K | 4.4 | Freemium | Keyword hiding and blur on feeds | Paywalled features; built for keywords, not layout. |
| Snip | 5K | 4.1 | Free | Undo/redo, area snip, Google sync | Sync needs an account; no focus mode. |
| Remove Element, Zapit, Web Cleaner, Hide Anything, and others | 8–2K | 2.1–5.0 | Free | Simple | Rules don't save, no shortcuts, abandoned, spam. |

### Single-site distraction removers (adjacent, large audiences)

| Extension | Users | Rating | Lesson |
|---|---|---|---|
| Unhook (YouTube) | 1M | 4.9 | Toggles for outcomes. Users keep asking for more toggles. |
| News Feed Eradicator | 200K | 4.7 | Fixed site list. Endless "add TikTok/Twitch" requests. Breaks on LinkedIn changes. |
| UnDistracted | 90K | 4.7 | About $2/mo subscription is resented ("rather a one-time payment"). |
| Privacy Extension for WhatsApp Web | about 1.2M (**unverified**) | – | Hiding and blurring for privacy on one site is a big demand. |

### Reader modes (adjacent "focus")
Reader View (300K), Just Read (200K), Tranquility (about 3K, **unverified**). Mercury Reader is discontinued. **They only work on articles.** They fail on apps like WhatsApp, Gmail, dashboards, docs and video sites, which is where element focus works.

### Fullscreen and spotlight (direct competitors for Focus mode)

| Extension | Users | Rating | Notes |
|---|---|---|---|
| Picture-in-Picture (Google) | 4M | 3.9 | Video only |
| Turn Off the Lights | about 2.2M (vendor claim) | 4.6 | Dims around **video** only |
| Maximize Video | 20K | 4.8 | Video only. "2/2 sites didn't work." Users want black bars. |
| **Fullscreen Anything** | 2K | **2.5** | "Shutters my screen", "no kind of UI" |
| **FullscreenEverything** | 864 | **3.0** | v0.1.0, abandoned 2022 |
| FocusView | 8 | – | Brand new hover spotlight. The idea exists but hasn't been shipped well. |

## What users complain about, and our answer

| # | Complaint across the category | QuietView's answer | Status |
|---|---|---|---|
| 1 | Rules break after site redesigns | Prefer stable selectors (aria-label, data-testid, id) over generated classes. Next: multi-fingerprint rules that repair themselves | Partly shipped (v1.1) |
| 2 | Rules forgotten on reload | Per-site persistence plus SPA re-apply | Shipped |
| 3 | Too technical / needs CSS | Click to hide, arrow keys to resize the selection, readable rule names. CSS lives under "More options". | Shipped (v1.1) |
| 4 | Only supports one site | Works on every site. Recipes for popular sites next | Planned |
| 5 | Hiding breaks the site, with no way back | Undo toast after every hide, Undo after every delete, show-all toggle | Shipped (v1.1) |
| 6 | Picker UI gets in the way | Small hint bar that ignores the mouse; nothing to drag | Shipped (v1.1) |
| 7 | Abandoned | Public changelog and roadmap, steady releases | Ongoing |
| 8 | Subscriptions and account-tied sync | Free core, no account. `storage.sync` planned | Planned |
| 9 | No way to report a broken site | "Report a broken site" link that opens a prefilled issue | Planned |
| 10 | Spammy clones and low trust | Local-only, no analytics, public privacy policy, open source planned | Partly shipped |

## Positioning

**Category:** a focus tool for the web. It hides distractions on any site and can make the thing you're working on fill the screen.

**One-line value prop:** _Click anything to hide it, or click once to make it fill your screen. QuietView remembers it on every visit._

**Store title** (CWS shows about 35 characters in search; keywords in the title matter most):
`QuietView: Hide Elements & Focus Mode` ← shipped in v1.1 manifest

**Short description** (123/132 characters, shipped):
`Hide distracting elements on any website with one click, or focus any element full screen. Saved per site. No CSS. Private.`

**Tagline:** _Hide what distracts you. Focus on what matters._

**Keywords people search for:** hide elements, element hider, remove element, click to remove, remove distractions, distraction free, declutter, focus mode, hide YouTube Shorts, hide feed, fullscreen element, maximize video, reader mode.

**Three angles to test:**
1. **"The Click to Remove Element successor":** maintained, survives redesigns, includes focus. For HN and people who miss the uBlock picker.
2. **"Unhook for every site":** for productivity and ADHD audiences (once recipes ship).
3. **"Fullscreen anything, and it actually works":** for people searching for video, chat or dashboard focus.

### Language rules (applied in popup, listing and site)
- Describe outcomes, not mechanisms. Say "Hide an element", not "Add rule". Say "Leave an empty space", not `visibility: hidden`.
- Keep two verbs: **Hide** and **Focus**. Everything else is secondary.
- Always say what persists: "It stays hidden here."
- Make privacy concrete: "Nothing leaves your browser", not "privacy-first".

## Sources
- CWS listings and review pages for each extension named above (fetched 2026-10-01)
- HN threads on uBO picker alternatives: news.ycombinator.com/item?id=43325195
- CWS ranking data: extensionranker.com/blog/chrome-web-store-ranking-patterns
- CWS SEO case studies: dev.to/_350df62777eb55e1/chrome-web-store-seo-how-i-optimized-17-extensions-for-search-2maj, dev.to/mariusbongarts/seo-strategies-i-used-to-gain-2000-users-in-two-months-3og1
- Featured badge criteria: stefanvd.net/blog/2024/04/17/how-to-get-a-chrome-extension-featured/
- AlternativeTo listing gap: alternativeto.net/software/click-to-remove-element/
