# QuietView: Chrome Web Store listing (v1.2.0)

Everything to paste into the Developer Dashboard for **item `eljnmldcepcadaapeabdppafpcpgncka`**.
Listing: https://chromewebstore.google.com/detail/quietview/eljnmldcepcadaapeabdppafpcpgncka
Privacy answers: [`PRIVACY_PRACTICES.md`](PRIVACY_PRACTICES.md) · Positioning rationale: [`../docs/MARKET_RESEARCH.md`](../docs/MARKET_RESEARCH.md)

## Upload

`./scripts/package.sh` → `dist/quietview-1.2.0-store.zip`. The script refuses to build if the description is over 132 characters, the name is over 45, or an icon or script is missing.

## Name (from manifest, 40/45)

```
QuietView: Hide Elements, Focus & Redact
```

## Summary (from manifest, 116/132)

```
Hide distractions, focus any element full screen, or redact sensitive info for screenshots. Saved per site. Private.
```

## Category · Language

Productivity → **Workflow & Planning** · English

## Detailed description

The store shows this field as plain text, so the block below uses no markdown.

```
Hide distracting parts of any website with one click, make the one thing you're working on fill your screen, or black out sensitive info before you take a screenshot. QuietView remembers what you hid, so it stays gone every time you come back. No CSS, no account, and nothing leaves your browser.

HIDE ANYTHING, ON ANY SITE
Click "Hide an element", point at what bothers you, and click. It disappears now and stays hidden on that site from then on.
• YouTube Shorts, recommendations, comments
• Social feeds, trending sidebars, "who to follow"
• Cookie bars, promo banners, sticky headers
• Dashboard widgets you never use

FOCUS MODE: MAKE ANY ELEMENT FILL YOUR SCREEN
Click "Focus on an element" and pick a video, chat, article, chart or document. It goes full screen and everything else is gone. Press Esc to come back. Turn on "Focus here every visit" and the site opens already focused next time.

REDACT SENSITIVE INFO, THEN SCREENSHOT
Made for bloggers, tutors and anyone who records their screen. Click anything to blur it or black it out, or drag a box over any area. Turn on Auto-detect and QuietView covers emails, phone numbers, card numbers, API keys and IP addresses for you. One click saves a clean screenshot and copies it to your clipboard.

ONE-CLICK CLEANUPS
On YouTube, Reddit, X, Twitch and WhatsApp Web, switch off recommendations, comments, sidebars and more with one toggle.

RULES THAT FIX THEMSELVES
When a website redesigns, most element hiders silently stop working. QuietView remembers what you hid, finds it again, and tells you if something needs a quick re-pick.

BUILT SO YOU DON'T HAVE TO THINK ABOUT IT
• Press ↑ to grab the whole panel instead of aiming at its edge
• Right-click anything: Hide, Focus or Redact exactly that element
• "Hide all like this" removes every card of the same kind in one click
• Blur instead of hide (hover to peek), handy for screen-sharing
• Undo after every change
• Works on pages that keep loading as you scroll (YouTube, X, Gmail and similar)
• Shortcuts: Alt+Shift+H hide, Alt+Shift+F focus, Alt+Shift+R redact
• Export and import all your rules

PRIVATE BY DESIGN
Your rules stay in your browser's local storage. Screenshots are saved to your own Downloads folder. No account, no analytics, no tracking, no remote servers.

FOR POWER USERS
Hide by CSS selector or pasted HTML, and choose whether hidden elements leave an empty space, close the gap, or blur. You'll find all of it under "More options".

Made by Eligapris · https://eligapris.com/quietview
Privacy policy: https://eligapris.com/quietview/privacy
```

## What's new in 1.2.0

The dashboard has no "what's new" field. Use this for the GitHub release, the website and social posts.

```
• Redact: blur or black out anything, auto-detect emails, phones, cards, API keys and IPs, then take a one-click screenshot
• Focus mode: make any element fill your screen (Esc to exit), optionally on every visit
• One-click cleanups for YouTube, Reddit, X, Twitch and WhatsApp Web
• Rules repair themselves when a site changes its layout
• Right-click Hide / Focus / Redact, "Hide all like this", blur mode, Undo everywhere
• Redesigned popup, toolbar badge, and a 20-second welcome demo
```

## Graphics (in this folder, exact sizes, metadata stripped)

| Slot | File | Size |
|---|---|---|
| Screenshot 1 | `screenshot-1-focus.png` | 1280×800 |
| Screenshot 2 | `screenshot-2-hide.png` | 1280×800 |
| Screenshot 3 | `screenshot-3-redact.png` | 1280×800 |
| Screenshot 4 | `screenshot-4-cleanups.png` | 1280×800 |
| Screenshot 5 | `screenshot-5-picker.png` | 1280×800 |
| Small promo tile | `tile-440x280.png` | 440×280 |
| Marquee promo tile | `marquee-1400x560.png` | 1400×560 |
| Store icon | `../icons/icon-128.png` (already in the package) | 128×128 |

All screenshots show the real extension running on demo pages, captured automatically. They contain no store badges and no claims of ratings or user counts.

## Support

- Homepage: https://eligapris.com/quietview
- Support email: support@eligapris.com
- Publisher: Eligapris (verify eligapris.com in the dashboard for the publisher signal)

## Firefox (AMO) and Edge

Use the same zip, summary and description. Firefox add-on ID: `quietview@eligapris.com`; data collection: none (declared in the manifest). AMO category: **Appearance**. Edge category: **Productivity**.
