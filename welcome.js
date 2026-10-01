// Welcome page: runs the real picker (content.js is loaded on this page) on
// a built-in demo, so a new user's first success happens immediately.

const demoOrigin = location.origin;

// Every visit starts with a fresh demo.
async function resetDemo() {
  const { rules = [] } = (await chrome.runtime.sendMessage({ type: "GET_RULES", origin: demoOrigin })) || {};
  for (const rule of rules) {
    await chrome.runtime.sendMessage({ type: "DELETE_RULE", origin: demoOrigin, id: rule.id });
  }
  await refreshRules();
}

function markDone(step) {
  const el = document.querySelector(`[data-step="${step}"]`);
  if (el && !el.classList.contains("is-done")) {
    el.classList.add("is-done");
    el.querySelector(".done").hidden = false;
  }
}

// Watch the demo for the outcome rather than the click, so the step only
// completes when the user actually hid or focused something.
function watchProgress() {
  const check = () => {
    if (document.querySelector(".demo [data-quietview-hide]")) {
      markDone("hide");
    }
    if (document.querySelector("[data-quietview-focus]")) {
      markDone("focus");
    }
  };
  new MutationObserver(check).observe(document.body, { attributes: true, subtree: true, childList: true });
}

async function showShortcuts() {
  try {
    const commands = await chrome.commands.getAll();
    const byName = Object.fromEntries(commands.map((command) => [command.name, command.shortcut]));
    if (byName["start-picker"]) document.getElementById("hideKey").textContent = byName["start-picker"];
    if (byName["focus-element"]) document.getElementById("focusKey").textContent = byName["focus-element"];
  } catch (_err) {
    // Defaults in the markup are fine.
  }
}

document.getElementById("tryHide").addEventListener("click", () => startPicker("hide"));
document.getElementById("tryFocus").addEventListener("click", () => startPicker("focus"));

resetDemo().catch(() => {});
watchProgress();
showShortcuts();
