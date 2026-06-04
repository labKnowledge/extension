importScripts("utils/constants.js");

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

    if (message.type === "EXPORT_RULES") {
      const ruleMap = await getRuleMap();
      const origin = message.origin;
      sendResponse({
        ok: true,
        rules: ruleMap[origin] || [],
        export: {
          quietviewVersion: QUIETVIEW.exportFormatVersion,
          origin,
          exportedAt: new Date().toISOString(),
          rules: ruleMap[origin] || []
        }
      });
      return;
    }

    if (message.type === "IMPORT_RULES") {
      const { origin, rules } = message;
      if (!origin || !Array.isArray(rules)) {
        sendResponse({ ok: false, error: "Import requires origin and rules array." });
        return;
      }

      const ruleMap = await getRuleMap();
      const normalized = rules
        .filter((rule) => rule && typeof rule.selector === "string")
        .map((rule) => normalizeRule({ ...rule, origin }));
      ruleMap[origin] = normalized;
      await setRuleMap(ruleMap);
      sendResponse({ ok: true, rules: normalized });
      return;
    }

    sendResponse({ ok: false, error: `Unknown message type: ${message.type}` });
  })().catch((error) => {
    sendResponse({ ok: false, error: error.message || "Unexpected error." });
  });

  return true;
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "start-picker") {
    return;
  }
  const tabId = await getActiveTabId();
  if (tabId == null) {
    return;
  }
  try {
    await chrome.tabs.sendMessage(tabId, { type: "START_PICKER" });
  } catch (_error) {
    // Ignore if active tab has no content script context.
  }
});
