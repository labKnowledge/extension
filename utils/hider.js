// Hide engine: applies rules by tagging elements with attributes that one
// injected stylesheet acts on. Nothing on the page's own inline styles is
// touched, so removing a rule (or pausing) restores the page exactly.
(function initQuietViewHider(global) {
  const IDS_ATTR = "data-quietview-rule-ids";
  const MODE_ATTR = "data-quietview-hide";
  const PAUSED_ATTR = "data-quietview-paused";
  const STYLE_ID = "quietview-hide-style";

  // When several rules hit one element, the strongest effect wins.
  const MODE_STRENGTH = { remove: 3, space: 2, blur: 1 };

  function modeOf(rule) {
    if (rule.hideMode === "visibilityHidden") return "space";
    if (rule.hideMode === "blur") return "blur";
    return "remove";
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html:not([${PAUSED_ATTR}]) [${MODE_ATTR}="remove"] { display: none !important; }
      html:not([${PAUSED_ATTR}]) [${MODE_ATTR}="space"] { visibility: hidden !important; }
      html:not([${PAUSED_ATTR}]) [${MODE_ATTR}="blur"] {
        filter: blur(10px) !important; transition: filter 0.15s ease !important;
      }
      html:not([${PAUSED_ATTR}]) [${MODE_ATTR}="blur"]:hover { filter: none !important; }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function readIds(el) {
    const raw = el.getAttribute(IDS_ATTR);
    return raw ? raw.split(",").filter(Boolean) : [];
  }

  function writeState(el, ids, rulesById) {
    if (!ids.length) {
      el.removeAttribute(IDS_ATTR);
      el.removeAttribute(MODE_ATTR);
      return;
    }
    let mode = "blur";
    for (const id of ids) {
      const rule = rulesById.get(id);
      const candidate = rule ? modeOf(rule) : "remove";
      if (MODE_STRENGTH[candidate] > MODE_STRENGTH[mode]) {
        mode = candidate;
      }
    }
    el.setAttribute(IDS_ATTR, ids.join(","));
    if (el.getAttribute(MODE_ATTR) !== mode) {
      el.setAttribute(MODE_ATTR, mode);
    }
  }

  function query(selector) {
    try {
      return Array.from(document.querySelectorAll(selector));
    } catch (_err) {
      return [];
    }
  }

  /**
   * Apply every enabled rule. Returns { [ruleId]: matchCount } so callers can
   * tell which rules found nothing on this page.
   */
  function applyRules(rules) {
    ensureStyles();
    const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
    const counts = {};
    const touched = new Map();

    for (const rule of rules) {
      if (!rule.enabled) {
        continue;
      }
      const nodes = query(rule.selector);
      counts[rule.id] = nodes.length;
      for (const node of nodes) {
        if (!touched.has(node)) {
          touched.set(node, []);
        }
        touched.get(node).push(rule.id);
      }
    }

    // Drop markers for rules that no longer match (or were disabled/deleted).
    for (const el of document.querySelectorAll(`[${IDS_ATTR}]`)) {
      if (!touched.has(el)) {
        writeState(el, [], rulesById);
      }
    }
    for (const [el, ids] of touched) {
      if (readIds(el).join(",") !== ids.join(",") || !el.hasAttribute(MODE_ATTR)) {
        writeState(el, ids, rulesById);
      }
    }
    return counts;
  }

  function hiddenCount() {
    return document.querySelectorAll(`[${MODE_ATTR}]`).length;
  }

  function setPaused(paused) {
    document.documentElement.toggleAttribute(PAUSED_ATTR, paused);
  }

  function isPaused() {
    return document.documentElement.hasAttribute(PAUSED_ATTR);
  }

  global.QuietViewHider = { applyRules, hiddenCount, setPaused, isPaused };
})(typeof globalThis !== "undefined" ? globalThis : window);
