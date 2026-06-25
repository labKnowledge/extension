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

function applyAllRules() {
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
  applyAllRules();
}

function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.setAttribute("role", "status");
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "2147483647",
    maxWidth: "min(90vw, 420px)",
    padding: "10px 14px",
    borderRadius: "8px",
    font: "13px/1.4 system-ui, sans-serif",
    color: "#fff",
    background: isError ? QUIETVIEW.colors.toastError : QUIETVIEW.colors.toastOk,
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
  });
  document.documentElement.appendChild(toast);
  window.setTimeout(() => toast.remove(), isError ? 6000 : 3000);
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
    showToast(`${QUIETVIEW.name}: All elements shown.`);
  } else {
    hideAll();
    isQuietViewEnabled = true;
    showToast(`${QUIETVIEW.name}: All elements hidden.`);
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

function createFloatingButton() {
  if (floatingButton) {
    return floatingButton;
  }

  const button = document.createElement("div");
  button.id = FLOATING_BTN_ID;
  button.setAttribute("role", "button");
  button.setAttribute("tabindex", "0");
  button.setAttribute("aria-label", "Show all hidden elements");

  Object.assign(button.style, {
    position: "fixed",
    right: "24px",
    bottom: "24px",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: QUIETVIEW.colors.accent,
    cursor: "pointer",
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
  `;
  document.head.appendChild(hoverStyle);

  const onClick = (event) => {
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

  createFloatingButton();
  updateFloatingButton();
}

function scheduleApplyAll() {
  window.clearTimeout(applyTimer);
  applyTimer = window.setTimeout(applyAllRules, 120);
}

function ensureObserver() {
  if (observer) {
    return;
  }
  observer = new MutationObserver(() => scheduleApplyAll());
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

function pickElementAtPoint(x, y) {
  if (pickerState?.outlineEl) {
    pickerState.outlineEl.style.display = "none";
  }
  const el = document.elementFromPoint(x, y);
  if (pickerState?.outlineEl) {
    pickerState.outlineEl.style.display = "block";
  }
  if (!el || el === pickerState?.outlineEl) {
    return null;
  }
  return el;
}

function updateOutline(target) {
  if (!pickerState || !pickerState.outlineEl || !target) {
    return;
  }
  const rect = target.getBoundingClientRect();
  const outline = pickerState.outlineEl;
  outline.style.left = `${rect.left + window.scrollX}px`;
  outline.style.top = `${rect.top + window.scrollY}px`;
  outline.style.width = `${rect.width}px`;
  outline.style.height = `${rect.height}px`;
}

function notifyPickerResult(result) {
  const text = result.ok
    ? `${QUIETVIEW.name}: element hidden.`
    : result.error || `${QUIETVIEW.name}: could not save rule.`;
  const isError = !result.ok;

  if (typeof chrome !== "undefined" && chrome.storage?.session) {
    chrome.storage.session
      .set({
        [QUIETVIEW.pickerStatusKey]: {
          text,
          isError,
          timestamp: Date.now()
        }
      })
      .catch(() => {});
  }

  const toast = document.createElement("div");
  toast.textContent = text;
  toast.setAttribute("role", "status");
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "2147483647",
    maxWidth: "min(90vw, 420px)",
    padding: "10px 14px",
    borderRadius: "8px",
    font: "13px/1.4 system-ui, sans-serif",
    color: "#fff",
    background: isError ? QUIETVIEW.colors.toastError : QUIETVIEW.colors.toastOk,
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
  });
  document.documentElement.appendChild(toast);
  window.setTimeout(() => toast.remove(), isError ? 6000 : 3000);
}

function stopPicker() {
  if (!pickerState) {
    return;
  }
  if (pickerState.onMouseMove) {
    document.removeEventListener("mousemove", pickerState.onMouseMove, true);
  }
  if (pickerState.onClick) {
    document.removeEventListener("click", pickerState.onClick, true);
  }
  if (pickerState.onKeyDown) {
    document.removeEventListener("keydown", pickerState.onKeyDown, true);
  }
  if (pickerState.outlineEl && typeof pickerState.outlineEl.remove === "function") {
    pickerState.outlineEl.remove();
  }
  pickerState = null;
}

function startPicker(hideMode) {
  stopPicker();

  const outlineEl = document.createElement("div");
  outlineEl.style.position = "absolute";
  outlineEl.style.border = `2px solid ${QUIETVIEW.colors.pickerOutline}`;
  outlineEl.style.background = `rgba(${QUIETVIEW.colors.accentRgb}, 0.12)`;
  outlineEl.style.pointerEvents = "none";
  outlineEl.style.zIndex = "2147483647";
  document.documentElement.appendChild(outlineEl);

  const onMouseMove = (event) => {
    const target = pickElementAtPoint(event.clientX, event.clientY);
    if (!target) {
      return;
    }
    pickerState.lastTarget = target;
    updateOutline(target);
  };

  const onClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const target = pickElementAtPoint(event.clientX, event.clientY) || pickerState.lastTarget;
    if (!target) {
      return;
    }
    const resolved = window.QuietViewSelector.resolveUniqueSelector(
      target,
      document.documentElement
    );
    if (!resolved.selector) {
      stopPicker();
      notifyPickerResult({
        ok: false,
        error: "Could not build a selector for this element."
      });
      return;
    }
    if (resolved.ambiguous || resolved.matchCount !== 1) {
      stopPicker();
      notifyPickerResult({
        ok: false,
        error: `Selector matched ${resolved.matchCount} elements. Pick a more specific child, or use a snippet with id or data-testid.`,
        selector: resolved.selector,
        matchCount: resolved.matchCount
      });
      return;
    }

    const selector = resolved.selector;

    const rule = {
      origin: currentOrigin,
      selector,
      sourceType: "picker",
      enabled: true,
      hideMode: pickerState.hideMode || "displayNone"
    };
    currentRules = await saveRule(rule);
    applyAllRules();
    stopPicker();
    notifyPickerResult({ ok: true, selector, matchCount: resolved.matchCount });
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      stopPicker();
    }
  };

  pickerState = {
    outlineEl,
    onMouseMove,
    onClick,
    onKeyDown,
    lastTarget: null,
    hideMode: hideMode === "visibilityHidden" ? "visibilityHidden" : "displayNone"
  };

  document.addEventListener("mousemove", onMouseMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKeyDown, true);
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
      startPicker(message.hideMode);
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
        sendResponse({ ok: false, error: "Selector matched 0 elements on this page." });
        return;
      }
      if (count > 1) {
        sendResponse({
          ok: false,
          error: `Selector matched ${count} elements. Use a more specific selector.`
        });
        return;
      }

      currentRules = await saveRule({
        origin: currentOrigin,
        selector,
        sourceType: message.sourceType || "selector",
        enabled: true,
        hideMode: message.hideMode === "visibilityHidden" ? "visibilityHidden" : "displayNone"
      });
      applyAllRules();
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
          error: `Derived selector matched ${resolved.matchCount} elements. Paste a more specific element or one with id/data-testid.`,
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
        sourceType: "snippet",
        enabled: true,
        hideMode: message.hideMode === "visibilityHidden" ? "visibilityHidden" : "displayNone"
      });
      applyAllRules();
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
