#!/usr/bin/env bash
# QuietView Asset Builder
# Generates all extension assets from source (icons, screenshots, store materials)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS_DIR="$ROOT/assets"
DIST_DIR="$ROOT/dist"
SCREENSHOTS_DIR="$ROOT/screenshots"
ICONS_DIR="$ROOT/icons"

echo "🎨 QuietView Asset Builder"
echo "=========================="

# Create directories
mkdir -p "$ASSETS_DIR"
mkdir -p "$DIST_DIR"
mkdir -p "$SCREENSHOTS_DIR"
mkdir -p "$ICONS_DIR"

# Check for required tools
check_tools() {
  echo "Checking required tools..."

  if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick required for icon generation"
    echo "   Install: sudo apt-get install imagemagick"
    exit 1
  fi

  if ! command -v google-chrome &> /dev/null && ! command -v chromium-browser &> /dev/null; then
    echo "❌ Chrome or Chromium required for screenshot generation"
    echo "   Install: sudo apt-get install google-chrome-stable"
    exit 1
  fi

  echo "✅ All tools available"
}

# Generate icons from SVG
generate_icons() {
  echo ""
  echo "📦 Generating icons..."

  # Create the master SVG icon
  cat > "$ASSETS_DIR/icon-master.svg" << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#667eea"/>
      <stop offset="100%" stop-color="#764ba2"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#bg)" filter="url(#shadow)"/>
  <g>
    <rect x="20" y="28" width="88" height="56" rx="8" fill="none" stroke="white" stroke-width="5" opacity="0.95"/>
    <circle cx="30" cy="38" r="2.5" fill="#ff5f57"/>
    <circle cx="38" cy="38" r="2.5" fill="#febc2e"/>
    <circle cx="46" cy="38" r="2.5" fill="#28c840"/>
    <path d="M38 56 Q64 44 90 56 Q64 68 38 56 Z" fill="none" stroke="white" stroke-width="3" opacity="0.9"/>
    <circle cx="64" cy="56" r="12" fill="white" opacity="0.95"/>
    <circle cx="64" cy="56" r="6" fill="#764ba2"/>
    <g opacity="0.4">
      <rect x="26" y="92" width="76" height="4" rx="2" fill="white"/>
      <rect x="36" y="100" width="56" height="3" rx="1.5" fill="white"/>
    </g>
  </g>
  <rect width="128" height="64" rx="28" fill="white" opacity="0.08" clip-path="inset(0 0 50% 0)"/>
</svg>
SVG

  # Generate all required sizes
  local sizes=(16 32 48 96 128)
  for size in "${sizes[@]}"; do
    convert -background none -density 300 -resize "${size}x${size}" \
      "$ASSETS_DIR/icon-master.svg" "$ICONS_DIR/icon-${size}.png"
    echo "  ✓ icon-${size}.png"
  done

  # Copy SVG source
  cp "$ASSETS_DIR/icon-master.svg" "$ICONS_DIR/icon.svg"

  echo "✅ Icons generated"
}

# Generate store icon
generate_store_icon() {
  echo ""
  echo "🏪 Generating store icon..."

  convert -background none -density 300 -resize 128x128 \
    "$ICONS_DIR/icon.svg" "$ICONS_DIR/store-icon-128.png"

  echo "  ✓ store-icon-128.png"
  echo "✅ Store icon generated"
}

# Generate screenshot mockups
generate_screenshots() {
  echo ""
  echo "📸 Generating screenshot templates..."

  # Detect Chrome
  local CHROME="google-chrome"
  if ! command -v google-chrome &> /dev/null; then
    CHROME="chromium-browser"
  fi

  # Create screenshot HTML templates
  create_screenshot_templates

  # Capture screenshots at both sizes
  local sizes=("1280,800" "640,400")
  local screenshots=("popup" "picker" "before-after")

  for size in "${sizes[@]}"; do
    local width="${size%%,*}"
    local height="${size##*,}"
    local suffix=""
    if [[ "$width" == "640" ]]; then
      suffix="-640"
    fi

    for shot in "${screenshots[@]}"; do
      local output="$SCREENSHOTS_DIR/${shot}${suffix}.png"
      "$CHROME" --headless --disable-gpu \
        --screenshot="$output" \
        --window-size="$size" \
        --virtual-time-budget=1000 \
        "file://$SCREENSHOTS_DIR/${shot}.html" 2>/dev/null || true

      if [[ -f "$output" ]]; then
        echo "  ✓ ${shot}${suffix}.png"
      fi
    done
  done

  echo "✅ Screenshots generated"
}

create_screenshot_templates() {
  # Popup screenshot
  cat > "$SCREENSHOTS_DIR/popup.html" << 'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1280, height=800, initial-scale=1.0">
  <title>QuietView - Popup</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #2d2d2d; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 0; overflow: hidden; }
    .browser { background: #2d2d2d; width: 100vw; height: 100vh; display: flex; flex-direction: column; }
    .header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #2d2d2d; }
    .dots { display: flex; gap: 8px; }
    .dots span { width: 12px; height: 12px; border-radius: 50%; }
    .dots .red { background: #ff5f56; } .dots .yellow { background: #ffbd2e; } .dots .green { background: #27c93f; }
    .url { flex: 1; background: #1a1a1a; border-radius: 6px; padding: 8px 16px; color: #888; font-size: 13px; text-align: center; }
    .content { flex: 1; background: #f5f5f5; position: relative; display: flex; }
    .page { flex: 1; padding: 20px; background: #fff; }
    .sidebar { position: absolute; right: 20px; top: 60px; width: 200px; height: 300px; background: #fff8; border: 2px dashed #e74c3c; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #e74c3c; font-weight: 600; font-size: 14px; }
    .popup { position: absolute; top: 50px; right: 100px; width: 320px; background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); overflow: hidden; }
    .popup-header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 16px; display: flex; align-items: center; gap: 12px; }
    .popup-icon { width: 32px; height: 32px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .popup-title h3 { color: white; font-size: 16px; font-weight: 600; } .popup-title p { color: rgba(255,255,255,0.8); font-size: 11px; margin-top: 2px; }
    .popup-body { padding: 16px; }
    .origin { background: #f0f0f0; padding: 8px 12px; border-radius: 6px; font-size: 12px; color: #666; margin-bottom: 16px; }
    .panel { background: #f8f9fa; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .panel h4 { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 8px; }
    .rule { background: white; border-radius: 6px; padding: 10px; margin-bottom: 8px; border-left: 3px solid #667eea; font-size: 12px; color: #444; }
    .rule-selector { font-family: monospace; font-size: 11px; color: #888; margin-top: 4px; }
    .badge { display: inline-block; background: #27c93f; color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 8px; }
  </style>
</head>
<body>
  <div class="browser">
    <div class="header">
      <div class="dots"><span class="red"></span><span class="yellow"></span><span class="green"></span></div>
      <div class="url">web.whatsapp.com</div>
    </div>
    <div class="content">
      <div class="page"></div>
      <div class="sidebar">Hidden sidebar</div>
      <div class="popup">
        <div class="popup-header">
          <div class="popup-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></div>
          <div class="popup-title"><h3>QuietView</h3><p>Hide clutter. Keep your view quiet.</p></div>
        </div>
        <div class="popup-body">
          <div class="origin">web.whatsapp.com</div>
          <div class="panel"><h4>Rules (2 active)</h4><div class="rule">Chat list sidebar<span class="badge">On</span><div class="rule-selector">#pane-side</div></div><div class="rule">Header section<span class="badge">On</span><div class="rule-selector">header > div</div></div></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
HTML

  # Picker screenshot
  cat > "$SCREENSHOTS_DIR/picker.html" << 'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1280, height=800, initial-scale=1.0">
  <title>QuietView - Picker</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #2d2d2d; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 0; overflow: hidden; }
    .browser { background: #2d2d2d; width: 100vw; height: 100vh; display: flex; flex-direction: column; }
    .header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #2d2d2d; }
    .dots { display: flex; gap: 8px; }
    .dots span { width: 12px; height: 12px; border-radius: 50%; }
    .dots .red { background: #ff5f56; } .dots .yellow { background: #ffbd2e; } .dots .green { background: #27c93f; }
    .url { flex: 1; background: #1a1a1a; border-radius: 6px; padding: 8px 16px; color: #888; font-size: 13px; text-align: center; }
    .content { flex: 1; background: #f0f0f0; position: relative; display: flex; align-items: center; justify-content: center; }
    .news { background: white; border-radius: 12px; padding: 30px; width: 80%; max-width: 900px; }
    .news h1 { font-size: 24px; color: #1a1a2e; margin-bottom: 8px; }
    .news p { color: #666; font-size: 14px; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
    .articles { background: #f8f9fa; border-radius: 8px; padding: 20px; }
    .article { padding: 12px 0; border-bottom: 1px solid #eee; }
    .article h3 { font-size: 14px; color: #1a1a2e; }
    .article p { font-size: 12px; color: #666; }
    .sidebar { background: linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1)); border: 2px solid #667eea; border-radius: 8px; padding: 20px; position: relative; }
    .sidebar::before { content: 'Click to hide'; position: absolute; top: -35px; left: 50%; transform: translateX(-50%); background: #667eea; color: white; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .sidebar::after { content: ''; position: absolute; top: -9px; left: 50%; transform: translateX(-50%); border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #667eea; }
    .sidebar h4 { font-size: 14px; color: #1a1a2e; margin-bottom: 12px; }
    .item { padding: 8px 0; font-size: 12px; color: #444; border-bottom: 1px solid rgba(0,0,0,0.05); }
    .cursor { position: absolute; font-size: 28px; top: 35%; left: 60%; }
    .tooltip { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.9); color: white; padding: 12px 20px; border-radius: 8px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="browser">
    <div class="header">
      <div class="dots"><span class="red"></span><span class="yellow"></span><span class="green"></span></div>
      <div class="url">news.example.com</div>
    </div>
    <div class="content">
      <div class="news">
        <h1>Daily News</h1>
        <p>Your trusted source</p>
        <div class="grid">
          <div class="articles">
            <div class="article"><h3>Breaking: Tech Advances</h3><p>Latest developments...</p></div>
            <div class="article"><h3>Global Markets Update</h3><p>Stock markets show...</p></div>
          </div>
          <div class="sidebar">
            <h4>Trending</h4>
            <div class="item">Top 10 Destinations</div>
            <div class="item">Celebrity News</div>
            <div class="item">Viral Videos</div>
          </div>
        </div>
      </div>
      <div class="cursor">👆</div>
      <div class="tooltip">Element Picker — Click any element to hide it</div>
    </div>
  </div>
</body>
</html>
HTML

  # Before/After screenshot
  cat > "$SCREENSHOTS_DIR/before-after.html" << 'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1280, height=800, initial-scale=1.0">
  <title>QuietView - Before/After</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 0; overflow: hidden; }
    .container { display: flex; gap: 20px; align-items: center; }
    .browser { background: #2d2d2d; border-radius: 8px; padding: 0; width: 580px; height: 400px; }
    .browser-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #2d2d2d; }
    .dots { display: flex; gap: 8px; }
    .dots span { width: 12px; height: 12px; border-radius: 50%; }
    .dots .red { background: #ff5f56; } .dots .yellow { background: #ffbd2e; } .dots .green { background: #27c93f; }
    .url { flex: 1; background: #1a1a1a; border-radius: 6px; padding: 8px 16px; color: #888; font-size: 13px; text-align: center; }
    .content { height: 352px; background: #111b21; display: flex; }
    .sidebar { width: 280px; background: #111b21; border-right: 1px solid #2a3942; padding: 12px; }
    .sidebar.hidden { display: none; }
    .chat-item { display: flex; align-items: center; gap: 12px; padding: 10px; background: #202c33; border-radius: 8px; margin-bottom: 8px; }
    .chat-item .avatar { width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; }
    .chat-item .info h5 { color: #e9edef; font-size: 13px; } .chat-item .info p { color: #8696a0; font-size: 11px; }
    .main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }
    .main.expanded { flex: 1; }
    .logo { width: 60px; height: 60px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .logo svg { width: 30px; height: 30px; stroke: white; }
    .label { text-align: center; margin-top: 12px; font-size: 13px; font-weight: 600; }
    .label.before { color: #e74c3c; } .label.after { color: #27c93f; }
    .arrow { font-size: 28px; color: #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <div>
      <div class="browser">
        <div class="browser-header"><div class="dots"><span class="red"></span><span class="yellow"></span><span class="green"></span></div><div class="url">web.whatsapp.com</div></div>
        <div class="content">
          <div class="sidebar">
            <div class="chat-item"><div class="avatar"></div><div class="info"><h5>Work Team</h5><p>Meeting at 3pm</p></div></div>
            <div class="chat-item"><div class="avatar"></div><div class="info"><h5>Family</h5><p>Mom: Call me</p></div></div>
            <div class="chat-item"><div class="avatar"></div><div class="info"><h5>Friend</h5><p>Check this out</p></div></div>
          </div>
          <div class="main">
            <div class="logo"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
            <p style="color:#8696a0;font-size:13px;">WhatsApp Web</p>
          </div>
        </div>
      </div>
      <div class="label before">BEFORE</div>
    </div>
    <div class="arrow">→</div>
    <div>
      <div class="browser">
        <div class="browser-header"><div class="dots"><span class="red"></span><span class="yellow"></span><span class="green"></span></div><div class="url">web.whatsapp.com</div></div>
        <div class="content">
          <div class="sidebar hidden"></div>
          <div class="main expanded">
            <div class="logo"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
            <p style="color:#8696a0;font-size:13px;">Clean, focused view</p>
          </div>
        </div>
      </div>
      <div class="label after">AFTER</div>
    </div>
  </div>
</body>
</html>
HTML
}

# Generate promotional graphics
generate_promo() {
  echo ""
  echo "📢 Generating promotional graphics..."

  # Feature banner (1280x320 for website header)
  cat > "$ASSETS_DIR/feature-banner.svg" << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 320">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#667eea"/>
      <stop offset="100%" stop-color="#764ba2"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="320" fill="url(#bg)"/>
  <text x="640" y="120" text-anchor="middle" fill="white" font-family="system-ui, sans-serif" font-size="48" font-weight="bold">QuietView</text>
  <text x="640" y="170" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="system-ui, sans-serif" font-size="24">Hide clutter. Keep your view quiet.</text>
  <g transform="translate(560, 200)">
    <rect x="0" y="0" width="160" height="50" rx="25" fill="white" opacity="0.2"/>
    <text x="80" y="32" text-anchor="middle" fill="white" font-family="system-ui, sans-serif" font-size="16" font-weight="600">Get Started</text>
  </g>
</svg>
SVG

  convert -background none -density 150 -resize 1280x320 \
    "$ASSETS_DIR/feature-banner.svg" "$DIST_DIR/feature-banner.png"

  echo "  ✓ feature-banner.png"
  echo "✅ Promotional graphics generated"
}

# Main execution
main() {
  check_tools
  generate_icons
  generate_store_icon
  generate_screenshots
  generate_promo

  echo ""
  echo "================================"
  echo "✅ All assets generated successfully!"
  echo ""
  echo "Generated files:"
  echo "  Icons:      icons/*.png"
  echo "  Screenshots: screenshots/*.png"
  echo "  Promo:      dist/feature-banner.png"
  echo ""
  echo "Ready for Chrome Web Store submission!"
}

main "$@"
