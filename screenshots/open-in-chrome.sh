#!/usr/bin/env bash
# Open screenshot mockups directly in Chrome

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Opening QuietView screenshots in Chrome..."

# Try to find Chrome
CHROME_PATHS=(
    "/usr/bin/google-chrome"
    "/usr/bin/chromium"
    "/usr/bin/chromium-browser"
    "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"  # WSL
    "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"  # WSL
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"  # Windows
)

CHROME=""
for path in "${CHROME_PATHS[@]}"; do
    if [[ -f "$path" ]] || [[ -f "/mnt/$path" ]]; then
        CHROME="$path"
        break
    fi
done

# If Chrome not found, try google-chrome-stable
if [[ -z "$CHROME" ]]; then
    if command -v google-chrome-stable &> /dev/null; then
        CHROME="google-chrome-stable"
    elif command -v google-chrome &> /dev/null; then
        CHROME="google-chrome"
    elif command -v chromium-browser &> /dev/null; then
        CHROME="chromium-browser"
    fi
fi

if [[ -z "$CHROME" ]]; then
    echo "Chrome not found. Opening files in browser..."
    echo "Open these files manually:"
    echo "  file://$SCRIPT_DIR/popup.html"
    echo "  file://$SCRIPT_DIR/picker.html"
    echo "  file://$SCRIPT_DIR/before-after.html"
    exit 1
fi

echo "Using Chrome: $CHROME"

# Convert WSL path to Windows path if needed
if [[ -f "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" ]]; then
    SCRIPT_DIR_WIN=$(wslpath -w "$SCRIPT_DIR" 2>/dev/null || echo "$SCRIPT_DIR")
    "$CHROME" "$SCRIPT_DIR_WIN/popup.html" "$SCRIPT_DIR_WIN/picker.html" "$SCRIPT_DIR_WIN/before-after.html"
else
    "$CHROME" "$SCRIPT_DIR/popup.html" "$SCRIPT_DIR/picker.html" "$SCRIPT_DIR/before-after.html"
fi

echo ""
echo "Screenshot Tips:"
echo "1. Press F12 for DevTools, set viewport to 1280x800"
echo "2. Take screenshots at 1280x800 or crop to 640x400"
echo "3. Save as PNG for Chrome Web Store"
