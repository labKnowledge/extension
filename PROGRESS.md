# QuietView: Progress Tracker

**Goal:** go from about 10 to **1,000 weekly users** between **2026-10-01 and 2026-12-31**.
**North-star metric:** CWS "Weekly users" plus AMO "Daily users × 7" (rough), taken from the store dashboards every Monday.
**Supporting metrics:** listing conversion (CWS impressions → installs), rating (target ≥ 4.5 with 25+ reviews), 7-day retention (installs minus uninstalls).

Feature details: [`docs/FEATURES.md`](docs/FEATURES.md) · Why we're doing this: [`docs/MARKET_RESEARCH.md`](docs/MARKET_RESEARCH.md)

---

## Scoreboard (update every Monday)

| Week of | Users (CWS + AMO) | Target | Installs / wk | Uninstalls / wk | Rating (count) | Listing CTR | Notes |
|---|---|---|---|---|---|---|---|
| 2026-09-28 | ~10 | 10 | | | | | Baseline. v1.1 built. |
| 2026-10-05 | | 25 | | | | | v1.1 live on CWS + AMO + Edge |
| 2026-10-12 | | 50 | | | | | Directories + Reddit answers |
| 2026-10-19 | | 90 | | | | | Show HN |
| 2026-10-26 | | 150 | | | | | Product Hunt |
| 2026-11-02 | | 220 | | | | | Recipes v1 shipped |
| 2026-11-09 | | 300 | | | | | First how-to pages indexed |
| 2026-11-16 | | 390 | | | | | |
| 2026-11-23 | | 480 | | | | | Localized listings |
| 2026-11-30 | | 580 | | | | | Featured badge nomination |
| 2026-12-07 | | 690 | | | | | |
| 2026-12-14 | | 800 | | | | | |
| 2026-12-21 | | 900 | | | | | |
| 2026-12-28 | | **1,000** | | | | | Milestone review |

Funnel assumptions (estimates): about 300–500 users from the HN and PH spikes, 150–300 from Reddit answers and directories, and 5–10 per day of organic store search once the listing is optimized (about 400–700 over 10 weeks).
**If we're more than 30% behind target for 2 weeks in a row:** stop building features, rework the listing (title, first screenshot, short description), and do another launch burst.

---

## Phase 1: Ship v1.1 and fix the listing (Oct 1 – Oct 11)

Product
- [x] Focus mode: pick any element → fullscreen, Esc to exit, black letterbox for media
- [x] One picker for Hide and Focus with ↑/↓ resize, Enter, Esc, and a hint bar
- [x] Undo after hide and after delete
- [x] Picker never fails on ambiguous selectors; stable-first selectors; readable rule names
- [x] Popup redesign: two primary actions; advanced options collapsed; dark mode
- [x] Export all sites / merge import
- [x] Bug fixes: deleted WhatsApp default rule came back; Firefox background `importScripts`; QuietView's shortcut clashed with Type For Me (both used Ctrl+Shift+Y)
- [x] One-time rating prompt plus a footer "Rate" link
- [x] Store-keyword name and short description in the manifest
- [ ] Manual QA on Chrome and Firefox: WhatsApp Web, YouTube (focus the player), Gmail, Reddit, a news site
- [ ] Welcome page on first install with a hands-on demo (P0)

Store
- [ ] New screenshots 5 × 1280×800: ① Focus a YouTube player ② Hide a feed (before/after) ③ Picker with ↑ hint ④ Popup rules list ⑤ "Nothing leaves your browser"
- [ ] 1400×560 marquee, 440×280 tile
- [ ] 30-second demo video (YouTube, unlisted is fine) linked on the listing
- [ ] Rewrite the long description using `docs/STORE_LISTING.md` v1.1 copy
- [ ] Publish v1.1 on CWS
- [ ] Publish on Firefox AMO (almost no competition there)
- [ ] Publish on Edge Add-ons
- [ ] Verify the publisher domain (eligapris.com) in the CWS dashboard
- [ ] Put the real store URLs into `eligapris-site` (`/quietview` install buttons, `products.ts`) and the README

Website
- [x] QuietView added to the eligapris.com product catalog (/products, /products/quietview, home showcase, sitemap, analytics paths, SEO defaults)
- [x] /quietview landing page rewritten around Hide + Focus
- [ ] Deploy eligapris-site
- [ ] Embed the demo video on /quietview

## Phase 2: Launch bursts (Oct 12 – Nov 1)

- [ ] AlternativeTo: list QuietView as an alternative to Click to Remove Element, Unhook, News Feed Eradicator, Stylebot, uBlock Origin, Mercury Reader, Turn Off the Lights
- [ ] Directories: SaaSHub, Uneed, Microlaunch, Peerlist, BetaList, Fazier, There's An AI/Extension list sites, awesome-browser-extensions on GitHub
- [ ] Reddit, answering existing questions only, each with a 10-second GIF: "hide YouTube Shorts", "hide LinkedIn feed", "WhatsApp Web chat list while screen-sharing", "uBlock picker alternative". Subs: r/chrome_extensions, r/SideProject, r/firefox, r/browsers, r/nosurf, r/digitalminimalism. Check each sub's rules. **r/productivity bans self-promotion.**
- [ ] **Show HN** (weekday, about 8–9am US Eastern): "Show HN: QuietView – hide or full-screen any element on any site (local-only)". Stay in the comments for 3 hours.
- [ ] **Product Hunt** (Tue/Wed, 12:01am PT): GIF first, direct CWS link, reply to every comment within about 15 minutes
- [ ] Message 20 people who'd benefit (ADHD, students, remote workers) and ask for honest reviews. **Target: 20 genuine reviews by Nov 1.**
- [ ] Reply to every store review within 48 hours

## Phase 3: Compounding (Nov 2 – Dec 31)

Product
- [ ] Recipes v1: YouTube, X, LinkedIn, Reddit, Facebook, Instagram, WhatsApp, Gmail, news sticky bars (P0)
- [ ] Remember focus per site (P0)
- [ ] Self-healing rules plus a "needs re-pick" badge (P0)
- [ ] Toolbar badge with the hidden count; right-click Hide/Focus (P1)
- [ ] Hide similar; blur mode (P1)
- [ ] Share a cleanup by link (P1)
- [ ] Uninstall feedback URL; what's-new note (P1)
- [ ] Open-source the repo (P1)

Content and SEO (one page per week on eligapris.com/quietview/…)
- [ ] How to hide YouTube Shorts on desktop
- [ ] How to make any video fill your browser window
- [ ] How to hide the LinkedIn feed
- [ ] How to hide your WhatsApp Web chat list while screen-sharing
- [ ] How to remove sticky headers and cookie bars on news sites
- [ ] How to focus on one Google Doc / dashboard panel
- [ ] Each page gets a GIF, the manual method, "1 click with QuietView", and a recipe link

Video
- [ ] 6 vertical clips (15–30s before/after) for YouTube Shorts, TikTok and Reels: "YouTube without Shorts", "Make any video fill your screen", "LinkedIn without the feed"…
- [ ] One 2-minute tutorial on YouTube, embedded on the listing and site

Trust and reach
- [ ] Localized listings: ja, es, pt-BR, de, fr, ko, zh
- [ ] Nominate for the CWS Featured badge (One Stop Support form) once rating is ≥ 4.5 with 15+ reviews
- [ ] Email 10 authors of "best extensions to hide page elements" listicles, pitching the Focus angle
- [ ] Iterate the listing every 2–3 weeks from dashboard CTR

---

## Release log

| Date | Version | Highlights |
|---|---|---|
| 2026-06-03 | 1.0.0 | Picker, selector and snippet rules, per-site persistence, export/import |
| 2026-06-03 | 1.0.1 | Eligapris branding, privacy URL, Firefox ID |
| 2026-10-01 | 1.1.0 | **Focus mode**, resizable picker, Undo, popup redesign, merge import, store-keyword listing (built, not yet published) |

## Decisions

- **2026-10-01:** Positioned QuietView as "hide distractions and focus anything" rather than another element hider. Reason: the category leader is abandoned and no working generic focus tool exists. See MARKET_RESEARCH.md.
- **2026-10-01:** Moved the shortcuts to Alt+Shift+H (hide) and Alt+Shift+F (focus), because Type For Me (also Eligapris) uses Ctrl+Shift+Y. Existing installs keep their current binding.
- **2026-10-01:** Usage counters for the rating prompt stay local and are never sent anywhere. The privacy policy has been updated to say so.
