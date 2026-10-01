# QuietView Privacy Policy

**Last updated:** October 2026  
**Operator:** [Eligapris](https://eligapris.com)  
**Canonical URL:** https://eligapris.com/quietview/privacy

QuietView is a browser extension that hides page elements you choose, or makes one element fill your screen (Focus mode). This policy describes how the extension handles information.

## Summary

- QuietView does **not** collect, transmit, or sell personal data.
- All hide rules are stored **locally** in your browser via the extension storage API.
- QuietView does **not** contact remote servers for its core functionality.

## Data stored on your device

When you create hide rules (via picker, CSS selector, or HTML snippet), QuietView saves:

- Site origin (e.g. `https://example.com`)
- CSS selector string
- Rule metadata (a short readable name for the element, enabled state, hide mode, source type, timestamps)
- Your preferences (for example, whether hidden elements leave an empty space) and the position of the on-page toggle button
- Two local counters: how many times you have hidden or focused an element. They are used only to decide when to show a one-time "rate QuietView" prompt, and are never sent anywhere

- If you turn on "Focus here every visit": the site origin and a selector and fingerprint of that element, so it can be focused automatically next time

Redact mode stores nothing: redactions live only on the open page until you reload or clear them. Auto-detect scans the page text inside your browser and never sends it anywhere. Screenshots are saved to your Downloads folder and, when the browser allows it, copied to your clipboard. QuietView does not upload them.

Otherwise, Focus mode stores nothing. It only changes how the current page is displayed until you exit.

This data remains on your device unless you export it manually as JSON.

## Permissions

| Permission | Why it is needed |
|------------|------------------|
| `storage` | Save and load your per-site hide rules locally |
| `activeTab` | Interact with the tab you have open when using the popup |
| `scripting` | Inject the content script on the active tab if it is not already loaded |
| `downloads` | Save exported rule JSON when you choose Export |
| `contextMenus` | Add "Hide this element" and "Focus on this element" to the right-click menu |
| `<all_urls>` (host) | Apply hide rules on websites you choose; no background network access |

## Export and import

Export creates a JSON file on your computer. Import reads a file you select. QuietView does not upload these files anywhere.

## Third-party websites

QuietView runs on pages you visit to hide elements you select. It does not change how those sites collect data. Refer to each website’s own privacy policy for site-specific practices.

## Updates

If this policy changes, the updated version will be published at https://eligapris.com/quietview/privacy and included in extension releases.

## Contact

For privacy questions, contact **support@eligapris.com** or visit https://eligapris.com/quietview.
