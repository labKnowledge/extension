# Asset Builder for QuietView Extension

Automatically generates all extension assets from source - icons, screenshots, and promotional graphics.

## Quick Start

```bash
./scripts/build-assets.sh
```

## What It Generates

| Asset | Sizes | Output Location |
|-------|-------|----------------|
| **Extension Icons** | 16, 32, 48, 96, 128px | `icons/icon-*.png` |
| **Store Icon** | 128px | `icons/store-icon-128.png` |
| **Screenshots** | 1280×800, 640×400 | `screenshots/*.png` |
| **Feature Banner** | 1280×320 | `dist/feature-banner.png` |

## Requirements

- **ImageMagick** - For icon generation
  ```bash
  sudo apt-get install imagemagick
  ```

- **Chrome or Chromium** - For screenshot generation
  ```bash
  sudo apt-get install google-chrome-stable
  ```

## Usage

### Generate all assets
```bash
./scripts/build-assets.sh
```

### Regenerate icons only
Edit the script and run individual functions:
```bash
# Edit build-assets.sh, comment out what you don't need
./scripts/build-assets.sh
```

### Update screenshots
1. Edit the HTML templates in `scripts/build-assets.sh`
2. Run `./scripts/build-assets.sh`

## Asset Specifications

### Chrome Web Store Requirements

| Asset | Size | Format |
|-------|------|--------|
| Store icon | 128×128 | PNG |
| Screenshots | 1280×800 or 640×400 | PNG |
| Extension icons | 16, 32, 48, 96, 128 | PNG |

### Manifest Icons

The extension's `manifest.json` references these icons:
```json
"icons": {
  "16": "icons/icon-16.png",
  "32": "icons/icon-32.png",
  "48": "icons/icon-48.png",
  "96": "icons/icon-96.png",
  "128": "icons/icon-128.png"
}
```

## Customization

### Change icon colors
Edit the SVG gradient in `build-assets.sh`:
```xml
<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stop-color="#YOUR_COLOR_1"/>
  <stop offset="100%" stop-color="#YOUR_COLOR_2"/>
</linearGradient>
```

### Modify screenshot content
Edit the HTML templates in the `create_screenshot_templates()` function.

## Output Structure

```
extension/
├── icons/
│   ├── icon.svg              (source)
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   ├── icon-96.png
│   ├── icon-128.png
│   └── store-icon-128.png
├── screenshots/
│   ├── popup.png              (1280×800)
│   ├── popup-640.png          (640×400)
│   ├── picker.png
│   ├── picker-640.png
│   ├── before-after.png
│   └── before-after-640.png
└── dist/
    ├── feature-banner.png
    └── quietview-X.X.X.zip    (via package.sh)
```
