// Focus mode: make one element fill the screen.
//
// Strategy: the element is expanded to fill the tab (works everywhere, no
// flash), then the *page* is put into native fullscreen. Fullscreening the
// page rather than the element keeps QuietView's own controls (exit button,
// toasts) inside the fullscreen layer. If fullscreen is refused, the in-tab
// fill stays as the fallback.
// Everything is reversible: we only add attributes and one stylesheet.
(function initQuietViewFocus(global) {
  const TARGET_ATTR = "data-quietview-focus";
  const PATH_ATTR = "data-quietview-focus-path";
  const SIBLING_ATTR = "data-quietview-focus-sibling";
  const ROOT_ATTR = "data-quietview-focusing";
  const STYLE_ID = "quietview-focus-style";
  const EXIT_HOST_ID = "quietview-focus-exit";
  const NON_RENDERED = new Set(["HEAD", "SCRIPT", "STYLE", "LINK", "META", "TEMPLATE", "NOSCRIPT"]);

  let state = null;

  function isOpaque(color) {
    if (!color || color === "transparent") {
      return false;
    }
    const match = color.match(/rgba?\(([^)]+)\)/);
    if (!match) {
      return true;
    }
    const parts = match[1].split(/[,\s/]+/).filter(Boolean);
    return parts.length < 4 || parseFloat(parts[3]) > 0;
  }

  // Elements are often transparent and rely on a page background; find the
  // colour the user actually sees behind the element.
  function resolveBackground(element) {
    // Media looks best letterboxed in black, like a native video player.
    if (/^(VIDEO|CANVAS|IMG|IFRAME|EMBED|OBJECT)$/.test(element.tagName)) {
      return "#000";
    }
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const color = getComputedStyle(current).backgroundColor;
      if (isOpaque(color)) {
        return color;
      }
      current = current.parentElement;
    }
    return matchMedia("(prefers-color-scheme: dark)").matches ? "#111" : "#fff";
  }

  function buildStyles(background) {
    return `
      html[${ROOT_ATTR}], html[${ROOT_ATTR}] body { overflow: hidden !important; }
      html[${ROOT_ATTR}] #quietview-toggle-btn { display: none !important; }
      [${SIBLING_ATTR}] { display: none !important; }
      [${PATH_ATTR}] {
        transform: none !important; filter: none !important; perspective: none !important;
        contain: none !important; will-change: auto !important; backdrop-filter: none !important;
      }
      [${TARGET_ATTR}] {
        position: fixed !important; inset: 0 !important;
        width: 100vw !important; height: 100vh !important;
        max-width: none !important; max-height: none !important;
        min-width: 0 !important; min-height: 0 !important;
        margin: 0 !important; transform: none !important;
        z-index: 2147483646 !important; overflow: auto !important;
        box-sizing: border-box !important;
        background-color: ${background} !important;
      }
    `;
  }

  function markPath(target) {
    const marked = [];
    let child = target;
    let parent = target.parentElement;
    while (parent) {
      parent.setAttribute(PATH_ATTR, "");
      marked.push(parent);
      for (const sibling of parent.children) {
        if (sibling !== child && !NON_RENDERED.has(sibling.tagName) && sibling.id !== EXIT_HOST_ID) {
          sibling.setAttribute(SIBLING_ATTR, "");
          marked.push(sibling);
        }
      }
      child = parent;
      parent = parent.parentElement;
    }
    return marked;
  }

  // The exit control sits at the root stacking level above the focused
  // element, in a shadow root so page CSS cannot restyle it.
  function createExitControl(onExit, pin) {
    const host = document.createElement("div");
    host.id = EXIT_HOST_ID;
    host.style.cssText =
      "position:fixed;inset:16px 16px auto auto;margin:0;padding:0;border:0;background:transparent;z-index:2147483647;";
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = `
      <style>
        button {
          all: initial; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 14px; border-radius: 999px; background: rgba(17, 24, 39, 0.82);
          color: #fff; font: 500 13px/1.2 system-ui, -apple-system, "Segoe UI", sans-serif;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25); opacity: 1; transition: opacity 0.3s;
        }
        button.idle { opacity: 0.25; }
        button:hover, button:focus-visible { opacity: 1; }
        button:focus-visible { outline: 2px solid #5fd3d3; outline-offset: 2px; }
        kbd { font: inherit; padding: 1px 6px; border-radius: 4px; background: rgba(255, 255, 255, 0.18); }
        .bar { display: flex; gap: 8px; }
        .pin[aria-pressed="true"] { background: rgba(124, 92, 255, 0.92); }
      </style>
      <div class="bar">
        <button class="pin" type="button" hidden></button>
        <button class="exit" type="button" aria-label="Exit focus mode">Exit focus <kbd>Esc</kbd></button>
      </div>
    `;
    const exitButton = shadow.querySelector(".exit");
    exitButton.addEventListener("click", (event) => {
      event.stopPropagation();
      onExit();
    });

    // Optional "remember this" toggle: focus this element on every visit.
    const pinButton = shadow.querySelector(".pin");
    if (pin) {
      let pinned = Boolean(pin.pinned);
      const render = () => {
        pinButton.textContent = pinned ? "✓ Focusing here every visit" : "Focus here every visit";
        pinButton.setAttribute("aria-pressed", String(pinned));
      };
      render();
      pinButton.hidden = false;
      pinButton.addEventListener("click", (event) => {
        event.stopPropagation();
        pinned = !pinned;
        render();
        pin.onToggle(pinned);
      });
    }

    const buttons = shadow.querySelectorAll("button");
    window.setTimeout(() => buttons.forEach((b) => b.classList.add("idle")), 3500);
    document.documentElement.appendChild(host);
    return host;
  }

  function exit() {
    if (!state) {
      return;
    }
    const current = state;
    state = null;

    document.removeEventListener("keydown", current.onKeyDown, true);
    document.removeEventListener("fullscreenchange", current.onFullscreenChange, true);

    if (document.fullscreenElement === document.documentElement) {
      document.exitFullscreen().catch(() => {});
    }
    current.target.removeAttribute(TARGET_ATTR);
    for (const el of current.marked) {
      el.removeAttribute(PATH_ATTR);
      el.removeAttribute(SIBLING_ATTR);
    }
    document.documentElement.removeAttribute(ROOT_ATTR);
    current.style.remove();
    current.exitHost.remove();
    window.scrollTo(current.scrollX, current.scrollY);
    if (current.onExit) {
      current.onExit();
    }
  }

  /**
   * Make `target` fill the screen. Must be called from a user gesture
   * (e.g. the picker click) for native fullscreen to be granted.
   * Options: fullscreen (default true), onExit(), pin { pinned, onToggle }.
   * Returns a promise resolving to "fullscreen" or "tab".
   */
  function enter(target, options = {}) {
    if (!target || !target.isConnected) {
      return Promise.resolve(null);
    }
    exit();

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = buildStyles(resolveBackground(target));
    document.documentElement.appendChild(style);

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    state = {
      target,
      style,
      scrollX,
      scrollY,
      marked: markPath(target),
      exitHost: createExitControl(exit, options.pin),
      onExit: options.onExit,
      onKeyDown: (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          exit();
        }
      },
      onFullscreenChange: () => {
        if (!state) {
          return;
        }
        if (!document.fullscreenElement && state.wasFullscreen) {
          // User left native fullscreen (Esc / F11): leave focus entirely.
          exit();
        }
      }
    };

    document.documentElement.setAttribute(ROOT_ATTR, "");
    target.setAttribute(TARGET_ATTR, "");
    target.scrollTop = 0;
    document.addEventListener("keydown", state.onKeyDown, true);
    document.addEventListener("fullscreenchange", state.onFullscreenChange, true);

    const root = document.documentElement;
    if (options.fullscreen === false || typeof root.requestFullscreen !== "function" || document.fullscreenElement) {
      return Promise.resolve("tab");
    }
    const session = state;
    return root
      .requestFullscreen({ navigationUI: "hide" })
      .then(() => {
        session.wasFullscreen = true;
        return "fullscreen";
      })
      .catch(() => "tab");
  }

  /** Called when the page mutates: end focus if the site removed the element. */
  function checkConnected() {
    if (state && !state.target.isConnected) {
      exit();
      return false;
    }
    return true;
  }

  global.QuietViewFocus = {
    enter,
    exit,
    checkConnected,
    isActive: () => Boolean(state),
    currentTarget: () => (state ? state.target : null)
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
