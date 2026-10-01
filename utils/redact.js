// Redact mode: cover sensitive things on a page before recording or taking a
// screenshot. Three ways to redact, all reversible and none of them editing
// the page's text:
//   • click an element      → element is blurred or blacked out
//   • drag a box            → an overlay covers any area (part of an image…)
//   • auto-detect           → emails, phones, cards, keys, IPs found in text
//                             are painted over with the CSS Highlight API
// Redactions stay until the page reloads or the user clears them.
(function initQuietViewRedact(global) {
  const EL_ATTR = "data-quietview-redact";
  const STYLE_ID = "quietview-redact-style";
  const BOX_CLASS = "quietview-redact-box";
  const TOOLBAR_ID = "quietview-redact-toolbar";
  const OUTLINE_ID = "quietview-redact-outline";
  const HIGHLIGHT_NAME = "quietview-redact";
  const DRAG_THRESHOLD = 6;
  const MAX_TEXT_NODES = 20000;

  const state = {
    style: "blur", // "blur" | "black"
    autoDetect: false,
    history: [], // [{ kind: "element", el } | { kind: "box", box }]
    active: false,
    ui: null,
    drag: null,
    hover: null,
    autoTimer: null,
    autoObserver: null,
    options: {}
  };

  // -------------------------------------------------------------------------
  // Detection of sensitive text
  // -------------------------------------------------------------------------

  function luhnValid(digits) {
    let sum = 0;
    let double = false;
    for (let i = digits.length - 1; i >= 0; i -= 1) {
      let d = Number(digits[i]);
      if (double) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      double = !double;
    }
    return sum % 10 === 0;
  }

  // Each detector returns true to confirm a regex match is real, which keeps
  // false positives (dates, version numbers, prices) out.
  const DETECTORS = [
    { name: "email", re: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
    {
      name: "secret",
      re: /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{10,}|\bsk-[A-Za-z0-9_-]{20,}|\bgh[pousr]_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{30,}|\bxox[abprs]-[A-Za-z0-9-]{10,}|\bAKIA[0-9A-Z]{16}\b|\bAIza[0-9A-Za-z_-]{35}\b|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g
    },
    {
      name: "card",
      re: /\b(?:\d[ -]?){12,18}\d\b/g,
      confirm: (match) => {
        const digits = match.replace(/\D/g, "");
        return digits.length >= 13 && digits.length <= 19 && luhnValid(digits);
      }
    },
    {
      name: "ip",
      re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      confirm: (match) => match.split(".").every((part) => Number(part) <= 255)
    },
    {
      name: "phone",
      re: /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{2,4}[\s.-]\d{3,4}(?:[\s.-]?\d{2,4})?\b/g,
      confirm: (match) => {
        const digits = match.replace(/\D/g, "");
        // Dates like 2026-10-01 have 8 digits; real numbers have 9+.
        return digits.length >= 9 && digits.length <= 15 && !/^\d{4}-\d{2}-\d{2}$/.test(match.trim());
      }
    },
    {
      // Long random-looking tokens (mixed letters and digits, 32+ chars).
      name: "token",
      re: /\b[A-Za-z0-9_-]{32,}\b/g,
      confirm: (match) => /\d/.test(match) && /[A-Za-z]/.test(match) && !/^[a-z-]+$/.test(match)
    }
  ];

  // Returns merged, non-overlapping [start, end] ranges. When in doubt the
  // detectors over-cover: leaking a number is worse than hiding an extra one.
  function findSensitive(text) {
    const hits = [];
    for (const detector of DETECTORS) {
      detector.re.lastIndex = 0;
      let match;
      while ((match = detector.re.exec(text))) {
        if (!detector.confirm || detector.confirm(match[0])) {
          hits.push([match.index, match.index + match[0].length]);
        }
      }
    }
    hits.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const hit of hits) {
      const last = merged[merged.length - 1];
      if (last && hit[0] <= last[1]) {
        last[1] = Math.max(last[1], hit[1]);
      } else {
        merged.push([...hit]);
      }
    }
    return merged;
  }

  function isOwnUi(node) {
    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return Boolean(el && el.closest(`#${TOOLBAR_ID}, #${OUTLINE_ID}, .${BOX_CLASS}, #quietview-toast`));
  }

  function scanText() {
    const ranges = [];
    const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(parent.tagName) || isOwnUi(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.trim().length >= 6 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    let count = 0;
    let node;
    while ((node = walker.nextNode()) && count < MAX_TEXT_NODES) {
      count += 1;
      for (const [start, end] of findSensitive(node.nodeValue)) {
        const range = new Range();
        range.setStart(node, start);
        range.setEnd(node, end);
        ranges.push(range);
      }
    }
    return ranges;
  }

  // Form fields can't be highlighted; redact the whole field instead.
  function scanFields() {
    const fields = [];
    for (const field of document.querySelectorAll("input, textarea")) {
      const type = (field.getAttribute("type") || "text").toLowerCase();
      if (type === "password" || (field.value && findSensitive(field.value).length)) {
        if (type !== "password" || field.value) {
          fields.push(field);
        }
      }
    }
    return fields;
  }

  function runAutoDetect() {
    if (!state.autoDetect) {
      return 0;
    }
    let found = 0;
    if (typeof Highlight === "function" && global.CSS?.highlights) {
      const ranges = scanText();
      CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(...ranges));
      found += ranges.length;
    }
    for (const el of document.querySelectorAll(`[${EL_ATTR}="auto"]`)) {
      el.removeAttribute(EL_ATTR);
    }
    for (const field of scanFields()) {
      if (!field.hasAttribute(EL_ATTR)) {
        field.setAttribute(EL_ATTR, "auto");
        found += 1;
      }
    }
    return found;
  }

  function clearAutoDetect() {
    global.CSS?.highlights?.delete(HIGHLIGHT_NAME);
    document.querySelectorAll(`[${EL_ATTR}="auto"]`).forEach((el) => el.removeAttribute(EL_ATTR));
  }

  function watchForNewText() {
    if (state.autoObserver) {
      return;
    }
    state.autoObserver = new MutationObserver((records) => {
      if (records.every((record) => isOwnUi(record.target))) {
        return;
      }
      window.clearTimeout(state.autoTimer);
      state.autoTimer = window.setTimeout(runAutoDetect, 250);
    });
    state.autoObserver.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  function setAutoDetect(enabled) {
    state.autoDetect = enabled;
    if (enabled) {
      watchForNewText();
      return runAutoDetect();
    }
    state.autoObserver?.disconnect();
    state.autoObserver = null;
    clearAutoDetect();
    return 0;
  }

  // -------------------------------------------------------------------------
  // Styles
  // -------------------------------------------------------------------------

  function applyStyles() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    const black = state.style === "black";
    style.textContent = `
      [${EL_ATTR}] {
        ${black
          ? "filter: brightness(0) !important; background: #000 !important;"
          : "filter: blur(9px) !important;"}
      }
      .${BOX_CLASS} {
        position: absolute; z-index: 2147483645; pointer-events: none; border-radius: 3px;
        ${black ? "background: #000;" : "backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); background: rgba(128,128,128,0.18);"}
      }
      ::highlight(${HIGHLIGHT_NAME}) {
        ${black
          ? "background-color: #000; color: #000;"
          : "background-color: rgba(128,128,128,0.35); color: transparent; text-shadow: 0 0 8px rgba(110,110,110,0.95);"}
      }
    `;
  }

  function setStyle(style) {
    state.style = style === "black" ? "black" : "blur";
    applyStyles();
  }

  // -------------------------------------------------------------------------
  // Manual redactions
  // -------------------------------------------------------------------------

  function redactElement(el) {
    if (!el || isOwnUi(el)) {
      return;
    }
    if (el.getAttribute(EL_ATTR) === "manual") {
      // Clicking a redacted element again un-redacts it.
      el.removeAttribute(EL_ATTR);
      state.history = state.history.filter((entry) => entry.el !== el);
      return;
    }
    el.setAttribute(EL_ATTR, "manual");
    state.history.push({ kind: "element", el });
  }

  function addBox(left, top, width, height) {
    const box = document.createElement("div");
    box.className = BOX_CLASS;
    Object.assign(box.style, {
      left: `${left + window.scrollX}px`,
      top: `${top + window.scrollY}px`,
      width: `${width}px`,
      height: `${height}px`
    });
    document.documentElement.appendChild(box);
    state.history.push({ kind: "box", box });
    return box;
  }

  function undo() {
    const last = state.history.pop();
    if (!last) {
      return false;
    }
    if (last.kind === "box") {
      last.box.remove();
    } else {
      last.el.removeAttribute(EL_ATTR);
    }
    return true;
  }

  function clearAll() {
    state.history = [];
    document.querySelectorAll(`[${EL_ATTR}]`).forEach((el) => el.removeAttribute(EL_ATTR));
    document.querySelectorAll(`.${BOX_CLASS}`).forEach((box) => box.remove());
    setAutoDetect(false);
  }

  function count() {
    return (
      document.querySelectorAll(`[${EL_ATTR}], .${BOX_CLASS}`).length +
      (global.CSS?.highlights?.get(HIGHLIGHT_NAME)?.size || 0)
    );
  }

  // -------------------------------------------------------------------------
  // Toolbar and pointer handling while Redact mode is on
  // -------------------------------------------------------------------------

  function toggleAutoDetect() {
    const found = setAutoDetect(!state.autoDetect);
    state.renderToolbar?.();
    if (state.autoDetect) {
      state.options.notify?.(found ? `Covered ${found} sensitive item${found === 1 ? "" : "s"}.` : "Nothing sensitive found on this page.");
    }
  }

  function toggleStyle() {
    setStyle(state.style === "blur" ? "black" : "blur");
    state.renderToolbar?.();
  }

  function buildToolbar() {
    const host = document.createElement("div");
    host.id = TOOLBAR_ID;
    host.style.cssText = "position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483647;";
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = `
      <style>
        .bar { display: flex; align-items: center; gap: 6px; padding: 6px 8px 6px 14px; border-radius: 12px;
          background: rgba(17, 24, 39, 0.94); color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          font: 13px/1.2 system-ui, -apple-system, "Segoe UI", sans-serif; white-space: nowrap; }
        .hint { opacity: 0.8; margin-right: 6px; }
        button { all: unset; cursor: pointer; padding: 7px 10px; border-radius: 8px; font-weight: 600; }
        button:hover { background: rgba(255,255,255,0.12); }
        button:focus-visible { outline: 2px solid #7fdede; }
        .seg { display: inline-flex; background: rgba(255,255,255,0.1); border-radius: 8px; padding: 2px; }
        .seg button { padding: 5px 9px; font-weight: 500; }
        .seg button[aria-pressed="true"] { background: #fff; color: #111; }
        .auto[aria-pressed="true"] { background: #2d8f8f; }
        .shot { background: #2d8f8f; }
        .shot:hover { background: #267a7a; }
        .sep { width: 1px; height: 20px; background: rgba(255,255,255,0.2); }
      </style>
      <div class="bar" role="toolbar" aria-label="QuietView redact">
        <span class="hint">Click or drag to cover</span>
        <span class="seg" role="group" aria-label="Style (B to switch)">
          <button class="style" data-style="blur" type="button">Blur</button>
          <button class="style" data-style="black" type="button">Black</button>
        </span>
        <button class="auto" type="button" title="Find emails, phone numbers, card numbers, API keys and IP addresses (A)">Auto-detect</button>
        <button class="undo" type="button" title="Undo (Z)">Undo</button>
        <span class="sep"></span>
        <button class="shot" type="button" title="Save and copy a screenshot of this tab (S)">Screenshot</button>
        <button class="done" type="button" title="Done (Esc)">Done</button>
      </div>
    `;
    const q = (sel) => shadow.querySelector(sel);
    const render = (state.renderToolbar = () => {
      shadow.querySelectorAll(".style").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.style === state.style)));
      q(".auto").setAttribute("aria-pressed", String(state.autoDetect));
    });
    shadow.querySelectorAll(".style").forEach((b) =>
      b.addEventListener("click", () => {
        setStyle(b.dataset.style);
        render();
      })
    );
    q(".auto").addEventListener("click", toggleAutoDetect);
    q(".undo").addEventListener("click", () => undo());
    q(".shot").addEventListener("click", () => state.options.onScreenshot?.());
    q(".done").addEventListener("click", () => stop());
    // Keep page handlers from seeing toolbar clicks.
    host.addEventListener("mousedown", (event) => event.stopPropagation());
    host.addEventListener("click", (event) => event.stopPropagation());
    render();
    document.documentElement.appendChild(host);
    return host;
  }

  function buildOutline() {
    const outline = document.createElement("div");
    outline.id = OUTLINE_ID;
    Object.assign(outline.style, {
      position: "fixed",
      display: "none",
      pointerEvents: "none",
      zIndex: "2147483646",
      border: "2px dashed #f59e0b",
      background: "rgba(245, 158, 11, 0.12)",
      borderRadius: "3px"
    });
    document.documentElement.appendChild(outline);
    return outline;
  }

  function placeOutline(rect) {
    const outline = state.ui?.outline;
    if (!outline) return;
    if (!rect) {
      outline.style.display = "none";
      return;
    }
    Object.assign(outline.style, {
      display: "block",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    });
  }

  function targetAt(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el || isOwnUi(el) || el === document.documentElement || el === document.body) {
      return null;
    }
    return el;
  }

  function dragRect(drag) {
    return {
      left: Math.min(drag.x, drag.x2),
      top: Math.min(drag.y, drag.y2),
      width: Math.abs(drag.x2 - drag.x),
      height: Math.abs(drag.y2 - drag.y)
    };
  }

  const handlers = {
    mousedown(event) {
      if (event.button !== 0 || isOwnUi(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      state.drag = { x: event.clientX, y: event.clientY, x2: event.clientX, y2: event.clientY, moved: false };
    },
    mousemove(event) {
      if (state.drag) {
        state.drag.x2 = event.clientX;
        state.drag.y2 = event.clientY;
        const rect = dragRect(state.drag);
        state.drag.moved = state.drag.moved || rect.width > DRAG_THRESHOLD || rect.height > DRAG_THRESHOLD;
        if (state.drag.moved) placeOutline(rect);
        return;
      }
      state.hover = targetAt(event.clientX, event.clientY);
      placeOutline(state.hover ? state.hover.getBoundingClientRect() : null);
    },
    mouseup(event) {
      if (!state.drag) return;
      event.preventDefault();
      event.stopPropagation();
      const drag = state.drag;
      state.drag = null;
      if (drag.moved) {
        const rect = dragRect(drag);
        addBox(rect.left, rect.top, rect.width, rect.height);
      } else {
        redactElement(targetAt(event.clientX, event.clientY));
      }
      placeOutline(null);
    },
    click(event) {
      // Swallow the click so links and buttons don't fire while redacting.
      if (isOwnUi(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    },
    keydown(event) {
      if (event.key === "Escape" || event.key === "Enter") {
        event.preventDefault();
        stop();
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest?.("input, textarea, [contenteditable]")) {
        return;
      }
      const action = { z: undo, a: toggleAutoDetect, b: toggleStyle, s: () => state.options.onScreenshot?.() }[
        event.key.toLowerCase()
      ];
      if (action) {
        event.preventDefault();
        event.stopPropagation();
        action();
      }
    }
  };

  function start(options = {}) {
    if (state.active) {
      return;
    }
    state.options = options;
    state.active = true;
    applyStyles();
    state.ui = { toolbar: buildToolbar(), outline: buildOutline() };
    for (const [type, fn] of Object.entries(handlers)) {
      document.addEventListener(type, fn, true);
    }
  }

  function stop() {
    if (!state.active) {
      return;
    }
    state.active = false;
    for (const [type, fn] of Object.entries(handlers)) {
      document.removeEventListener(type, fn, true);
    }
    state.ui.toolbar.remove();
    state.renderToolbar = null;
    state.ui.outline.remove();
    state.ui = null;
    state.drag = null;
    state.options.onStop?.(count());
  }

  /** Hide Redact mode's own UI for the duration of `fn` (used for screenshots). */
  async function withUiHidden(fn) {
    const hidden = [state.ui?.toolbar, state.ui?.outline].filter(Boolean);
    hidden.forEach((el) => (el.style.visibility = "hidden"));
    try {
      return await fn();
    } finally {
      hidden.forEach((el) => (el.style.visibility = ""));
    }
  }

  global.QuietViewRedact = {
    start,
    stop,
    undo,
    clearAll,
    count,
    setStyle,
    setAutoDetect,
    redactElement,
    withUiHidden,
    findSensitive,
    isActive: () => state.active
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
