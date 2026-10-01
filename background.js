// Chrome runs this as a service worker; Firefox loads constants.js first via
// manifest background.scripts, where importScripts does not exist.
if (typeof QUIETVIEW === "undefined" && typeof importScripts === "function") {
  importScripts("utils/constants.js");
}

const STORAGE_KEY = QUIETVIEW.storageKey;
const LEGACY_STORAGE_KEY = QUIETVIEW.legacyStorageKey;

async function migrateLegacyStorage() {
  const result = await chrome.storage.local.get([STORAGE_KEY, LEGACY_STORAGE_KEY]);
  if (result[LEGACY_STORAGE_KEY] && !result[STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: result[LEGACY_STORAGE_KEY] });
    await chrome.storage.local.remove(LEGACY_STORAGE_KEY);
  }
}

migrateLegacyStorage().catch(() => {});

function normalizeRule(rule) {
  const now = Date.now();
  const hideMode = ["visibilityHidden", "blur"].includes(rule.hideMode) ? rule.hideMode : "displayNone";
  return {
    id: rule.id || crypto.randomUUID(),
    origin: rule.origin,
    selector: rule.selector,
    label: typeof rule.label === "string" ? rule.label.slice(0, 80) : "",
    fingerprint: rule.fingerprint && typeof rule.fingerprint === "object" ? rule.fingerprint : null,
    recipeId: typeof rule.recipeId === "string" ? rule.recipeId : null,
    sourceType: rule.sourceType || "selector",
    enabled: typeof rule.enabled === "boolean" ? rule.enabled : true,
    hideMode,
    healedAt: rule.healedAt || null,
    createdAt: rule.createdAt || now,
    updatedAt: now
  };
}

async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || typeof tab.id !== "number") {
    return null;
  }
  return tab.id;
}

async function getRuleMap() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || {};
}

async function setRuleMap(ruleMap) {
  await chrome.storage.local.set({ [STORAGE_KEY]: ruleMap });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (!message || !message.type) {
      sendResponse({ ok: false, error: "Invalid message." });
      return;
    }

    if (message.type === "GET_RULES") {
      const ruleMap = await getRuleMap();
      sendResponse({ ok: true, rules: ruleMap[message.origin] || [] });
      return;
    }

    if (message.type === "GET_ALL_RULES") {
      const ruleMap = await getRuleMap();
      sendResponse({ ok: true, ruleMap });
      return;
    }

    if (message.type === "UPSERT_RULE") {
      const incoming = normalizeRule(message.rule || {});
      if (!incoming.origin || !incoming.selector) {
        sendResponse({ ok: false, error: "Rule requires origin and selector." });
        return;
      }

      const ruleMap = await getRuleMap();
      const rules = ruleMap[incoming.origin] || [];
      const idx = rules.findIndex((r) => r.id === incoming.id);
      if (idx >= 0) {
        rules[idx] = { ...rules[idx], ...incoming, updatedAt: Date.now() };
      } else {
        rules.push(incoming);
      }

      ruleMap[incoming.origin] = rules;
      await setRuleMap(ruleMap);
      sendResponse({ ok: true, rule: incoming, rules });
      return;
    }

    if (message.type === "DELETE_RULE") {
      const { origin, id } = message;
      const ruleMap = await getRuleMap();
      const rules = (ruleMap[origin] || []).filter((r) => r.id !== id);
      ruleMap[origin] = rules;
      await setRuleMap(ruleMap);
      sendResponse({ ok: true, rules });
      return;
    }

    if (message.type === "TOGGLE_RULE") {
      const { origin, id, enabled } = message;
      const ruleMap = await getRuleMap();
      const rules = (ruleMap[origin] || []).map((rule) =>
        rule.id === id ? { ...rule, enabled: Boolean(enabled), updatedAt: Date.now() } : rule
      );
      ruleMap[origin] = rules;
      await setRuleMap(ruleMap);
      sendResponse({ ok: true, rules });
      return;
    }

    if (message.type === "EXPORT_ALL") {
      const ruleMap = await getRuleMap();
      sendResponse({ ok: true, ruleMap });
      return;
    }

    if (message.type === "IMPORT_RULES") {
      // Accepts { origin: rules[] } maps. Merges into existing rules (never
      // replaces), skipping selectors the site already has.
      const incoming = message.ruleMap;
      if (!incoming || typeof incoming !== "object") {
        sendResponse({ ok: false, error: "Nothing to import." });
        return;
      }

      const ruleMap = await getRuleMap();
      let added = 0;
      for (const [origin, rules] of Object.entries(incoming)) {
        if (!/^https?:\/\//.test(origin) || !Array.isArray(rules)) {
          continue;
        }
        const existing = ruleMap[origin] || [];
        const known = new Set(existing.map((rule) => rule.selector));
        for (const rule of rules) {
          if (!rule || typeof rule.selector !== "string" || known.has(rule.selector)) {
            continue;
          }
          known.add(rule.selector);
          existing.push(normalizeRule({ ...rule, id: undefined, origin }));
          added += 1;
        }
        ruleMap[origin] = existing;
      }
      await setRuleMap(ruleMap);
      sendResponse({ ok: true, added });
      return;
    }

    if (message.type === "CAPTURE_TAB") {
      // captureVisibleTab grabs whatever tab is showing; never capture a tab
      // other than the one that asked.
      const tab = sender.tab;
      if (!tab) {
        sendResponse({ ok: false, error: "Screenshots work from a page tab." });
        return;
      }
      if (!tab.active) {
        await chrome.tabs.update(tab.id, { active: true });
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      const [shown] = await chrome.tabs.query({ active: true, windowId: tab.windowId });
      if (!shown || shown.id !== tab.id) {
        sendResponse({ ok: false, error: "Switch to this tab, then take the screenshot again." });
        return;
      }
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
      const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
      const host = String(message.host || "page").replace(/[^a-z0-9.-]/gi, "");
      // Service workers (Chrome) can download data: URLs; Firefox's
      // background page needs a blob URL instead.
      let url = dataUrl;
      if (typeof URL.createObjectURL === "function") {
        url = URL.createObjectURL(await (await fetch(dataUrl)).blob());
      }
      await chrome.downloads.download({ url, filename: `quietview-${host}-${stamp}.png`, saveAs: false });
      sendResponse({ ok: true, dataUrl });
      return;
    }

    if (message.type === "SET_BADGE") {
      const tabId = sender.tab?.id;
      if (tabId != null) {
        const text = message.count > 0 ? String(Math.min(message.count, 999)) : "";
        await chrome.action.setBadgeText({ tabId, text });
      }
      sendResponse({ ok: true });
      return;
    }

    sendResponse({ ok: false, error: `Unknown message type: ${message.type}` });
  })().catch((error) => {
    sendResponse({ ok: false, error: error.message || "Unexpected error." });
  });

  return true;
});

const COMMAND_INTENTS = {
  "start-picker": "hide",
  "focus-element": "focus",
  "redact-mode": "redact"
};

async function sendToTab(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (_error) {
    // Tab was open before install/update: inject, then retry once.
    await chrome.scripting.executeScript({
      target: { tabId },
      files: QUIETVIEW.contentScripts
    });
    return chrome.tabs.sendMessage(tabId, message);
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  const intent = COMMAND_INTENTS[command];
  if (!intent) {
    return;
  }
  const tabId = await getActiveTabId();
  if (tabId == null) {
    return;
  }
  try {
    await sendToTab(tabId, intent === "redact" ? { type: "START_REDACT" } : { type: "START_PICKER", intent });
  } catch (_error) {
    // Restricted page (browser settings, store pages): nothing to pick.
  }
});

// Right-click → act on exactly the element under the cursor, no picker.
const CONTEXT_MENUS = [
  { id: "quietview-hide", title: "Hide this element", intent: "hide" },
  { id: "quietview-focus", title: "Focus on this element", intent: "focus" },
  { id: "quietview-redact", title: "Redact this element", intent: "redact" }
];

chrome.runtime.onInstalled.addListener((details) => {
  chrome.contextMenus.removeAll(() => {
    for (const menu of CONTEXT_MENUS) {
      chrome.contextMenus.create({
        id: menu.id,
        title: menu.title,
        contexts: ["page", "selection", "link", "image", "video", "frame"],
        documentUrlPatterns: ["http://*/*", "https://*/*"]
      });
    }
  });
  chrome.action.setBadgeBackgroundColor({ color: QUIETVIEW.colors.accent }).catch(() => {});

  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const menu = CONTEXT_MENUS.find((entry) => entry.id === info.menuItemId);
  if (!menu || !tab || typeof tab.id !== "number") {
    return;
  }
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "CONTEXT_ACTION", intent: menu.intent }, { frameId: 0 });
  } catch (_error) {
    // Page loaded before install: the next right-click after a reload works.
  }
});
