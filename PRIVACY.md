# QuietView Privacy Policy

**Last updated:** June 2026

QuietView is a browser extension that hides page elements you choose. This policy describes how the extension handles information.

## Summary

- QuietView does **not** collect, transmit, or sell personal data.
- All hide rules are stored **locally** in your browser via the extension storage API.
- QuietView does **not** contact remote servers for its core functionality.

## Data stored on your device

When you create hide rules (via picker, CSS selector, or HTML snippet), QuietView saves:

- Site origin (e.g. `https://example.com`)
- CSS selector string
- Rule metadata (enabled state, hide mode, source type, timestamps)

This data remains on your device unless you export it manually as JSON.

## Permissions

| Permission | Why it is needed |
|------------|------------------|
| `storage` | Save and load your per-site hide rules locally |
| `activeTab` | Interact with the tab you have open when using the popup |
| `scripting` | Inject the content script on the active tab if it is not already loaded |
| `downloads` | Save exported rule JSON when you choose Export |
| `<all_urls>` (host) | Apply hide rules on websites you choose; no background network access |

## Export and import

Export creates a JSON file on your computer. Import reads a file you select. QuietView does not upload these files anywhere.

## Third-party websites

QuietView runs on pages you visit to hide elements you select. It does not change how those sites collect data. Refer to each website’s own privacy policy for site-specific practices.

## Updates

If this policy changes, the updated file will be included in extension releases.

## Contact

For privacy questions, contact the developer listed on the Chrome Web Store or Firefox Add-ons listing page.
