#!/usr/bin/env bash
# Open screenshot mockups in browser for capture

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Opening QuietView screenshot mockups..."
echo "Take full-page screenshots at 1280x800 or 640x400"

# Open in default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$SCRIPT_DIR/popup.html"
    sleep 1
    open "$SCRIPT_DIR/picker.html"
    sleep 1
    open "$SCRIPT_DIR/before-after.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "$SCRIPT_DIR/popup.html"
    sleep 1
    xdg-open "$SCRIPT_DIR/picker.html"
    sleep 1
    xdg-open "$SCRIPT_DIR/before-after.html"
else
    start "$SCRIPT_DIR/popup.html"
    start "$SCRIPT_DIR/picker.html"
    start "$SCRIPT_DIR/before-after.html"
fi

echo ""
echo "Screenshot Tips:"
echo "1. Use browser DevTools to set viewport to 1280x800"
echo "2. Take full-page screenshots"
echo "3. Crop to 1280x800 or 640x400 for Chrome Web Store"
echo "4. PNG format recommended"
