const MARKER_ATTR = "data-quietview-rule-ids";
const ORIG_DISPLAY_ATTR = "data-quietview-orig-display";
const ORIG_VISIBILITY_ATTR = "data-quietview-orig-visibility";

const LEGACY_MARKER_ATTR = "data-areahider-rule-ids";
const LEGACY_ORIG_DISPLAY_ATTR = "data-areahider-orig-display";
const LEGACY_ORIG_VISIBILITY_ATTR = "data-areahider-orig-visibility";

const FLOATING_BTN_ID = "quietview-toggle-btn";

let currentRules = [];
let currentOrigin = window.location.origin;
let pickerState = null;
let observer = null;
let applyTimer = null;
let isQuietViewEnabled = true;
let floatingButton = null;
let toggleDebounce = null;
let dragState = null;
let buttonPosition = null;

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

function updateButtonPosition(right, bottom) {
  if (!floatingButton) return;
  const maxRight = window.innerWidth - 48;
  const maxBottom = window.innerHeight - 48;
  const clampedRight = Math.max(0, Math.min(right, maxRight));
  const clampedBottom = Math.max(0, Math.min(bottom, maxBottom));
  floatingButton.style.right = `${clampedRight}px`;
  floatingButton.style.bottom = `${clampedBottom}px`;
}

function migrateLegacyDomMarkers() {
  const marked = document.querySelectorAll(`[${LEGACY_MARKER_ATTR}]`);
  for (const el of marked) {
    if (!el.hasAttribute(MARKER_ATTR)) {
      el.setAttribute(MARKER_ATTR, el.getAttribute(LEGACY_MARKER_ATTR) || "");
    }
    el.removeAttribute(LEGACY_MARKER_ATTR);

    if (el.hasAttribute(LEGACY_ORIG_DISPLAY_ATTR) && !el.hasAttribute(ORIG_DISPLAY_ATTR)) {
      el.setAttribute(ORIG_DISPLAY_ATTR, el.getAttribute(LEGACY_ORIG_DISPLAY_ATTR) || "");
    }
    el.removeAttribute(LEGACY_ORIG_DISPLAY_ATTR);

    if (el.hasAttribute(LEGACY_ORIG_VISIBILITY_ATTR) && !el.hasAttribute(ORIG_VISIBILITY_ATTR)) {
      el.setAttribute(ORIG_VISIBILITY_ATTR, el.getAttribute(LEGACY_ORIG_VISIBILITY_ATTR) || "");
    }
    el.removeAttribute(LEGACY_ORIG_VISIBILITY_ATTR);
  }
}

function parseRuleIds(el) {
  const raw = el.getAttribute(MARKER_ATTR);
  if (!raw) {
    return [];
  }
  return raw.split(",").map((id) => id.trim()).filter(Boolean);
}

function setRuleIds(el, ids) {
  if (!ids.length) {
    el.removeAttribute(MARKER_ATTR);
    return;
  }
  el.setAttribute(MARKER_ATTR, ids.join(","));
}

function hideElementForRule(el, rule) {
  const ids = parseRuleIds(el);
  if (!ids.includes(rule.id)) {
    ids.push(rule.id);
  }

  if (rule.hideMode === "visibilityHidden") {
    if (!el.hasAttribute(ORIG_VISIBILITY_ATTR)) {
      el.setAttribute(ORIG_VISIBILITY_ATTR, el.style.visibility || "");
    }
    el.style.setProperty("visibility", "hidden", "important");
  } else {
    if (!el.hasAttribute(ORIG_DISPLAY_ATTR)) {
      el.setAttribute(ORIG_DISPLAY_ATTR, el.style.display || "");
    }
    el.style.setProperty("display", "none", "important");
  }
  setRuleIds(el, ids);
}

function unhideElementForRule(el, ruleId) {
  const ids = parseRuleIds(el).filter((id) => id !== ruleId);
  if (ids.length) {
    setRuleIds(el, ids);
    return;
  }

  setRuleIds(el, []);
  const originalVisibility = el.getAttribute(ORIG_VISIBILITY_ATTR);
  el.removeAttribute(ORIG_VISIBILITY_ATTR);
  if (originalVisibility) {
    el.style.visibility = originalVisibility;
  } else {
    el.style.removeProperty("visibility");
  }

  const original = el.getAttribute(ORIG_DISPLAY_ATTR);
  el.removeAttribute(ORIG_DISPLAY_ATTR);
  if (original) {
    el.style.display = original;
  } else {
    el.style.removeProperty("display");
  }
}

function removeRuleFromDom(ruleId) {
  const marked = document.querySelectorAll(`[${MARKER_ATTR}]`);
  for (const el of marked) {
    unhideElementForRule(el, ruleId);
  }
}

function applyRule(rule) {
  let nodes = [];
  try {
    nodes = Array.from(document.querySelectorAll(rule.selector));
  } catch (_err) {
    return { matched: 0 };
  }

  for (const node of nodes) {
    hideElementForRule(node, rule);
  }
  return { matched: nodes.length };
}

function applyAllRules(force = false) {
  if (!force && !isQuietViewEnabled) {
    return;
  }
  const enabledRules = currentRules.filter((rule) => rule.enabled);
  for (const rule of enabledRules) {
    applyRule(rule);
  }
}

function showAll() {
  const marked = document.querySelectorAll(`[${MARKER_ATTR}]`);
  for (const el of marked) {
    const originalVisibility = el.getAttribute(ORIG_VISIBILITY_ATTR);
    if (originalVisibility) {
      el.style.visibility = originalVisibility;
    } else {
      el.style.removeProperty("visibility");
    }

    const originalDisplay = el.getAttribute(ORIG_DISPLAY_ATTR);
    if (originalDisplay) {
      el.style.display = originalDisplay;
    } else {
      el.style.removeProperty("display");
    }
  }
}

function hideAll() {
  applyAllRules(true);
}

// Single toast surface for every page-side message. An optional action
// (e.g. Undo) turns it into a one-click recovery path.
function showToast(message, options = {}) {
  const { isError = false, action = null } = options;
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
    maxWidth: "min(90vw, 440px)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
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

  if (action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    Object.assign(button.style, {
      all: "unset",
      cursor: "pointer",
      fontWeight: "600",
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
  window.setTimeout(() => toast.remove(), isError || action ? 6000 : 3000);
}

function toggleQuietView() {
  if (toggleDebounce) {
    return;
  }

  toggleDebounce = true;
  window.setTimeout(() => {
    toggleDebounce = false;
  }, 200);

  if (isQuietViewEnabled) {
    showAll();
    isQuietViewEnabled = false;
    showToast("Showing everything QuietView hid on this site.");
  } else {
    hideAll();
    isQuietViewEnabled = true;
    showToast("Hidden again.");
  }

  updateFloatingButton();
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

function scheduleApplyAll() {
  window.clearTimeout(applyTimer);
  applyTimer = window.setTimeout(applyAllRules, 120);
}

function ensureObserver() {
  if (observer) {
    return;
  }
  observer = new MutationObserver(() => {
    if (window.QuietViewFocus.isActive() && !window.QuietViewFocus.checkConnected()) {
      showToast("The page replaced that element, so focus ended.");
    }
    scheduleApplyAll();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

async function getRulesForOrigin(origin) {
  const response = await chrome.runtime.sendMessage({ type: "GET_RULES", origin });
  if (!response || !response.ok) {
    throw new Error(response?.error || "Failed to load rules.");
  }
  return response.rules || [];
}

async function saveRule(rule) {
  const response = await chrome.runtime.sendMessage({ type: "UPSERT_RULE", rule });
  if (!response || !response.ok) {
    throw new Error(response?.error || "Failed to save rule.");
  }
  return response.rules || [];
}

async function deleteRule(origin, id) {
  const response = await chrome.runtime.sendMessage({ type: "DELETE_RULE", origin, id });
  if (!response || !response.ok) {
    throw new Error(response?.error || "Failed to delete rule.");
  }
  return response.rules || [];
}

async function toggleRule(origin, id, enabled) {
  const response = await chrome.runtime.sendMessage({ type: "TOGGLE_RULE", origin, id, enabled });
  if (!response || !response.ok) {
    throw new Error(response?.error || "Failed to toggle rule.");
  }
  return response.rules || [];
}

async function refreshRules() {
  currentRules = await getRulesForOrigin(currentOrigin);
  applyAllRules();
  showFloatingButtonIfNeeded();
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
    return data[QUIETVIEW.prefsKey]?.hideMode === "visibilityHidden" ? "visibilityHidden" : "displayNone";
  } catch (_err) {
    return "displayNone";
  }
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
      el.closest("#quietview-toast, #quietview-picker-hint, #quietview-picker-outline, #" + FLOATING_BTN_ID)
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

async function commitHide(target) {
  const resolved = window.QuietViewSelector.resolveUniqueSelector(target, document.documentElement);
  if (!resolved.selector || resolved.matchCount !== 1) {
    showToast("Couldn't target that element. Try ↑ to select its container.", { isError: true });
    return;
  }
  const rules = await saveRule({
    origin: currentOrigin,
    selector: resolved.selector,
    label: window.QuietViewSelector.describeElement(target),
    sourceType: "picker",
    enabled: true,
    hideMode: await getHideModePreference()
  });
  const created = rules[rules.length - 1];
  currentRules = rules;
  applyAllRules(true);
  showFloatingButtonIfNeeded();
  bumpStat("hides");
  showToast("Hidden. It stays hidden on this site.", {
    action: {
      label: "Undo",
      onClick: async () => {
        removeRuleFromDom(created.id);
        currentRules = await deleteRule(currentOrigin, created.id);
        showFloatingButtonIfNeeded();
      }
    }
  });
}

function commitFocus(target) {
  // Called synchronously inside the click/keydown handler so the browser
  // treats it as a user gesture and allows native fullscreen.
  bumpStat("focuses");
  window.QuietViewFocus.enter(target).then((mode) => {
    if (mode === "tab") {
      showToast("Focused. Press Esc to exit.");
    }
  });
}

function commitPicker() {
  if (!pickerState || !pickerState.target) {
    return;
  }
  const { target, intent } = pickerState;
  stopPicker();
  if (intent === "focus") {
    commitFocus(target);
    return;
  }
  commitHide(target).catch((error) => {
    showToast(error.message || "Could not save that rule.", { isError: true });
  });
}

function startPicker(intent = "hide") {
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

function findBestSelectorFromSnippet(snippet) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(snippet, "text/html");
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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (!message || !message.type) {
      sendResponse({ ok: false, error: "Invalid message." });
      return;
    }

    if (message.type === "GET_RULES_FOR_PAGE") {
      await refreshRules();
      sendResponse({ ok: true, origin: currentOrigin, rules: currentRules });
      return;
    }

    if (message.type === "START_PICKER") {
      startPicker(message.intent === "focus" ? "focus" : "hide");
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "EXIT_FOCUS") {
      window.QuietViewFocus.exit();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "CANCEL_PICKER") {
      stopPicker();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "CREATE_RULE_FROM_SELECTOR") {
      const selector = (message.selector || "").trim();
      if (!selector || !isValidSelector(selector)) {
        sendResponse({ ok: false, error: "Invalid CSS selector." });
        return;
      }
      const count = document.querySelectorAll(selector).length;
      if (count === 0) {
        sendResponse({ ok: false, error: "Nothing on this page matches that selector." });
        return;
      }
      if (count > 1) {
        sendResponse({
          ok: false,
          error: `That selector matches ${count} elements. Make it more specific so only one matches.`
        });
        return;
      }

      currentRules = await saveRule({
        origin: currentOrigin,
        selector,
        label: window.QuietViewSelector.describeElement(document.querySelector(selector)),
        sourceType: message.sourceType || "selector",
        enabled: true,
        hideMode: await getHideModePreference()
      });
      showFloatingButtonIfNeeded();
      applyAllRules(true);
      sendResponse({ ok: true, rules: currentRules, matched: count });
      return;
    }

    if (message.type === "CREATE_RULE_FROM_SNIPPET") {
      const snippet = (message.snippet || "").trim();
      if (!snippet) {
        sendResponse({ ok: false, error: "Snippet is empty." });
        return;
      }

      const resolved = findBestSelectorFromSnippet(snippet);
      if (!resolved.selector) {
        sendResponse({ ok: false, error: "Could not derive a matching selector from snippet." });
        return;
      }
      if (resolved.ambiguous || resolved.matchCount !== 1) {
        sendResponse({
          ok: false,
          error: `That snippet matches ${resolved.matchCount} elements on this page. Paste a more specific element, or use “Hide an element” and click it instead.`,
          selector: resolved.selector,
          matched: resolved.matchCount
        });
        return;
      }

      const selector = resolved.selector;
      const matched = resolved.matchCount;
      currentRules = await saveRule({
        origin: currentOrigin,
        selector,
        label: window.QuietViewSelector.describeElement(document.querySelector(selector)),
        sourceType: "snippet",
        enabled: true,
        hideMode: await getHideModePreference()
      });
      showFloatingButtonIfNeeded();
      applyAllRules(true);
      sendResponse({ ok: true, rules: currentRules, selector, matched });
      return;
    }

    if (message.type === "TOGGLE_RULE") {
      const { id, enabled } = message;
      currentRules = await toggleRule(currentOrigin, id, enabled);
      if (!enabled) {
        removeRuleFromDom(id);
      } else {
        const rule = currentRules.find((r) => r.id === id);
        if (rule) {
          applyRule(rule);
        }
      }
      showFloatingButtonIfNeeded();
      sendResponse({ ok: true, rules: currentRules });
      return;
    }

    if (message.type === "DELETE_RULE") {
      const { id } = message;
      removeRuleFromDom(id);
      currentRules = await deleteRule(currentOrigin, id);
      showFloatingButtonIfNeeded();
      sendResponse({ ok: true, rules: currentRules });
      return;
    }

    if (message.type === "TOGGLE_QUIETVIEW") {
      toggleQuietView();
      sendResponse({ ok: true, enabled: isQuietViewEnabled });
      return;
    }

    sendResponse({ ok: false, error: `Unknown message type: ${message.type}` });
  })().catch((error) => {
    sendResponse({ ok: false, error: error.message || "Unexpected error." });
  });
  return true;
});

migrateLegacyDomMarkers();
refreshRules().catch(() => {});
ensureObserver();
