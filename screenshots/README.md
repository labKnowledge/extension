# QuietView Screenshots

Store screenshot mockups for Chrome Web Store and Firefox AMO.

## Quick Start

```bash
./open-for-screenshots.sh
```

## Screenshots

| File | Purpose | Size |
|------|---------|------|
| `popup.html` | Main popup interface showing rules list | 1280×800 |
| `picker.html` | Element picker in action on a news site | 1280×800 |
| `before-after.html` | Before/after comparison (WhatsApp Web) | 1280×800 |

## How to Capture

1. Run `./open-for-screenshots.sh` or open each HTML file manually
2. Set browser viewport to 1280×800 (use DevTools Device Mode)
3. Take a screenshot of the entire mockup
4. Crop to recommended size:
   - **Chrome Web Store:** 1280×800 or 640×400
   - **Firefox AMO:** 1280×720
5. Save as PNG

## Tips

- Use Chrome DevTools → → More tools → Rendering
- Enable "Capture screenshot" for full-page capture
- Or use a screenshot tool like macOS Preview (Cmd+Shift+4)
