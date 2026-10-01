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
  return {
    id: rule.id || crypto.randomUUID(),
    origin: rule.origin,
    selector: rule.selector,
    label: typeof rule.label === "string" ? rule.label.slice(0, 80) : "",
    sourceType: rule.sourceType || "selector",
    enabled: typeof rule.enabled === "boolean" ? rule.enabled : true,
    hideMode: rule.hideMode === "visibilityHidden" ? "visibilityHidden" : "displayNone",
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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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

    sendResponse({ ok: false, error: `Unknown message type: ${message.type}` });
  })().catch((error) => {
    sendResponse({ ok: false, error: error.message || "Unexpected error." });
  });

  return true;
});

const COMMAND_INTENTS = {
  "start-picker": "hide",
  "focus-element": "focus"
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
    await sendToTab(tabId, { type: "START_PICKER", intent });
  } catch (_error) {
    // Restricted page (browser settings, store pages): nothing to pick.
  }
});
