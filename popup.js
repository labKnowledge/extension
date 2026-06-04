const originLabel = document.getElementById("originLabel");
const statusEl = document.getElementById("status");
const rulesList = document.getElementById("rulesList");
const selectorInput = document.getElementById("selectorInput");
const snippetInput = document.getElementById("snippetInput");
const hideModeSelect = document.getElementById("hideModeSelect");
const exportRulesBtn = document.getElementById("exportRulesBtn");
const importRulesBtn = document.getElementById("importRulesBtn");
const importRulesFile = document.getElementById("importRulesFile");

const startPickerBtn = document.getElementById("startPickerBtn");
const cancelPickerBtn = document.getElementById("cancelPickerBtn");
const addSelectorBtn = document.getElementById("addSelectorBtn");
const addSnippetBtn = document.getElementById("addSnippetBtn");

let activeTabId = null;
let currentOrigin = "";
let allRulesMap = {};
let activeTabUrl = "";
const collapsedGroups = new Set();

const WHATSAPP_ORIGIN = "https://web.whatsapp.com";
const DEFAULT_WHATSAPP_SELECTOR =
  "._aigw._as6h.x9f619.x1n2onr6.x5yr21d.x17dzmu4.x1i1dayz.x2ipvbc.xjdofhw.x78zum5.xdt5ytf.x12xzxwr.x1plvlek.xryxfnj.x570efc.x18dvir5.xxljpkc.xwfak60.x18pi947";

function getHideMode() {
  return hideModeSelect.value === "visibilityHidden" ? "visibilityHidden" : "displayNone";
}

function setStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", Boolean(isError));
}

async function applyPickerStatusFromSession() {
  if (!chrome.storage?.session) {
    return false;
  }
  const key = QUIETVIEW.pickerStatusKey;
  const data = await chrome.storage.session.get(key);
  const status = data[key];
  if (!status || Date.now() - status.timestamp > 120000) {
    return false;
  }
  setStatus(status.text, status.isError);
  await chrome.storage.session.remove(key);
  return true;
}

function compactSelector(selector) {
  const oneLine = String(selector || "").replace(/\s+/g, " ").trim();
  if (oneLine.length <= 110) {
    return oneLine;
  }
  return `${oneLine.slice(0, 107)}...`;
}

function prettySource(sourceType) {
  if (sourceType === "snippet") {
    return "Pasted";
  }
  if (sourceType === "picker") {
    return "Picked";
  }
  return "Selector";
}

async function sendToActiveTab(message) {
  if (!activeTabId) {
    throw new Error("No active tab found.");
  }
  try {
    return await chrome.tabs.sendMessage(activeTabId, message);
  } catch (error) {
    const text = String(error?.message || "");
    if (!text.includes("Receiving end does not exist")) {
      throw error;
    }
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        files: ["utils/constants.js", "utils/selector.js", "content.js"]
      });
      return await chrome.tabs.sendMessage(activeTabId, message);
    } catch (_injectError) {
      throw new Error(
        `This page cannot run ${QUIETVIEW.name}. Open a normal website tab (not chrome:// or extension pages).`
      );
    }
  }
}

async function getRulesFromBackground(origin) {
  const response = await chrome.runtime.sendMessage({ type: "GET_RULES", origin });
  if (!response?.ok) {
    throw new Error(response?.error || "Failed to load rules.");
  }
  return response.rules || [];
}

async function getAllRulesFromBackground() {
  const response = await chrome.runtime.sendMessage({ type: "GET_ALL_RULES" });
  if (!response?.ok) {
    throw new Error(response?.error || "Failed to load rules.");
  }
  return response.ruleMap || {};
}

async function upsertRuleInBackground(rule) {
  const response = await chrome.runtime.sendMessage({ type: "UPSERT_RULE", rule });
  if (!response?.ok) {
    throw new Error(response?.error || "Failed to save rule.");
  }
  return response.rules || [];
}

async function reloadRulesFromBackground() {
  allRulesMap = await getAllRulesFromBackground();
  originLabel.textContent = currentOrigin;
  renderRules();
}

async function ensureDefaultWhatsAppRule() {
  if (currentOrigin !== WHATSAPP_ORIGIN) {
    return;
  }
  const rules = await getRulesFromBackground(currentOrigin);
  const exists = rules.some((rule) => rule.selector === DEFAULT_WHATSAPP_SELECTOR);
  if (exists) {
    return;
  }
  await upsertRuleInBackground({
    origin: currentOrigin,
    selector: DEFAULT_WHATSAPP_SELECTOR,
    sourceType: "selector",
    enabled: true,
    hideMode: "displayNone"
  });
}

async function toggleRuleRouted(origin, id, enabled) {
  if (origin === currentOrigin) {
    return sendToActiveTab({ type: "TOGGLE_RULE", id, enabled });
  }
  return chrome.runtime.sendMessage({ type: "TOGGLE_RULE", origin, id, enabled });
}

async function deleteRuleRouted(origin, id) {
  if (origin === currentOrigin) {
    return sendToActiveTab({ type: "DELETE_RULE", id });
  }
  return chrome.runtime.sendMessage({ type: "DELETE_RULE", origin, id });
}

function buildRuleCard(rule, origin) {
  const active = Boolean(rule.enabled);

  const card = document.createElement("div");
  card.className = "rule";

  const head = document.createElement("div");
  head.className = "rule-head";

  const left = document.createElement("div");
  left.className = "rule-top";
  const source = document.createElement("span");
  source.className = "rule-source";
  source.textContent = prettySource(rule.sourceType);
  const activeChip = document.createElement("span");
  activeChip.className = `rule-chip ${active ? "active" : "inactive"}`;
  activeChip.textContent = active ? "Active" : "Hidden Disabled";
  left.appendChild(source);
  left.appendChild(activeChip);

  const right = document.createElement("div");
  right.className = "row";

  const showBtn = document.createElement("button");
  showBtn.className = "secondary";
  showBtn.textContent = "Show";
  showBtn.disabled = !active;
  showBtn.addEventListener("click", async () => {
    try {
      const response = await toggleRuleRouted(origin, rule.id, false);
      if (!response?.ok) throw new Error(response?.error || "Failed to show rule.");
      await reloadRulesFromBackground();
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  const hideBtn = document.createElement("button");
  hideBtn.className = "secondary";
  hideBtn.textContent = "Hide";
  hideBtn.disabled = active;
  hideBtn.addEventListener("click", async () => {
    try {
      const response = await toggleRuleRouted(origin, rule.id, true);
      if (!response?.ok) throw new Error(response?.error || "Failed to hide rule.");
      await reloadRulesFromBackground();
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  const removeBtn = document.createElement("button");
  removeBtn.className = "secondary";
  removeBtn.textContent = "Delete";
  removeBtn.addEventListener("click", async () => {
    try {
      const response = await deleteRuleRouted(origin, rule.id);
      if (!response?.ok) throw new Error(response?.error || "Failed to delete rule.");
      await reloadRulesFromBackground();
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  right.appendChild(showBtn);
  right.appendChild(hideBtn);
  right.appendChild(removeBtn);
  head.appendChild(left);
  head.appendChild(right);

  const selectorEl = document.createElement("div");
  selectorEl.className = "rule-selector";
  selectorEl.textContent = compactSelector(rule.selector);

  card.appendChild(head);
  card.appendChild(selectorEl);
  return card;
}

function buildGroupHeader(origin, rules) {
  const header = document.createElement("div");
  header.className = "rule-group-header";

  const chevron = document.createElement("span");
  chevron.className = `rule-group-chevron ${collapsedGroups.has(origin) ? "" : "open"}`;
  chevron.textContent = "▶";

  const title = document.createElement("span");
  title.className = "rule-group-title";
  try {
    title.textContent = new URL(origin).hostname;
  } catch (_) {
    title.textContent = origin;
  }

  const count = document.createElement("span");
  count.className = "rule-group-count";
  count.textContent = rules.length;

  const actions = document.createElement("div");
  actions.className = "rule-group-actions";

  const showAllBtn = document.createElement("button");
  showAllBtn.className = "secondary";
  showAllBtn.textContent = "Show All";
  showAllBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    try {
      for (const rule of rules) {
        const response = await toggleRuleRouted(origin, rule.id, false);
        if (!response?.ok) throw new Error(response?.error || "Failed.");
      }
      await reloadRulesFromBackground();
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  const hideAllBtn = document.createElement("button");
  hideAllBtn.className = "secondary";
  hideAllBtn.textContent = "Hide All";
  hideAllBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    try {
      for (const rule of rules) {
        const response = await toggleRuleRouted(origin, rule.id, true);
        if (!response?.ok) throw new Error(response?.error || "Failed.");
      }
      await reloadRulesFromBackground();
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  const deleteGroupBtn = document.createElement("button");
  deleteGroupBtn.className = "secondary";
  deleteGroupBtn.textContent = "Delete Group";
  deleteGroupBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    try {
      for (const rule of rules) {
        const response = await deleteRuleRouted(origin, rule.id);
        if (!response?.ok) throw new Error(response?.error || "Failed.");
      }
      await reloadRulesFromBackground();
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  actions.appendChild(showAllBtn);
  actions.appendChild(hideAllBtn);
  actions.appendChild(deleteGroupBtn);
  header.appendChild(chevron);
  header.appendChild(title);
  header.appendChild(count);
  header.appendChild(actions);
  return header;
}

function renderRules() {
  rulesList.innerHTML = "";

  const origins = Object.keys(allRulesMap).filter((o) => allRulesMap[o].length > 0);

  if (!origins.length) {
    const empty = document.createElement("p");
    empty.textContent = "No rules yet.";
    empty.className = "rule-meta";
    rulesList.appendChild(empty);
    return;
  }

  const sorted = [
    ...(allRulesMap[currentOrigin]?.length ? [currentOrigin] : []),
    ...origins.filter((o) => o !== currentOrigin).sort()
  ];

  for (const origin of sorted) {
    const rules = allRulesMap[origin] || [];
    if (!rules.length) continue;

    const group = document.createElement("div");
    group.className = "rule-group";

    const header = buildGroupHeader(origin, rules);
    const body = document.createElement("div");
    body.className = `rule-group-body${collapsedGroups.has(origin) ? " collapsed" : ""}`;

    header.addEventListener("click", () => {
      if (collapsedGroups.has(origin)) {
        collapsedGroups.delete(origin);
      } else {
        collapsedGroups.add(origin);
      }
      body.classList.toggle("collapsed");
      header.querySelector(".rule-group-chevron").classList.toggle("open");
    });

    for (const rule of rules) {
      body.appendChild(buildRuleCard(rule, origin));
    }

    group.appendChild(header);
    group.appendChild(body);
    rulesList.appendChild(group);
  }
}

startPickerBtn.addEventListener("click", async () => {
  try {
    const response = await sendToActiveTab({ type: "START_PICKER", hideMode: getHideMode() });
    if (!response?.ok) {
      throw new Error(response?.error || "Could not start picker.");
    }
    setStatus("Picker active. Click element on page to hide.", false);
    window.close();
  } catch (error) {
    setStatus(error.message, true);
  }
});

cancelPickerBtn.addEventListener("click", async () => {
  try {
    await sendToActiveTab({ type: "CANCEL_PICKER" });
    setStatus("Picker cancelled.", false);
  } catch (error) {
    setStatus(error.message, true);
  }
});

addSelectorBtn.addEventListener("click", async () => {
  const selector = selectorInput.value.trim();
  if (!selector) {
    setStatus("Selector is required.", true);
    return;
  }
  try {
    const response = await sendToActiveTab({
      type: "CREATE_RULE_FROM_SELECTOR",
      selector,
      sourceType: "selector",
      hideMode: getHideMode()
    });
    if (!response?.ok) {
      throw new Error(response?.error || "Failed to add selector rule.");
    }
    await reloadRulesFromBackground();
    setStatus(`Rule added. Matched ${response.matched} element(s).`, false);
    selectorInput.value = "";
  } catch (error) {
    setStatus(error.message, true);
  }
});

addSnippetBtn.addEventListener("click", async () => {
  const snippet = snippetInput.value.trim();
  if (!snippet) {
    setStatus("Snippet is required.", true);
    return;
  }
  try {
    const response = await sendToActiveTab({
      type: "CREATE_RULE_FROM_SNIPPET",
      snippet,
      hideMode: getHideMode()
    });
    if (!response?.ok) {
      throw new Error(response?.error || "Failed to add snippet rule.");
    }
    await reloadRulesFromBackground();
    setStatus(`Snippet mapped to "${response.selector}" (${response.matched} match(es)).`, false);
    snippetInput.value = "";
  } catch (error) {
    setStatus(error.message, true);
  }
});

exportRulesBtn.addEventListener("click", async () => {
  try {
    const response = await chrome.runtime.sendMessage({ type: "EXPORT_RULES", origin: currentOrigin });
    if (!response?.ok) {
      throw new Error(response?.error || "Failed to export rules.");
    }
    const exportPayload = {
      quietviewVersion: QUIETVIEW.exportFormatVersion,
      origin: currentOrigin,
      exportedAt: new Date().toISOString(),
      rules: response.rules || []
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const filename = `${QUIETVIEW.exportPrefix}-${new URL(currentOrigin).hostname}.json`;
    await chrome.downloads.download({ url, filename, saveAs: true });
    setStatus("Rules exported.", false);
  } catch (error) {
    setStatus(error.message, true);
  }
});

importRulesBtn.addEventListener("click", () => {
  importRulesFile.click();
});

importRulesFile.addEventListener("change", async () => {
  const file = importRulesFile.files && importRulesFile.files[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rules = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.rules)
        ? parsed.rules
        : null;
    if (!rules) {
      throw new Error("Import file must contain a JSON array of rules or a { rules: [] } export.");
    }
    const response = await chrome.runtime.sendMessage({
      type: "IMPORT_RULES",
      origin: currentOrigin,
      rules
    });
    if (!response?.ok) {
      throw new Error(response?.error || "Failed to import rules.");
    }
    await reloadRulesFromBackground();
    setStatus(`Imported ${response.rules.length} rule(s).`, false);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    importRulesFile.value = "";
  }
});

(function setupBranding() {
  document.title = QUIETVIEW.name;
  const h1 = document.querySelector(".brand-text h1");
  const tagline = document.querySelector(".tagline");
  if (h1) {
    h1.textContent = QUIETVIEW.name;
  }
  if (tagline) {
    tagline.textContent = QUIETVIEW.tagline;
  }
  const privacyLink = document.getElementById("privacyLink");
  if (privacyLink && chrome.runtime?.getURL) {
    privacyLink.href = chrome.runtime.getURL("PRIVACY.md");
  }
})();

(async function init() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab || typeof tab.id !== "number") {
      throw new Error("Open a normal webpage tab to use this extension.");
    }
    activeTabId = tab.id;
    activeTabUrl = tab.url || "";
    if (!activeTabUrl || !/^https?:\/\//.test(activeTabUrl)) {
      throw new Error(`${QUIETVIEW.name} works on normal website tabs only.`);
    }
    currentOrigin = new URL(activeTabUrl).origin;
    await ensureDefaultWhatsAppRule();
    allRulesMap = await getAllRulesFromBackground();
    for (const origin of Object.keys(allRulesMap)) {
      if (origin !== currentOrigin) {
        collapsedGroups.add(origin);
      }
    }
    originLabel.textContent = currentOrigin;
    renderRules();
    const showedPickerStatus = await applyPickerStatusFromSession();
    if (!showedPickerStatus) {
      setStatus("Ready.", false);
    }
  } catch (error) {
    setStatus(error.message, true);
  }
})();
