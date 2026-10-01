// QuietView content script: orchestrates the hide engine (utils/hider.js),
// Focus mode (utils/focus.js), the shared picker, self-repairing rules,
// recipes, and the on-page toggle. Storage lives in background.js.

const FLOATING_BTN_ID = "quietview-toggle-btn";
const LEGACY_MARKERS = {
  ids: ["data-areahider-rule-ids"],
  display: ["data-quietview-orig-display", "data-areahider-orig-display"],
  visibility: ["data-quietview-orig-visibility", "data-areahider-orig-visibility"]
};

let currentRules = [];
let currentOrigin = window.location.origin;
let ruleCounts = {};
let pickerState = null;
let observer = null;
let applyTimer = null;
let isQuietViewEnabled = true;
let floatingButton = null;
let toggleDebounce = null;
let dragState = null;
let buttonPosition = null;
let lastContextTarget = null;
let lastBadgeCount = -1;
let lastUrl = location.href;
let pageLoadedAt = Date.now();
let lastMutationAt = Date.now();
const healAttempted = new Set();
const autoFocus = { rule: null, done: false };

// Earlier versions hid elements with inline styles; restore any left over
// from a previous version of the content script on this page.
function cleanUpLegacyMarkers() {
  const restore = (attrs, property) => {
    for (const attr of attrs) {
      for (const el of document.querySelectorAll(`[${attr}]`)) {
        const original = el.getAttribute(attr);
        if (original) {
          el.style.setProperty(property, original);
        } else {
          el.style.removeProperty(property);
        }
        el.removeAttribute(attr);
      }
    }
  };
  restore(LEGACY_MARKERS.display, "display");
  restore(LEGACY_MARKERS.visibility, "visibility");
  for (const attr of LEGACY_MARKERS.ids) {
    document.querySelectorAll(`[${attr}]`).forEach((el) => el.removeAttribute(attr));
  }
}

const BUTTON_POSITION_KEY_PREFIX = "quietview_button_position_";

function saveButtonPosition(right, bottom) {
  const key = BUTTON_POSITION_KEY_PREFIX + currentOrigin;
  const data = { right, bottom };
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local.set({ [key]: data }).catch(() => {});
  }
}

function loadButtonPosition(callback) {
  const key = BUTTON_POSITION_KEY_PREFIX + currentOrigin;
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local.get([key], (result) => {
      const position = result[key] || { right: 24, bottom: 24 };
      buttonPosition = position;
      if (callback) callback(position);
    });
  } else {
    const position = { right: 24, bottom: 24 };
    buttonPosition = position;
    if (callback) callback(position);
  }
}

// Single toast surface for every page-side message. Optional actions (Undo,
// "Hide all like this") turn it into a one-click follow-up.
function showToast(message, options = {}) {
  const { isError = false, actions = [] } = options;
  document.getElementById("quietview-toast")?.remove();

  const toast = document.createElement("div");
  toast.id = "quietview-toast";
  toast.setAttribute("role", isError ? "alert" : "status");
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "2147483647",
    maxWidth: "min(92vw, 520px)",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "10px 14px",
    borderRadius: "10px",
    font: "13px/1.4 system-ui, -apple-system, sans-serif",
    color: "#fff",
    background: isError ? QUIETVIEW.colors.toastError : QUIETVIEW.colors.toastBg,
    boxShadow: "0 6px 20px rgba(0,0,0,0.25)"
  });

  const text = document.createElement("span");
  text.textContent = message;
  toast.appendChild(text);

  for (const action of actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    Object.assign(button.style, {
      all: "unset",
      cursor: "pointer",
      fontWeight: "600",
      whiteSpace: "nowrap",
      color: QUIETVIEW.colors.accentLight
    });
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toast.remove();
      action.onClick();
    });
    toast.appendChild(button);
  }

  document.documentElement.appendChild(toast);
  window.setTimeout(() => toast.remove(), isError || actions.length ? 7000 : 3000);
}

function toggleQuietView() {
  if (toggleDebounce) {
    return;
  }
  toggleDebounce = true;
  window.setTimeout(() => {
    toggleDebounce = false;
  }, 200);

  isQuietViewEnabled = !isQuietViewEnabled;
  window.QuietViewHider.setPaused(!isQuietViewEnabled);
  showToast(isQuietViewEnabled ? "Hidden again." : "Showing everything QuietView hid on this site.");
  updateFloatingButton();
  updateBadge();
}

function getEyeIcon(isOpen) {
  if (isOpen) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
  </svg>`;
}

function updateFloatingButton() {
  if (!floatingButton) {
    return;
  }

  const iconHtml = getEyeIcon(!isQuietViewEnabled);
  floatingButton.innerHTML = iconHtml;
  floatingButton.setAttribute("aria-label", isQuietViewEnabled ? "Show all hidden elements" : "Hide all elements");
}

function createFloatingButton(initialPosition) {
  if (floatingButton) {
    return floatingButton;
  }

  const position = initialPosition || buttonPosition || { right: 24, bottom: 24 };

  const button = document.createElement("div");
  button.id = FLOATING_BTN_ID;
  button.setAttribute("role", "button");
  button.setAttribute("tabindex", "0");
  button.setAttribute("aria-label", "Show all hidden elements");
  button.setAttribute("data-draggable", "true");

  Object.assign(button.style, {
    position: "fixed",
    right: `${position.right}px`,
    bottom: `${position.bottom}px`,
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: QUIETVIEW.colors.accent,
    cursor: "grab",
    zIndex: "2147483647",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    transition: "transform 0.15s, background-color 0.15s, opacity 0.2s",
    border: "none",
    opacity: "0"
  });

  button.innerHTML = getEyeIcon(false);

  const hoverStyle = document.createElement("style");
  hoverStyle.textContent = `
    #${FLOATING_BTN_ID}:hover {
      transform: scale(1.1);
      background-color: ${QUIETVIEW.colors.accent}dd;
    }
    #${FLOATING_BTN_ID}:focus {
      outline: 2px solid white;
      outline-offset: 2px;
    }
    #${FLOATING_BTN_ID}[data-dragging="true"] {
      cursor: grabbing;
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(hoverStyle);

  const onMouseDown = (event) => {
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    dragState = {
      startX: clientX,
      startY: clientY,
      initialRight: parseInt(button.style.right) || 24,
      initialBottom: parseInt(button.style.bottom) || 24,
      startTime: Date.now(),
      isDragging: false
    };

    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("touchmove", onMouseMove, { passive: false, capture: true });
    document.addEventListener("mouseup", onMouseUp, true);
    document.addEventListener("touchend", onMouseUp, true);
  };

  const onMouseMove = (event) => {
    if (!dragState) return;

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    const deltaX = dragState.startX - clientX;
    const deltaY = dragState.startY - clientY;

    if (!dragState.isDragging) {
      const moved = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (moved > 5) {
        dragState.isDragging = true;
        button.style.cursor = "grabbing";
        button.style.transition = "none";
        button.setAttribute("data-dragging", "true");
      }
    }

    if (dragState.isDragging) {
      event.preventDefault();

      const newRight = dragState.initialRight + deltaX;
      const newBottom = dragState.initialBottom + deltaY;

      const maxRight = window.innerWidth - 48;
      const maxBottom = window.innerHeight - 48;

      button.style.right = `${Math.max(0, Math.min(newRight, maxRight))}px`;
      button.style.bottom = `${Math.max(0, Math.min(newBottom, maxBottom))}px`;
    }
  };

  const onMouseUp = (event) => {
    if (!dragState) return;

    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("touchmove", onMouseMove, true);
    document.removeEventListener("mouseup", onMouseUp, true);
    document.removeEventListener("touchend", onMouseUp, true);

    if (dragState.isDragging) {
      const right = parseInt(button.style.right) || 24;
      const bottom = parseInt(button.style.bottom) || 24;
      saveButtonPosition(right, bottom);
      buttonPosition = { right, bottom };

      button.style.cursor = "grab";
      button.style.transition = "transform 0.15s, background-color 0.15s, opacity 0.2s";
      button.removeAttribute("data-dragging");
    }

    dragState = null;
  };

  const onClick = (event) => {
    if (dragState && dragState.isDragging) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (dragState) {
      const clientX = event.clientX || (event.changedTouches && event.changedTouches[0]?.clientX) || dragState.startX;
      const clientY = event.clientY || (event.changedTouches && event.changedTouches[0]?.clientY) || dragState.startY;
      const deltaX = Math.abs(clientX - dragState.startX);
      const deltaY = Math.abs(clientY - dragState.startY);
      const deltaTime = Date.now() - dragState.startTime;

      if (deltaX > 5 || deltaY > 5 || deltaTime > 200) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }

    event.preventDefault();
    event.stopPropagation();
    toggleQuietView();
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      toggleQuietView();
    }
  };

  button.addEventListener("mousedown", onMouseDown, true);
  button.addEventListener("touchstart", onMouseDown, { passive: true });
  button.addEventListener("click", onClick, true);
  button.addEventListener("keydown", onKeyDown, true);

  document.documentElement.appendChild(button);
  floatingButton = button;

  window.setTimeout(() => {
    button.style.opacity = "1";
  }, 10);

  return button;
}

function showFloatingButtonIfNeeded() {
  const hasRules = currentRules.length > 0;
  const isMainFrame = window === window.top;

  if (!hasRules || !isMainFrame) {
    if (floatingButton) {
      floatingButton.style.opacity = "0";
      window.setTimeout(() => {
        if (floatingButton && !hasRules) {
          floatingButton.remove();
          floatingButton = null;
        }
      }, 200);
    }
    return;
  }

  loadButtonPosition((position) => {
    createFloatingButton(position);
    updateFloatingButton();
  });
}


// ---------------------------------------------------------------------------
// Storage (through background.js)
// ---------------------------------------------------------------------------

async function ask(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response || !response.ok) {
    throw new Error(response?.error || "Something went wrong.");
  }
  return response;
}

const saveRule = async (rule) => (await ask({ type: "UPSERT_RULE", rule })).rules || [];
const deleteRule = async (origin, id) => (await ask({ type: "DELETE_RULE", origin, id })).rules || [];
const toggleRule = async (origin, id, enabled) =>
  (await ask({ type: "TOGGLE_RULE", origin, id, enabled })).rules || [];

async function loadFocusRule() {
  try {
    const data = await chrome.storage.local.get(QUIETVIEW.focusKey);
    return (data[QUIETVIEW.focusKey] || {})[currentOrigin] || null;
  } catch (_err) {
    return null;
  }
}

async function saveFocusRule(rule) {
  const data = await chrome.storage.local.get(QUIETVIEW.focusKey);
  const map = data[QUIETVIEW.focusKey] || {};
  if (rule) {
    map[currentOrigin] = rule;
  } else {
    delete map[currentOrigin];
  }
  await chrome.storage.local.set({ [QUIETVIEW.focusKey]: map });
  autoFocus.rule = rule;
}

// Local-only usage counters; used solely to time the one-off rating prompt.
async function bumpStat(key) {
  try {
    const data = await chrome.storage.local.get(QUIETVIEW.statsKey);
    const stats = data[QUIETVIEW.statsKey] || {};
    stats[key] = (stats[key] || 0) + 1;
    await chrome.storage.local.set({ [QUIETVIEW.statsKey]: stats });
  } catch (_err) {
    // Counters are best-effort.
  }
}

async function getHideModePreference() {
  try {
    const data = await chrome.storage.local.get(QUIETVIEW.prefsKey);
    const mode = data[QUIETVIEW.prefsKey]?.hideMode;
    return mode === "visibilityHidden" || mode === "blur" ? mode : "displayNone";
  } catch (_err) {
    return "displayNone";
  }
}

// ---------------------------------------------------------------------------
// Applying rules, self-repair, badge, auto-focus
// ---------------------------------------------------------------------------

const HEAL_SETTLE_MS = 2500;
const HEAL_QUIET_MS = 800;
const AUTO_FOCUS_TIMEOUT_MS = 15000;

function applyAllRules() {
  ruleCounts = window.QuietViewHider.applyRules(currentRules);
  updateBadge();
  maybeAutoFocus();
  maybeHealRules();
}

// A rule that stops matching usually means the site changed its markup.
// Once the page has settled, look for the same element by its fingerprint
// and quietly repoint the rule. Only clear, unambiguous matches are used.
let healTimer = null;

// `force` skips the settle wait: used when the popup opens, by which point
// the page is effectively settled and the user wants an accurate answer.
async function maybeHealRules({ force = false } = {}) {
  const now = Date.now();
  const waitFor = Math.max(HEAL_SETTLE_MS - (now - pageLoadedAt), HEAL_QUIET_MS - (now - lastMutationAt));
  if (waitFor > 0 && !force) {
    // Not settled yet: come back once the page has been quiet long enough.
    const needsHealing = currentRules.some((rule) => rule.enabled && rule.fingerprint && !ruleCounts[rule.id]);
    if (needsHealing) {
      window.clearTimeout(healTimer);
      healTimer = window.setTimeout(scheduleApplyAll, waitFor + 20);
    }
    return;
  }
  for (const rule of currentRules) {
    const key = `${rule.id}|${location.pathname}`;
    if (!rule.enabled || !rule.fingerprint || ruleCounts[rule.id] || healAttempted.has(key)) {
      continue;
    }
    healAttempted.add(key);
    const found = window.QuietViewSelector.findByFingerprint(rule.fingerprint);
    if (!found || found.closest("[data-quietview-hide]")) {
      continue;
    }
    const resolved = window.QuietViewSelector.resolveUniqueSelector(found, document.documentElement);
    if (!resolved.selector || resolved.matchCount !== 1 || resolved.selector === rule.selector) {
      continue;
    }
    try {
      currentRules = await saveRule({
        ...rule,
        selector: resolved.selector,
        fingerprint: window.QuietViewSelector.fingerprint(found),
        healedAt: Date.now()
      });
      ruleCounts = window.QuietViewHider.applyRules(currentRules);
      updateBadge();
    } catch (_err) {
      // Try again on the next page load.
    }
  }
}

function updateBadge() {
  const count = isQuietViewEnabled ? window.QuietViewHider.hiddenCount() : 0;
  if (count === lastBadgeCount || window !== window.top) {
    return;
  }
  lastBadgeCount = count;
  chrome.runtime.sendMessage({ type: "SET_BADGE", count }).catch(() => {});
}

function findFocusTarget(rule) {
  try {
    const bySelector = document.querySelector(rule.selector);
    if (bySelector) {
      return bySelector;
    }
  } catch (_err) {
    // Fall through to the fingerprint.
  }
  return window.QuietViewSelector.findByFingerprint(rule.fingerprint);
}

// "Focus here every visit": wait for the element to appear, then fill the
// tab with it (native fullscreen needs a click, so this uses the in-tab mode).
function maybeAutoFocus() {
  if (!autoFocus.rule || autoFocus.done || window !== window.top) {
    return;
  }
  if (Date.now() - pageLoadedAt > AUTO_FOCUS_TIMEOUT_MS) {
    autoFocus.done = true;
    return;
  }
  if (window.QuietViewFocus.isActive() || pickerState) {
    return;
  }
  const target = findFocusTarget(autoFocus.rule);
  if (!target || target.getBoundingClientRect().height === 0) {
    return;
  }
  autoFocus.done = true;
  enterFocus(target, { fullscreen: false });
}

function scheduleApplyAll() {
  window.clearTimeout(applyTimer);
  applyTimer = window.setTimeout(applyAllRules, 120);
}

function onUrlChange() {
  lastUrl = location.href;
  pageLoadedAt = Date.now();
  autoFocus.done = false;
}

function ensureObserver() {
  if (observer) {
    return;
  }
  observer = new MutationObserver(() => {
    lastMutationAt = Date.now();
    if (location.href !== lastUrl) {
      onUrlChange();
    }
    if (window.QuietViewFocus.isActive() && !window.QuietViewFocus.checkConnected()) {
      showToast("The page replaced that element, so focus ended.");
    }
    scheduleApplyAll();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  // Settling checks (heal, auto-focus) also need a tick on quiet pages.
  window.setTimeout(scheduleApplyAll, HEAL_SETTLE_MS + 50);
}

async function refreshRules() {
  currentRules = (await ask({ type: "GET_RULES", origin: currentOrigin })).rules || [];
  autoFocus.rule = await loadFocusRule();
  applyAllRules();
  showFloatingButtonIfNeeded();
}

// ---------------------------------------------------------------------------
// Picker: one overlay for both intents.
//   intent "hide"  -> saves a per-site rule
//   intent "focus" -> makes the element fill the screen (not saved)
// Mouse picks the element under the pointer; ↑ / ↓ grow or shrink the
// selection to the parent / back to the child, so users can grab a whole
// panel without needing to aim at its edge.
// ---------------------------------------------------------------------------

const PICKER_COPY = {
  hide: { verb: "hide", color: () => QUIETVIEW.colors.pickerOutline },
  focus: { verb: "focus", color: () => QUIETVIEW.colors.focusOutline }
};

function isQuietViewUi(el) {
  return Boolean(
    el &&
      el.closest &&
      el.closest(
        "#quietview-toast, #quietview-picker-hint, #quietview-picker-outline, #quietview-redact-toolbar, #" + FLOATING_BTN_ID
      )
  );
}

function pickElementAtPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el || isQuietViewUi(el) || el === document.documentElement || el === document.body) {
    return null;
  }
  return el;
}

const FOCUS_MEDIA = /^(VIDEO|IFRAME|CANVAS|EMBED|OBJECT)$/;
const FOCUS_MIN_VIEWPORT_SHARE = 0.15;

// Focusing a play button or a single line of text is never the intent: climb
// to the nearest media element or container big enough to be worth a full
// screen. Returns the skipped chain so ↓ can step back down.
function suggestFocusTarget(pointed) {
  const viewportArea = window.innerWidth * window.innerHeight;
  const skipped = [];
  let current = pointed;
  while (current && current !== document.body && current !== document.documentElement) {
    const rect = current.getBoundingClientRect();
    if (FOCUS_MEDIA.test(current.tagName) || (rect.width * rect.height) / viewportArea >= FOCUS_MIN_VIEWPORT_SHARE) {
      return { target: current, skipped };
    }
    skipped.push(current);
    current = current.parentElement;
  }
  return { target: pointed, skipped: [] };
}

function describeTarget(el) {
  const rect = el.getBoundingClientRect();
  const label = window.QuietViewSelector.describeElement(el);
  return `${label} · ${Math.round(rect.width)}×${Math.round(rect.height)}`;
}

function renderPickerTarget() {
  if (!pickerState) {
    return;
  }
  const { target, outlineEl, labelEl } = pickerState;
  if (!target) {
    outlineEl.style.display = "none";
    return;
  }
  const rect = target.getBoundingClientRect();
  Object.assign(outlineEl.style, {
    display: "block",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  });
  labelEl.textContent = describeTarget(target);
}

function createPickerChrome(intent) {
  const color = PICKER_COPY[intent].color();
  const verb = PICKER_COPY[intent].verb;

  const outlineEl = document.createElement("div");
  outlineEl.id = "quietview-picker-outline";
  Object.assign(outlineEl.style, {
    position: "fixed",
    display: "none",
    border: `2px solid ${color}`,
    background: `${color}1f`,
    borderRadius: "4px",
    pointerEvents: "none",
    zIndex: "2147483647",
    transition: "left 60ms, top 60ms, width 60ms, height 60ms"
  });

  const hintEl = document.createElement("div");
  hintEl.id = "quietview-picker-hint";
  hintEl.setAttribute("role", "status");
  Object.assign(hintEl.style, {
    position: "fixed",
    top: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "2147483647",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    maxWidth: "min(92vw, 560px)",
    padding: "8px 14px",
    borderRadius: "10px",
    background: "rgba(17, 24, 39, 0.9)",
    color: "#fff",
    font: "13px/1.4 system-ui, -apple-system, sans-serif",
    boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
    pointerEvents: "none",
    textAlign: "center"
  });
  const instructions = document.createElement("div");
  instructions.textContent = `Click to ${verb} · ↑ bigger · ↓ smaller · Enter to confirm · Esc to cancel`;
  const labelEl = document.createElement("div");
  Object.assign(labelEl.style, { color: color, fontWeight: "600", fontSize: "12px" });
  labelEl.textContent = `Point at what you want to ${verb}`;
  hintEl.append(instructions, labelEl);

  document.documentElement.append(outlineEl, hintEl);
  return { outlineEl, hintEl, labelEl };
}

function stopPicker() {
  if (!pickerState) {
    return;
  }
  document.removeEventListener("mousemove", pickerState.onMouseMove, true);
  document.removeEventListener("click", pickerState.onClick, true);
  document.removeEventListener("keydown", pickerState.onKeyDown, true);
  window.removeEventListener("scroll", pickerState.onScroll, true);
  pickerState.outlineEl.remove();
  pickerState.hintEl.remove();
  pickerState = null;
}

function commitPicker() {
  if (!pickerState || !pickerState.target) {
    return;
  }
  const { target, intent, replaceRuleId } = pickerState;
  stopPicker();
  if (intent === "focus") {
    commitFocus(target);
    return;
  }
  commitHide(target, { replaceRuleId }).catch((error) => {
    showToast(error.message || "Could not save that rule.", { isError: true });
  });
}

function startPicker(intent = "hide", options = {}) {
  stopPicker();
  if (intent === "focus" && window.QuietViewFocus.isActive()) {
    window.QuietViewFocus.exit();
  }

  const pickerUi = createPickerChrome(intent);

  const setTarget = (el, { fromPointer = false } = {}) => {
    if (!pickerState || !el) {
      return;
    }
    if (fromPointer) {
      // Ignore pointer jitter inside a selection the user grew with ↑.
      if (pickerState.pointed === el) {
        return;
      }
      pickerState.pointed = el;
      pickerState.history = [];
      if (pickerState.intent === "focus") {
        const suggestion = suggestFocusTarget(el);
        pickerState.history = suggestion.skipped;
        el = suggestion.target;
      }
    }
    pickerState.target = el;
    renderPickerTarget();
  };

  const onMouseMove = (event) => {
    setTarget(pickElementAtPoint(event.clientX, event.clientY), { fromPointer: true });
  };

  const onClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (!pickerState.target) {
      setTarget(pickElementAtPoint(event.clientX, event.clientY), { fromPointer: true });
    }
    commitPicker();
  };

  const onKeyDown = (event) => {
    if (!pickerState) {
      return;
    }
    const { target } = pickerState;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      stopPicker();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      commitPicker();
      return;
    }
    if (event.key === "ArrowUp" && target) {
      event.preventDefault();
      event.stopPropagation();
      const parent = target.parentElement;
      if (parent && parent !== document.body && parent !== document.documentElement) {
        pickerState.history.push(target);
        setTarget(parent);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      const previous = pickerState.history.pop();
      if (previous) {
        setTarget(previous);
      } else if (target && target.firstElementChild) {
        setTarget(target.firstElementChild);
      }
    }
  };

  const onScroll = () => renderPickerTarget();

  pickerState = {
    intent: intent === "focus" ? "focus" : "hide",
    replaceRuleId: options.replaceRuleId || null,
    target: null,
    pointed: null,
    history: [],
    onMouseMove,
    onClick,
    onKeyDown,
    onScroll,
    ...pickerUi
  };

  document.addEventListener("mousemove", onMouseMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("scroll", onScroll, true);
}


// ---------------------------------------------------------------------------
// Committing a pick
// ---------------------------------------------------------------------------

async function undoRule(ruleId) {
  currentRules = await deleteRule(currentOrigin, ruleId);
  applyAllRules();
  showFloatingButtonIfNeeded();
}

/**
 * Hide `target` with a new rule, or repoint an existing rule when the user
 * is re-picking an element that a site redesign moved.
 */
async function commitHide(target, { replaceRuleId = null } = {}) {
  const Selector = window.QuietViewSelector;
  const resolved = Selector.resolveUniqueSelector(target, document.documentElement);
  if (!resolved.selector || resolved.matchCount !== 1) {
    showToast("Couldn't target that element. Try ↑ to select its container.", { isError: true });
    return;
  }
  const label = Selector.describeElement(target);
  const existing = replaceRuleId && currentRules.find((rule) => rule.id === replaceRuleId);

  const rules = await saveRule({
    ...(existing || {}),
    origin: currentOrigin,
    selector: resolved.selector,
    label: existing?.label || label,
    fingerprint: Selector.fingerprint(target),
    sourceType: existing?.sourceType || "picker",
    enabled: true,
    hideMode: existing?.hideMode || (await getHideModePreference())
  });
  currentRules = rules;
  applyAllRules();
  showFloatingButtonIfNeeded();

  if (existing) {
    showToast("Fixed. That rule works again.");
    return;
  }

  const created = rules[rules.length - 1];
  bumpStat("hides");
  const actions = [{ label: "Undo", onClick: () => undoRule(created.id) }];

  // Offer to widen the rule to every element of the same kind (e.g. every
  // Shorts shelf in a feed), checked against the live page so the count is real.
  const similar = Selector.buildSimilarSelector(target);
  if (similar) {
    actions.unshift({
      label: `Hide all ${similar.count} like this`,
      onClick: async () => {
        currentRules = await saveRule({
          ...created,
          selector: similar.selector,
          label: `${label} (all ${similar.count})`,
          fingerprint: null
        });
        applyAllRules();
        showToast(`Hid ${similar.count} similar elements.`, {
          actions: [{ label: "Undo", onClick: () => undoRule(created.id) }]
        });
      }
    });
  }
  showToast("Hidden. It stays hidden on this site.", { actions });
}

function enterFocus(target, options = {}) {
  const Selector = window.QuietViewSelector;
  const pinnedSelector = autoFocus.rule?.selector;
  const isPinned = Boolean(pinnedSelector && (() => {
    try {
      return target.matches(pinnedSelector);
    } catch (_err) {
      return false;
    }
  })());

  return window.QuietViewFocus.enter(target, {
    fullscreen: options.fullscreen,
    pin: {
      pinned: isPinned,
      onToggle: (pinned) => {
        const resolved = Selector.resolveUniqueSelector(target, document.documentElement);
        const rule = pinned && resolved.selector
          ? { selector: resolved.selector, label: Selector.describeElement(target), fingerprint: Selector.fingerprint(target) }
          : null;
        saveFocusRule(rule).catch(() => {});
      }
    }
  });
}

function commitFocus(target, { fromGesture = true } = {}) {
  // Called synchronously inside the click/keydown handler so the browser
  // treats it as a user gesture and allows native fullscreen.
  bumpStat("focuses");
  enterFocus(target, { fullscreen: fromGesture }).then((mode) => {
    if (mode === "tab") {
      showToast("Focused. Press Esc to exit.");
    }
  });
}


// ---------------------------------------------------------------------------
// Redact mode and screenshots
// ---------------------------------------------------------------------------

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

async function copyImageToClipboard(dataUrl) {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    return true;
  } catch (_err) {
    return false;
  }
}

// Capture exactly what a viewer would see: redactions on, QuietView's own
// UI (toolbar, toasts, floating button) off.
async function takeScreenshot() {
  const transient = [document.getElementById("quietview-toast"), floatingButton].filter(Boolean);
  let result;
  await window.QuietViewRedact.withUiHidden(async () => {
    transient.forEach((el) => (el.style.visibility = "hidden"));
    await nextFrame();
    await nextFrame();
    try {
      result = await ask({ type: "CAPTURE_TAB", host: location.hostname });
    } finally {
      transient.forEach((el) => (el.style.visibility = ""));
    }
  });
  const copied = await copyImageToClipboard(result.dataUrl);
  bumpStat("screenshots");
  showToast(copied ? "Screenshot saved to Downloads and copied." : "Screenshot saved to Downloads.");
}

function startRedact(initialTarget = null) {
  if (pickerState) {
    stopPicker();
  }
  window.QuietViewRedact.start({
    notify: (message) => showToast(message),
    onScreenshot: () =>
      takeScreenshot().catch((error) => showToast(error.message || "Couldn't take a screenshot.", { isError: true })),
    onStop: (count) => {
      if (count) {
        showToast(`${count} item${count === 1 ? "" : "s"} redacted until you reload.`, {
          actions: [
            { label: "Screenshot", onClick: () => takeScreenshot().catch(() => {}) },
            { label: "Clear", onClick: () => window.QuietViewRedact.clearAll() }
          ]
        });
      }
    }
  });
  if (initialTarget) {
    window.QuietViewRedact.redactElement(initialTarget);
  }
  bumpStat("redacts");
}

// ---------------------------------------------------------------------------
// Pasted selector / snippet rules (More options)
// ---------------------------------------------------------------------------

function findBestSelectorFromSnippet(snippet) {
  const doc = new DOMParser().parseFromString(snippet, "text/html");
  const element = doc.body.firstElementChild;
  if (!element) {
    return { selector: "", matchCount: 0, ambiguous: true };
  }
  return window.QuietViewSelector.resolveUniqueSelector(element, document.documentElement);
}

function isValidSelector(selector) {
  try {
    document.querySelector(selector);
    return true;
  } catch (_err) {
    return false;
  }
}

async function createRuleForElement(selector, sourceType) {
  const element = document.querySelector(selector);
  currentRules = await saveRule({
    origin: currentOrigin,
    selector,
    label: window.QuietViewSelector.describeElement(element),
    fingerprint: window.QuietViewSelector.fingerprint(element),
    sourceType,
    enabled: true,
    hideMode: await getHideModePreference()
  });
  applyAllRules();
  showFloatingButtonIfNeeded();
}

// ---------------------------------------------------------------------------
// Messages from the popup and background
// ---------------------------------------------------------------------------

const handlers = {
  async GET_RULES_FOR_PAGE() {
    await refreshRules();
    return { origin: currentOrigin, rules: currentRules };
  },

  async GET_PAGE_STATE() {
    ruleCounts = window.QuietViewHider.applyRules(currentRules);
    await maybeHealRules({ force: true });
    return {
      counts: ruleCounts,
      paused: !isQuietViewEnabled,
      focusRule: autoFocus.rule,
      redactions: window.QuietViewRedact.count()
    };
  },

  START_REDACT() {
    startRedact();
    return {};
  },

  async SCREENSHOT() {
    await takeScreenshot();
    return {};
  },

  CLEAR_REDACTIONS() {
    window.QuietViewRedact.clearAll();
    return {};
  },

  START_PICKER(message) {
    startPicker(message.intent === "focus" ? "focus" : "hide", { replaceRuleId: message.replaceRuleId });
    return {};
  },

  CANCEL_PICKER() {
    stopPicker();
    return {};
  },

  EXIT_FOCUS() {
    window.QuietViewFocus.exit();
    return {};
  },

  async CONTEXT_ACTION(message) {
    const target = lastContextTarget;
    if (!target || !target.isConnected) {
      throw new Error("Right-click the element again, then choose the action.");
    }
    if (message.intent === "focus") {
      commitFocus(target, { fromGesture: false });
    } else if (message.intent === "redact") {
      startRedact(target);
    } else {
      await commitHide(target);
    }
    return {};
  },

  async CLEAR_FOCUS_RULE() {
    await saveFocusRule(null);
    return {};
  },

  async SET_RECIPE(message) {
    const recipe = window.QuietViewRecipes.recipesForHost(location.hostname);
    const item = recipe?.items.find((entry) => entry.id === message.recipeId);
    if (!item) {
      throw new Error("That cleanup isn't available for this site.");
    }
    const existing = currentRules.find((rule) => rule.recipeId === item.id);
    if (message.enabled && !existing) {
      currentRules = await saveRule({
        origin: currentOrigin,
        selector: item.selector,
        label: item.label,
        sourceType: "recipe",
        recipeId: item.id,
        enabled: true,
        hideMode: item.hideMode || "displayNone"
      });
    } else if (!message.enabled && existing) {
      currentRules = await deleteRule(currentOrigin, existing.id);
    }
    applyAllRules();
    showFloatingButtonIfNeeded();
    return { rules: currentRules, matched: existing ? 0 : ruleCounts[currentRules.at(-1)?.id] || 0 };
  },

  async CREATE_RULE_FROM_SELECTOR(message) {
    const selector = (message.selector || "").trim();
    if (!selector || !isValidSelector(selector)) {
      throw new Error("That isn't a valid CSS selector.");
    }
    const count = document.querySelectorAll(selector).length;
    if (count === 0) {
      throw new Error("Nothing on this page matches that selector.");
    }
    if (count > 1) {
      throw new Error(`That selector matches ${count} elements. Make it more specific so only one matches.`);
    }
    await createRuleForElement(selector, message.sourceType || "selector");
    return { rules: currentRules, matched: count };
  },

  async CREATE_RULE_FROM_SNIPPET(message) {
    const snippet = (message.snippet || "").trim();
    if (!snippet) {
      throw new Error("Paste an HTML snippet first.");
    }
    const resolved = findBestSelectorFromSnippet(snippet);
    if (!resolved.selector) {
      throw new Error("Couldn't find that element on this page.");
    }
    if (resolved.ambiguous || resolved.matchCount !== 1) {
      throw new Error(
        `That snippet matches ${resolved.matchCount} elements on this page. Paste a more specific element, or use “Hide an element” and click it instead.`
      );
    }
    await createRuleForElement(resolved.selector, "snippet");
    return { rules: currentRules, selector: resolved.selector, matched: 1 };
  },

  async TOGGLE_RULE(message) {
    currentRules = await toggleRule(currentOrigin, message.id, message.enabled);
    applyAllRules();
    showFloatingButtonIfNeeded();
    return { rules: currentRules };
  },

  async DELETE_RULE(message) {
    currentRules = await deleteRule(currentOrigin, message.id);
    applyAllRules();
    showFloatingButtonIfNeeded();
    return { rules: currentRules };
  },

  TOGGLE_QUIETVIEW() {
    toggleQuietView();
    return { enabled: isQuietViewEnabled };
  }
};

// On the welcome page this script runs as an extension page, where it would
// also receive messages meant for background.js. Only listen on real sites.
const isExtensionPage = /^(chrome|moz)-extension:$/.test(location.protocol);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (isExtensionPage) {
    return false;
  }
  const handler = message && handlers[message.type];
  if (!handler) {
    sendResponse({ ok: false, error: `Unknown message type: ${message?.type}` });
    return false;
  }
  Promise.resolve()
    .then(() => handler(message))
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => sendResponse({ ok: false, error: error.message || "Unexpected error." }));
  return true;
});

// Remember what was right-clicked so the context menu can act on it.
document.addEventListener(
  "contextmenu",
  (event) => {
    lastContextTarget = event.target instanceof Element ? event.target : null;
  },
  true
);

cleanUpLegacyMarkers();
refreshRules().catch(() => {});
ensureObserver();
