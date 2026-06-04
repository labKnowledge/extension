(function initQuietViewSelector(global) {
  function isLikelyStableClass(name) {
    return /^[a-zA-Z][\w-]{1,60}$/.test(name) && !/^x[0-9a-z]{4,}$/i.test(name);
  }

  function cssEscape(value) {
    if (typeof CSS !== "undefined" && CSS.escape) {
      return CSS.escape(value);
    }
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function buildClassSelector(element, maxClasses) {
    const classes = Array.from(element.classList || []).filter(isLikelyStableClass).slice(0, maxClasses);
    if (!classes.length) {
      return "";
    }
    return `${element.tagName.toLowerCase()}.${classes.map(cssEscape).join(".")}`;
  }

  function buildFullClassSelector(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }
    const classes = Array.from(element.classList || []).map(cssEscape);
    if (!classes.length) {
      return "";
    }
    return `${element.tagName.toLowerCase()}.${classes.join(".")}`;
  }

  function nthAmongTagSiblings(element) {
    const parent = element.parentElement;
    if (!parent) {
      return 1;
    }
    const sameTag = Array.from(parent.children).filter((child) => child.tagName === element.tagName);
    const index = sameTag.indexOf(element);
    return index >= 0 ? index + 1 : 1;
  }

  function buildPathSelector(element, root) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const rootEl = root || (typeof document !== "undefined" ? document.documentElement : null);
    const ancestors = [];
    let current = element.parentElement;

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== rootEl) {
      const tag = current.tagName.toLowerCase();
      ancestors.unshift(`${tag}:nth-of-type(${nthAmongTagSiblings(current)})`);
      current = current.parentElement;
    }

    const leafTag = element.tagName.toLowerCase();
    const classes = Array.from(element.classList || []).map(cssEscape);
    const leaf =
      classes.length > 0
        ? `${leafTag}.${classes.join(".")}`
        : `${leafTag}:nth-of-type(${nthAmongTagSiblings(element)})`;

    if (ancestors.length === 0) {
      return leaf;
    }
    return `${ancestors.join(" > ")} > ${leaf}`;
  }

  function enumerateSelectorCandidates(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return [];
    }

    const candidates = [];

    if (element.id) {
      candidates.push(`#${cssEscape(element.id)}`);
    }

    const testId = element.getAttribute("data-testid");
    if (testId) {
      candidates.push(`[data-testid="${cssEscape(testId)}"]`);
    }

    const classThree = buildClassSelector(element, 3);
    if (classThree) {
      candidates.push(classThree);
    }

    const classTwo = buildClassSelector(element, 2);
    if (classTwo && classTwo !== classThree) {
      candidates.push(classTwo);
    }

    const fullClass = buildFullClassSelector(element);
    if (fullClass) {
      candidates.push(fullClass);
    }

    const tag = element.tagName.toLowerCase();
    const role = element.getAttribute("role");
    if (role) {
      candidates.push(`${tag}[role="${cssEscape(role)}"]`);
    }

    const pathSel = buildPathSelector(element);
    if (pathSel) {
      candidates.push(pathSel);
    }

    return Array.from(new Set(candidates)).filter(Boolean);
  }

  function countMatches(selector, rootDocument) {
    if (!selector) {
      return 0;
    }
    const root = rootDocument || (typeof document !== "undefined" ? document : null);
    if (!root || typeof root.querySelectorAll !== "function") {
      return 0;
    }
    try {
      return root.querySelectorAll(selector).length;
    } catch (_err) {
      return 0;
    }
  }

  function resolveUniqueSelector(element, rootDocument) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return { selector: "", matchCount: 0, ambiguous: true };
    }

    const candidates = enumerateSelectorCandidates(element);
    let best = "";
    let bestCount = Number.POSITIVE_INFINITY;

    for (const selector of candidates) {
      const count = countMatches(selector, rootDocument);
      if (count === 0) {
        continue;
      }
      if (count === 1) {
        return { selector, matchCount: 1, ambiguous: false };
      }
      if (count < bestCount) {
        best = selector;
        bestCount = count;
      }
    }

    if (!best) {
      return { selector: "", matchCount: 0, ambiguous: true };
    }

    return {
      selector: best,
      matchCount: bestCount,
      ambiguous: bestCount !== 1
    };
  }

  function generateSelectorFromElement(element, rootDocument) {
    const resolved = resolveUniqueSelector(element, rootDocument);
    return resolved.selector;
  }

  function candidateSelectorsFromSnippet(htmlSnippet) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlSnippet, "text/html");
    const first = doc.body.firstElementChild;
    if (!first) {
      return [];
    }
    return enumerateSelectorCandidates(first);
  }

  global.QuietViewSelector = {
    generateSelectorFromElement,
    candidateSelectorsFromSnippet,
    enumerateSelectorCandidates,
    resolveUniqueSelector,
    buildFullClassSelector,
    buildPathSelector
  };
})(window);
