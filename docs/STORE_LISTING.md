# QuietView: Store listing copy (v1.1)

Use this for the Chrome Web Store, Firefox Add-ons (AMO) and Edge Add-ons. Positioning rationale: [`MARKET_RESEARCH.md`](MARKET_RESEARCH.md).

## Name (from manifest)

**QuietView: Hide Elements & Focus Mode**

## Short description (123 / 132 chars)

Hide distracting elements on any website with one click, or focus any element full screen. Saved per site. No CSS. Private.

## Long description

Hide distracting elements on any website with one click, or make the one thing you're working on fill your screen. QuietView remembers what you hid, so it stays gone every time you come back. No CSS, no account, and nothing leaves your browser.

**HIDE ANYTHING, ON ANY SITE**
Click "Hide an element", point at what bothers you, and click. It disappears now and stays hidden on that site from then on.
• YouTube Shorts, recommendations, comments
• Social feeds, trending sidebars, "who to follow"
• Cookie bars, promo banners, sticky headers
• Dashboard widgets you never use
• WhatsApp Web's chat list while you screen-share

**FOCUS MODE: MAKE ANY ELEMENT FILL YOUR SCREEN**
Click "Focus on an element" and pick a video, a chat, an article, a chart or a document. It goes full screen and everything else is gone. Press Esc to return. Video and images get a black backdrop, like a real player.

**BUILT SO YOU DON'T HAVE TO THINK ABOUT IT**
• Grab the whole panel: press ↑ to select the container instead of aiming at its edge
• Undo after every change
• Rules re-apply on pages that load content as you browse (YouTube, X, Gmail and similar)
• Shortcuts: Alt+Shift+H to hide, Alt+Shift+F to focus
• A floating button shows everything again whenever you need it
• Export and import all your rules

**PRIVATE BY DESIGN**
Your rules stay in your browser's local storage. No account, no analytics, no tracking, no remote servers.

**FOR POWER USERS**
Hide by CSS selector or pasted HTML, and choose whether hidden elements leave an empty space. You'll find both under "More options".

Made by Eligapris · eligapris.com/quietview

## Category

- Chrome: **Productivity → Workflow & Planning** (or Productivity)
- Firefox: **Appearance**
- Edge: **Productivity**

## Screenshots (1280×800, captions burned in)

1. "Focus any element. It fills your screen." (YouTube player focused)
2. "Hide distractions in one click." (feed before/after)
3. "Press ↑ to grab the whole panel." (picker hint bar visible)
4. "Everything you hid, per site. Undo anytime." (popup)
5. "No account. Nothing leaves your browser." (privacy card)

Promo tile 440×280 and marquee 1400×560: "Hide the noise. Focus on what matters."

## Privacy policy URL

https://eligapris.com/quietview/privacy

## Support

- Publisher: Eligapris
- Email: support@eligapris.com
- Homepage: https://eligapris.com/quietview

## Permission justifications (CWS)

| Permission | Justification |
|---|---|
| `storage` | Save the user's hide rules and preferences locally on their device |
| `activeTab` | Act on the tab the user is viewing when they click the toolbar button or use a shortcut |
| `scripting` | Load QuietView into tabs that were already open before install or update, so the picker works immediately |
| `downloads` | Save the JSON file when the user clicks "Export all sites" |
| Host `<all_urls>` | Users hide elements on any site they choose, and rules must re-apply automatically when that site loads. No page data is sent anywhere. |

**Single purpose:** Let users reduce distractions on web pages by hiding elements they choose or focusing a single element.

## Firefox

- Add-on ID: `quietview@eligapris.com`
- Data collection: none (declared in the manifest)

## Version

**1.1.0**
