const $ = (id) => document.getElementById(id);

const ui = {
  siteLabel: $("siteLabel"),
  hideBtn: $("hideBtn"),
  focusBtn: $("focusBtn"),
  redactBtn: $("redactBtn"),
  redactShortcut: $("redactShortcut"),
  redactRow: $("redactRow"),
  redactLabel: $("redactLabel"),
  redactShot: $("redactShot"),
  redactClear: $("redactClear"),
  hideShortcut: $("hideShortcut"),
  focusShortcut: $("focusShortcut"),
  siteRules: $("siteRules"),
  hiddenCount: $("hiddenCount"),
  otherSites: $("otherSites"),
  otherCount: $("otherCount"),
  otherSitesList: $("otherSitesList"),
  selectorForm: $("selectorForm"),
  selectorInput: $("selectorInput"),
  snippetForm: $("snippetForm"),
  snippetInput: $("snippetInput"),
  exportBtn: $("exportBtn"),
  importBtn: $("importBtn"),
  importFile: $("importFile"),
  shortcutsBtn: $("shortcutsBtn"),
  reviewPrompt: $("reviewPrompt"),
  reviewLink: $("reviewLink"),
  reviewDismiss: $("reviewDismiss"),
  autoFocusRow: $("autoFocusRow"),
  autoFocusLabel: $("autoFocusLabel"),
  autoFocusStop: $("autoFocusStop"),
  recipesPanel: $("recipesPanel"),
  recipesSite: $("recipesSite"),
  recipesList: $("recipesList"),
  status: $("status")
};

const REVIEW_PROMPT_AFTER = 3;
const WHATSAPP_ORIGIN = "https://web.whatsapp.com";
const DEFAULT_WHATSAPP_SELECTOR =
  "._aigw._as6h.x9f619.x1n2onr6.x5yr21d.x17dzmu4.x1i1dayz.x2ipvbc.xjdofhw.x78zum5.xdt5ytf.x12xzxwr.x1plvlek.xryxfnj.x570efc.x18dvir5.xxljpkc.xwfak60.x18pi947";

let activeTabId = null;
let currentOrigin = "";
let allRulesMap = {};
// Live state from the page: matches per rule (null when the page can't say).
let pageState = null;
const REPAIRED_NOTICE_MS = 7 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

async function sendToBackground(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) {
    throw new Error(response?.error || "Something went wrong.");
  }
  return response;
}

async function sendToActiveTab(message) {
  if (activeTabId == null) {
    throw new Error("No active tab found.");
  }
  let response;
  try {
    response = await chrome.tabs.sendMessage(activeTabId, message);
  } catch (error) {
    if (!String(error?.message || "").includes("Receiving end does not exist")) {
      throw error;
    }
    try {
      // Tab was open before QuietView was installed or updated.
      await chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        files: QUIETVIEW.contentScripts
      });
      response = await chrome.tabs.sendMessage(activeTabId, message);
    } catch (_injectError) {
      throw new Error("QuietView can't run on this page. Try it on a regular website.");
    }
  }
  if (!response?.ok) {
    throw new Error(response?.error || "Something went wrong.");
  }
  return response;
}

// Rules on the current site go through the page so the change is visible
// immediately; rules on other sites only need storage.
function routeRuleMessage(origin, message) {
  return origin === currentOrigin
    ? sendToActiveTab(message)
    : sendToBackground({ ...message, origin });
}

// ---------------------------------------------------------------------------
// Status line (with optional one-click action, e.g. Undo)
// ---------------------------------------------------------------------------

function setStatus(text, { isError = false, action = null } = {}) {
  ui.status.textContent = text;
  ui.status.classList.toggle("error", isError);
  if (action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "link-btn";
    button.textContent = action.label;
    button.addEventListener("click", () => {
      setStatus("");
      action.onClick();
    });
    ui.status.append(" ", button);
  }
}

function reportError(error) {
  setStatus(error.message || String(error), { isError: true });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function hostnameOf(origin) {
  try {
    return new URL(origin).hostname.replace(/^www\./, "");
  } catch (_err) {
    return origin;
  }
}

function ruleLabel(rule) {
  if (rule.label) {
    return rule.label;
  }
  const selector = String(rule.selector || "").replace(/\s+/g, " ").trim();
  return selector.length > 48 ? `${selector.slice(0, 45)}…` : selector;
}

function buildSwitch(checked, label, onChange) {
  const wrapper = document.createElement("label");
  wrapper.className = "switch";
  wrapper.title = checked ? "Hidden — click to show" : "Showing — click to hide";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.setAttribute("aria-label", label);
  input.addEventListener("change", () => onChange(input.checked));
  const track = document.createElement("span");
  track.className = "switch-track";
  track.setAttribute("aria-hidden", "true");
  wrapper.append(input, track);
  return wrapper;
}

function buildRuleRow(rule, origin) {
  const row = document.createElement("li");
  row.className = `rule${rule.enabled ? "" : " is-off"}`;

  const text = document.createElement("div");
  text.className = "rule-text";
  const name = document.createElement("span");
  name.className = "rule-name";
  name.textContent = ruleLabel(rule);
  name.title = rule.selector;
  const state = document.createElement("span");
  state.className = "rule-state";
  renderRuleState(state, rule, origin);
  text.append(name, state);

  const toggle = buildSwitch(rule.enabled, `Keep “${ruleLabel(rule)}” hidden`, async (enabled) => {
    try {
      await routeRuleMessage(origin, { type: "TOGGLE_RULE", id: rule.id, enabled });
      await reloadRules();
    } catch (error) {
      reportError(error);
    }
  });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "icon-btn";
  remove.setAttribute("aria-label", `Remove “${ruleLabel(rule)}”`);
  remove.title = "Remove";
  remove.textContent = "×";
  remove.addEventListener("click", () => removeRules(origin, [rule]));

  row.append(text, toggle, remove);
  return row;
}

// Say what is actually happening on the page, and offer the fix inline when
// a site change broke a rule.
function renderRuleState(state, rule, origin) {
  const onThisPage = origin === currentOrigin && pageState;
  const matches = onThisPage ? pageState.counts[rule.id] : undefined;
  if (!rule.enabled) {
    state.textContent = "Showing";
    return;
  }
  if (onThisPage && matches === 0) {
    state.classList.add("warn");
    state.textContent = "Not found on this page";
    if (rule.sourceType !== "recipe") {
      const fix = document.createElement("button");
      fix.type = "button";
      fix.className = "link-btn";
      fix.textContent = "Fix it";
      fix.title = "Click the element again to update this rule";
      fix.addEventListener("click", () => startPicker("hide", { replaceRuleId: rule.id }));
      state.append(" · ", fix);
    }
    return;
  }
  state.textContent =
    rule.healedAt && Date.now() - rule.healedAt < REPAIRED_NOTICE_MS
      ? "Hidden · repaired automatically after a site change"
      : "Hidden";
}

function renderRecipes() {
  const recipe = currentOrigin ? QuietViewRecipes.recipesForHost(new URL(currentOrigin).hostname) : null;
  ui.recipesPanel.hidden = !recipe;
  if (!recipe) {
    return;
  }
  ui.recipesSite.textContent = recipe.site;
  ui.recipesList.replaceChildren();
  const rules = allRulesMap[currentOrigin] || [];

  for (const item of recipe.items) {
    const rule = rules.find((entry) => entry.recipeId === item.id);
    const row = document.createElement("li");
    row.className = "rule";
    const text = document.createElement("div");
    text.className = "rule-text";
    const name = document.createElement("span");
    name.className = "rule-name";
    name.textContent = item.label;
    const state = document.createElement("span");
    state.className = "rule-state";
    if (rule) {
      renderRuleState(state, rule, currentOrigin);
    } else {
      state.textContent = item.hideMode === "blur" ? "Off · blurs until you hover" : "Off";
    }
    text.append(name, state);

    const toggle = buildSwitch(Boolean(rule?.enabled), `Turn on “${item.label}”`, async (enabled) => {
      try {
        await sendToActiveTab({ type: "SET_RECIPE", recipeId: item.id, enabled });
        await reloadRules();
      } catch (error) {
        reportError(error);
      }
    });
    row.append(text, toggle);
    ui.recipesList.append(row);
  }
}

function renderRedactions() {
  const count = pageState?.redactions || 0;
  ui.redactRow.hidden = count === 0;
  ui.redactLabel.textContent = `${count} item${count === 1 ? "" : "s"} redacted on this page.`;
}

function renderAutoFocus() {
  const rule = pageState?.focusRule;
  ui.autoFocusRow.hidden = !rule;
  if (rule) {
    ui.autoFocusLabel.textContent = rule.label || "an element";
  }
}

function renderSiteRules() {
  // Recipe rules are shown (and toggled) in the cleanups panel instead.
  const rules = (allRulesMap[currentOrigin] || []).filter((rule) => !rule.recipeId);
  ui.siteRules.replaceChildren();
  ui.hiddenCount.hidden = rules.length === 0;
  ui.hiddenCount.textContent = String(rules.length);

  if (!rules.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = currentOrigin
      ? "Nothing hidden here yet. Use “Hide an element” and click what you don't want to see."
      : "Open a website to start.";
    ui.siteRules.append(empty);
    return;
  }
  for (const rule of rules) {
    ui.siteRules.append(buildRuleRow(rule, currentOrigin));
  }
}

function renderOtherSites() {
  const origins = Object.keys(allRulesMap)
    .filter((origin) => origin !== currentOrigin && /^https?:/.test(origin) && allRulesMap[origin]?.length)
    .sort((a, b) => hostnameOf(a).localeCompare(hostnameOf(b)));

  ui.otherSites.hidden = origins.length === 0;
  ui.otherCount.textContent = String(origins.length);
  ui.otherSitesList.replaceChildren();

  for (const origin of origins) {
    const rules = allRulesMap[origin];
    const site = document.createElement("details");
    site.className = "site";

    const summary = document.createElement("summary");
    const name = document.createElement("span");
    name.className = "site-name";
    name.textContent = hostnameOf(origin);
    const count = document.createElement("span");
    count.className = "count";
    count.textContent = String(rules.length);
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "link-btn";
    clear.textContent = "Remove all";
    clear.addEventListener("click", (event) => {
      event.preventDefault();
      removeRules(origin, rules);
    });
    summary.append(name, count, clear);

    const list = document.createElement("ul");
    list.className = "rules";
    for (const rule of rules) {
      list.append(buildRuleRow(rule, origin));
    }
    site.append(summary, list);
    ui.otherSitesList.append(site);
  }
}

async function reloadRules() {
  const { ruleMap } = await sendToBackground({ type: "GET_ALL_RULES" });
  allRulesMap = ruleMap || {};
  if (activeTabId != null) {
    pageState = await sendToActiveTab({ type: "GET_PAGE_STATE" }).catch(() => null);
  }
  renderAutoFocus();
  renderRedactions();
  renderRecipes();
  renderSiteRules();
  renderOtherSites();
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

// Delete is instant; Undo puts the exact rules back.
async function removeRules(origin, rules) {
  try {
    for (const rule of rules) {
      await routeRuleMessage(origin, { type: "DELETE_RULE", id: rule.id });
    }
    await reloadRules();
    const what = rules.length === 1 ? `“${ruleLabel(rules[0])}”` : `${rules.length} rules`;
    setStatus(`Removed ${what}.`, {
      action: {
        label: "Undo",
        onClick: async () => {
          try {
            await sendToBackground({ type: "IMPORT_RULES", ruleMap: { [origin]: rules } });
            if (origin === currentOrigin) {
              await sendToActiveTab({ type: "GET_RULES_FOR_PAGE" });
            }
            await reloadRules();
            setStatus("Restored.");
          } catch (error) {
            reportError(error);
          }
        }
      }
    });
  } catch (error) {
    reportError(error);
  }
}

async function startPicker(intent, { replaceRuleId } = {}) {
  try {
    await sendToActiveTab({ type: "START_PICKER", intent, replaceRuleId });
    window.close();
  } catch (error) {
    reportError(error);
  }
}

async function getHideMode() {
  const data = await chrome.storage.local.get(QUIETVIEW.prefsKey);
  const mode = data[QUIETVIEW.prefsKey]?.hideMode;
  return mode === "visibilityHidden" || mode === "blur" ? mode : "displayNone";
}

async function setHideMode(hideMode) {
  const data = await chrome.storage.local.get(QUIETVIEW.prefsKey);
  await chrome.storage.local.set({
    [QUIETVIEW.prefsKey]: { ...(data[QUIETVIEW.prefsKey] || {}), hideMode }
  });
}

function storeReviewUrl() {
  const isFirefox = typeof browser !== "undefined" || navigator.userAgent.includes("Firefox");
  return isFirefox
    ? `https://addons.mozilla.org/firefox/addon/${encodeURIComponent(QUIETVIEW.firefoxId)}/reviews/`
    : `https://chromewebstore.google.com/detail/${chrome.runtime.id}/reviews`;
}

// Ask for a rating only after QuietView has proven useful a few times,
// and never again once answered.
async function maybeShowReviewPrompt() {
  const data = await chrome.storage.local.get(QUIETVIEW.statsKey);
  const stats = data[QUIETVIEW.statsKey] || {};
  const uses = (stats.hides || 0) + (stats.focuses || 0);
  if (stats.reviewPrompt || uses < REVIEW_PROMPT_AFTER) {
    return;
  }
  const answer = async (value) => {
    ui.reviewPrompt.hidden = true;
    await chrome.storage.local.set({ [QUIETVIEW.statsKey]: { ...stats, reviewPrompt: value } });
  };
  ui.reviewPrompt.hidden = false;
  ui.reviewLink.addEventListener("click", () => answer("rated"));
  ui.reviewDismiss.addEventListener("click", () => answer("dismissed"));
}

// WhatsApp Web ships with one helpful default (hide the chat list). Seed it
// once per install so deleting it is respected.
async function seedDefaultsOnce() {
  if (currentOrigin !== WHATSAPP_ORIGIN) {
    return;
  }
  const data = await chrome.storage.local.get(QUIETVIEW.seedKey);
  const seeded = data[QUIETVIEW.seedKey] || {};
  if (seeded.whatsapp) {
    return;
  }
  const { rules } = await sendToBackground({ type: "GET_RULES", origin: currentOrigin });
  if (!rules.some((rule) => rule.selector === DEFAULT_WHATSAPP_SELECTOR)) {
    await sendToBackground({
      type: "UPSERT_RULE",
      rule: {
        origin: currentOrigin,
        selector: DEFAULT_WHATSAPP_SELECTOR,
        label: "Chat list",
        sourceType: "selector",
        enabled: true,
        hideMode: "displayNone"
      }
    });
  }
  await chrome.storage.local.set({ [QUIETVIEW.seedKey]: { ...seeded, whatsapp: true } });
}

async function showShortcuts() {
  try {
    const commands = await chrome.commands.getAll();
    const byName = Object.fromEntries(commands.map((command) => [command.name, command.shortcut]));
    ui.hideShortcut.textContent = byName["start-picker"] || "";
    ui.focusShortcut.textContent = byName["focus-element"] || "";
    ui.redactShortcut.textContent = byName["redact-mode"] || "";
  } catch (_err) {
    // Shortcuts are a hint only.
  }
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

ui.hideBtn.addEventListener("click", () => startPicker("hide"));
ui.redactBtn.addEventListener("click", async () => {
  try {
    await sendToActiveTab({ type: "START_REDACT" });
    window.close();
  } catch (error) {
    reportError(error);
  }
});
ui.redactShot.addEventListener("click", async () => {
  // The tab capture never includes the popup, so capture, then close.
  try {
    await sendToActiveTab({ type: "SCREENSHOT" });
    window.close();
  } catch (error) {
    reportError(error);
  }
});
ui.redactClear.addEventListener("click", async () => {
  try {
    await sendToActiveTab({ type: "CLEAR_REDACTIONS" });
    await reloadRules();
    setStatus("Redactions cleared.");
  } catch (error) {
    reportError(error);
  }
});
ui.autoFocusStop.addEventListener("click", async () => {
  try {
    await sendToActiveTab({ type: "CLEAR_FOCUS_RULE" });
    await reloadRules();
    setStatus("This site won't auto-focus anymore.");
  } catch (error) {
    reportError(error);
  }
});
ui.focusBtn.addEventListener("click", () => startPicker("focus"));

document.querySelectorAll('input[name="hideMode"]').forEach((radio) => {
  radio.addEventListener("change", () => setHideMode(radio.value).catch(reportError));
});

ui.selectorForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const selector = ui.selectorInput.value.trim();
  if (!selector) {
    setStatus("Enter a CSS selector first.", { isError: true });
    return;
  }
  try {
    await sendToActiveTab({ type: "CREATE_RULE_FROM_SELECTOR", selector, sourceType: "selector" });
    ui.selectorInput.value = "";
    await reloadRules();
    setStatus("Hidden.");
  } catch (error) {
    reportError(error);
  }
});

ui.snippetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const snippet = ui.snippetInput.value.trim();
  if (!snippet) {
    setStatus("Paste an HTML snippet first.", { isError: true });
    return;
  }
  try {
    await sendToActiveTab({ type: "CREATE_RULE_FROM_SNIPPET", snippet });
    ui.snippetInput.value = "";
    await reloadRules();
    setStatus("Found it on the page and hid it.");
  } catch (error) {
    reportError(error);
  }
});

ui.exportBtn.addEventListener("click", async () => {
  try {
    const { ruleMap } = await sendToBackground({ type: "EXPORT_ALL" });
    const payload = {
      quietviewVersion: QUIETVIEW.exportFormatVersion,
      exportedAt: new Date().toISOString(),
      sites: ruleMap
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    await chrome.downloads.download({ url, filename: `${QUIETVIEW.exportPrefix}-${date}.json`, saveAs: true });
    setStatus("Exported.");
  } catch (error) {
    reportError(error);
  }
});

ui.importBtn.addEventListener("click", () => ui.importFile.click());

// Accepts both the v2 all-sites export and the v1 single-site export.
function toRuleMap(parsed) {
  if (parsed && typeof parsed.sites === "object" && !Array.isArray(parsed.sites)) {
    return parsed.sites;
  }
  const rules = Array.isArray(parsed) ? parsed : parsed?.rules;
  if (Array.isArray(rules)) {
    const origin = parsed?.origin || currentOrigin;
    return origin ? { [origin]: rules } : null;
  }
  return null;
}

ui.importFile.addEventListener("change", async () => {
  const file = ui.importFile.files?.[0];
  if (!file) {
    return;
  }
  try {
    const ruleMap = toRuleMap(JSON.parse(await file.text()));
    if (!ruleMap) {
      throw new Error("That file isn't a QuietView export.");
    }
    const { added } = await sendToBackground({ type: "IMPORT_RULES", ruleMap });
    if (currentOrigin) {
      await sendToActiveTab({ type: "GET_RULES_FOR_PAGE" }).catch(() => {});
    }
    await reloadRules();
    setStatus(added ? `Imported ${added} rule${added === 1 ? "" : "s"}.` : "Everything in that file was already here.");
  } catch (error) {
    reportError(error instanceof SyntaxError ? new Error("That file isn't valid JSON.") : error);
  } finally {
    ui.importFile.value = "";
  }
});

ui.shortcutsBtn.addEventListener("click", () => {
  const isFirefox = navigator.userAgent.includes("Firefox");
  if (isFirefox) {
    setStatus("In Firefox: Add-ons → gear icon → Manage Extension Shortcuts.");
    return;
  }
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

(function setupLinks() {
  $("privacyLink").href = QUIETVIEW.publisher.privacyUrl;
  $("publisherLink").href = QUIETVIEW.publisher.productUrl;
  $("rateLink").href = storeReviewUrl();
  ui.reviewLink.href = storeReviewUrl();
})();

(async function init() {
  showShortcuts();
  getHideMode()
    .then((mode) => {
      const radio = document.querySelector(`input[name="hideMode"][value="${mode}"]`);
      if (radio) radio.checked = true;
    })
    .catch(() => {});

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url || "";
    if (tab && typeof tab.id === "number" && /^https?:\/\//.test(url)) {
      activeTabId = tab.id;
      currentOrigin = new URL(url).origin;
      ui.siteLabel.textContent = hostnameOf(currentOrigin);
      ui.siteLabel.title = currentOrigin;
      await seedDefaultsOnce();
    } else {
      ui.hideBtn.disabled = true;
      ui.focusBtn.disabled = true;
      ui.redactBtn.disabled = true;
      setStatus("QuietView works on regular websites. Open one to start.");
    }
    await reloadRules();
    await maybeShowReviewPrompt();
  } catch (error) {
    reportError(error);
  }
})();
