# Firefox Add-ons (AMO) Submission Guide

## Step 1: Go to Developer Hub

**URL:** https://addons.mozilla.org/developers/

1. Sign in with your Firefox account (or create one)
2. Click **"Submit a New Add-on"**

---

## Step 2: Upload Extension

**File to upload:** `dist/quietview-1.0.1.zip`

Drag and drop or click to upload.

---

## Step 3: Add-on Listing

Copy and paste the content below for each field:

### Name
```
QuietView
```

### Summary (132 chars max)
```
Hide distracting page elements on any site. Pick, paste, or rule — your layout stays quiet.
```

### Description
```
QuietView helps you focus by hiding clutter on any website — chat sidebars, news feeds, promo bars, dashboard widgets, and more.

**How it works**

1. Open a site and click the QuietView icon.
2. Pick an element on the page, paste a CSS selector, or paste an HTML snippet.
3. Your rules are saved per site and re-applied automatically, including on dynamic (SPA) pages.

**Features**

- Visual element picker
- CSS selector and HTML snippet rules
- display: none or visibility: hidden hide modes
- Per-site persistence
- Export and import rules as JSON
- Keyboard shortcut: Ctrl+Shift+Y (Cmd+Shift+Y on Mac)

QuietView stores rules locally on your device. No account required. No data sold.
```

### Category
Select: **Privacy & Security** or **Other**

---

## Step 4: Privacy Policy

**Privacy Policy URL:**
```
https://eligapris.com/quietview/privacy
```

This page is already live on your website.

---

## Step 5: Icons & Screenshots

### Icon
Upload: `icons/store-icon-128.png`

### Screenshots (upload 1-5)
Upload these PNG files from `screenshots/`:
- `popup.png` (1280×800)
- `picker.png` (1280×800)
- `before-after.png` (1280×800)

---

## Step 6: Data Collection

**Firefox asks about data collection:**

Answer: **No, this extension does not collect or use any data.**

---

## Step 7: Support

**Support email:**
```
support@eligapris.com
```

**Homepage:**
```
https://eligapris.com/quietview
```

---

## Step 8: Submit for Review

1. Click **"Submit for Review"**
2. Review typically takes 3-5 days
3. You'll receive email notification

---

## Firefox-Specific Notes

- **Add-on ID:** `quietview@eligapris.com` (permanent after first submission)
- **Minimum Firefox version:** 109.0 (already in manifest)
- **No submission fee** (unlike Chrome Web Store)
- **Review is more thorough** — they check code quality

---

## Quick Commands

```bash
# Rebuild if needed
./scripts/package.sh

# All files ready at:
# - dist/quietview-1.0.1.zip (upload this)
# - icons/store-icon-128.png (icon)
# - screenshots/*.png (screenshots)
```
