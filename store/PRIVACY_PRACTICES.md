# QuietView: Privacy practices (paste blocks)

For Chrome Web Store → Developer Dashboard → **Privacy practices** tab, version 1.2.0.
Permissions in the manifest: `storage`, `activeTab`, `scripting`, `downloads`, `contextMenus`; host `<all_urls>`.

## Single purpose

```
QuietView lets the user control what a web page shows: hide distracting elements they choose (remembered per site), make one element fill the screen (Focus), or cover sensitive information before recording or taking a screenshot (Redact). Every feature acts only on the page the user is viewing and only on elements the user picks or turns on.
```

## Permission justifications

### storage

```
Saves the user's hide rules per website, their preferences (hide style, toolbar button position) and an optional "focus this element every visit" choice in chrome.storage.local on the device. Two local counters (number of hides and focuses) decide when to show a one-time rating prompt. Nothing is synced or sent anywhere.
```

### activeTab

```
Lets QuietView act on the tab the user is viewing when they click the toolbar button, use a keyboard shortcut or choose a right-click menu item (start the element picker, Focus or Redact on that tab).
```

### scripting

```
Injects QuietView's own packaged content scripts into a tab that was already open before the extension was installed or updated, so the picker, Focus and Redact work immediately without a reload. No remote or dynamically generated code is injected.
```

### downloads

```
Saves files the user explicitly asks for: the JSON backup when they click "Export all sites", and the PNG when they click "Screenshot" in Redact mode. Files go to the user's Downloads folder only.
```

### contextMenus

```
Adds three right-click items, "Hide this element", "Focus on this element" and "Redact this element", that act on exactly the element the user right-clicked.
```

### Host permission (<all_urls>)

```
Users choose which websites to clean up, and their saved hide rules must re-apply automatically whenever those sites load (including pages that update as you scroll). The same access lets Redact capture a screenshot of the current tab (tabs.captureVisibleTab) when the user presses Screenshot. Page content is never read for any other purpose and never leaves the browser.
```

## Remote code

```
No. QuietView does not use remote code. All JavaScript ships inside the uploaded package; there is no eval, no remotely hosted script, and no dynamically fetched code.
```

## Data usage: what to tick

Tick **none** of the data categories. QuietView collects and transmits nothing.

| Category | Answer | Why |
|---|---|---|
| Personally identifiable information | No | No accounts, no forms sent anywhere |
| Health information | No | — |
| Financial and payment information | No | Redact auto-detect *finds* card numbers on the page to cover them. It runs locally, stores nothing and transmits nothing |
| Authentication information | No | Password fields are only covered, never read out or stored |
| Personal communications | No | — |
| Location | No | — |
| Web history | No | Rules store site origins the user chose to clean up, locally, not browsing history |
| User activity | No | No click or keystroke logging; the two local counters never leave the device |
| Website content | No | Content is only styled, not collected. Screenshots go to the user's own Downloads folder |

## Certifications (tick all three)

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

## Privacy policy URL

```
https://eligapris.com/quietview/privacy
```

**Deploy eligapris-site before submitting.** The live page still shows the June 2026 version, which doesn't mention `contextMenus`, Redact, screenshots or the "focus every visit" setting. Reviewers compare the policy with the permissions and features.
