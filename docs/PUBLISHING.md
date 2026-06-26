# QuietView Publishing Guide

This guide covers publishing QuietView to the Chrome Web Store and for self-hosting.

## Pre-publish Checklist

### Extension Files
- [x] `manifest.json` - v3, all permissions documented
- [x] Icons: 16, 32, 48, 96, 128px (PNG) + SVG source
- [x] Privacy policy: `PRIVACY.md` + hosted at https://eligapris.com/quietview/privacy
- [x] Store listing copy: `docs/STORE_LISTING.md`
- [x] Package script: `scripts/package.sh`

### Before Submitting

1. **Host the privacy policy** at `https://eligapris.com/quietview/privacy` (content from `PRIVACY.md`)

2. **Create screenshots** (1280x800 or 640x400 recommended):
   - Popup showing rules list
   - Element picker in action
   - Before/after of hidden elements

3. **Test the extension**:
   ```bash
   # Chrome: Load unpacked at chrome://extensions
   # Firefox: Load temporary at about:debugging#/runtime/this-firefox
   ```

4. **Build release package**:
   ```bash
   ./scripts/package.sh
   # Creates: dist/quietview-1.0.1.zip
   ```

---

## Chrome Web Store Publishing

### 1. Developer Account

- Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- Pay $5 one-time registration fee (if first time)

### 2. Create New Item

1. Click **"Add new item"**
2. Upload `dist/quietview-1.0.1.zip`
3. Fill in the **Store Listing**:

| Field | Value |
|-------|-------|
| Name | QuietView |
| Description (short) | Hide distracting page elements on any site. Pick, paste, or rule — your layout stays quiet. |
| Description (long) | See `docs/STORE_LISTING.md` |
| Category | Productivity |
| Language | English |

### 3. Screenshots

Upload at least one screenshot (1280×800 or 640×400):
1. Popup with rules list
2. Element picker on a busy page
3. Before/after comparison

### 4. Privacy & Permissions

| Permission | Justification |
|------------|---------------|
| `storage` | Save hide rules per website origin locally |
| `activeTab` | Access the active tab when user opens popup |
| `scripting` | Inject content scripts for picker and rule application |
| `downloads` | Export rules as JSON file |
| `<all_urls>` | Users choose arbitrary websites; no external data transmission |

Privacy policy URL: `https://eligapris.com/quietview/privacy`

### 5. Store Listing

| Field | Value |
|-------|-------|
| Developer | Eligapris |
| Support email | support@eligapris.com |
| Homepage URL | https://eligapris.com/quietview |
| Privacy policy | https://eligapris.com/quietview/privacy |

### 6. Submit

- Click **"Submit for review"**
- Review typically takes 3-7 days
- You'll receive email on approval/rejection

---

## Self-Hosting (Direct Download)

### Option 1: GitHub Releases

1. Create a new [GitHub Release](https://github.com/your-repo/releases/new)
2. Attach `dist/quietview-1.0.1.zip`
3. Add release notes from `CHANGELOG.md`

### Option 2: Website Download

1. Upload `dist/quietview-1.0.1.zip` to your website
2. Link to it with installation instructions:

```html
<a href="/downloads/quietview-1.0.1.zip" download>
  Download QuietView for Chrome
</a>
```

### Installation Instructions (for users)

**Chrome/Edge:**
1. Download the `.zip` file
2. Extract it
3. Open `chrome://extensions`
4. Enable "Developer mode"
5. Click "Load unpacked"
6. Select the extracted folder

**Firefox:**
1. Download the `.zip` file
2. Extract it
3. Open `about:debugging#/runtime/this-firefox`
4. Click "Load Temporary Add-on"
5. Select `manifest.json`

---

## Firefox Add-ons (AMO)

If you also want to publish to Firefox:

1. Go to [Firefox Developer Hub](https://addons.mozilla.org/developers/)
2. Click "Submit a New Add-on"
3. Upload `dist/quietview-1.0.1.zip`
4. The add-on ID `quietview@eligapris.com` is already in manifest.json
5. Use same listing copy as Chrome Web Store
6. Declare: **No data collection**

---

## Post-Publish

1. **Update README.md** with store links:
   ```markdown
   ### Chrome Web Store
   [Install](https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID)

   ### Firefox Add-ons
   [Install](https://addons.mozilla.org/firefox/addon/YOUR_SLUG)
   ```

2. **Announce** on your website and social channels

3. **Monitor reviews** and respond to user feedback

---

## Version Updates

To publish a new version:

1. Update `manifest.json` version
2. Update `CHANGELOG.md`
3. Run `./scripts/package.sh`
4. Upload new zip to store dashboard
5. Submit for review

---

## Contact Information

- **Publisher:** Eligapris
- **Support:** support@eligapris.com
- **Website:** https://eligapris.com/quietview
