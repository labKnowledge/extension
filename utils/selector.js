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

  // Fully positional path: always unique on the current page, so it is the
  // last-resort candidate that keeps the picker from ever failing.
  function buildStrictPathSelector(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }
    const parts = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.documentElement) {
      if (current.id && /^[a-zA-Z][\w-]*$/.test(current.id)) {
        parts.unshift(`#${cssEscape(current.id)}`);
        break;
      }
      parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${nthAmongTagSiblings(current)})`);
      current = current.parentElement;
    }
    return parts.join(" > ");
  }

  // Human-readable name for a picked element, shown in the rules list.
  function describeElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }
    const clean = (text) => String(text || "").replace(/\s+/g, " ").trim().slice(0, 48);
    const attrLabel = clean(element.getAttribute("aria-label") || element.getAttribute("title"));
    if (attrLabel) {
      return attrLabel;
    }
    const heading = element.querySelector("h1, h2, h3, [role='heading']");
    const headingText = clean(heading && heading.textContent);
    if (headingText) {
      return headingText;
    }
    const tag = element.tagName.toLowerCase();
    const named = {
      nav: "Navigation",
      header: "Header",
      footer: "Footer",
      aside: "Sidebar",
      video: "Video",
      iframe: "Embedded frame",
      img: "Image",
      form: "Form",
      dialog: "Dialog"
    };
    const role = element.getAttribute("role");
    if (named[tag]) {
      return named[tag];
    }
    if (role) {
      return role.charAt(0).toUpperCase() + role.slice(1);
    }
    const text = clean(element.textContent);
    return text ? `“${text}”` : `${tag} element`;
  }

  // ---------------------------------------------------------------------
  // Fingerprints: a rule remembers *what* it hid, not just *where*, so it
  // can find the element again after the site changes its markup.
  // ---------------------------------------------------------------------

  function textAnchor(element) {
    return String(element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
  }

  function fingerprint(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    return {
      tag: element.tagName.toLowerCase(),
      id: element.id || "",
      testId: element.getAttribute("data-testid") || "",
      ariaLabel: element.getAttribute("aria-label") || "",
      role: element.getAttribute("role") || "",
      classes: Array.from(element.classList || []).filter(isLikelyStableClass).slice(0, 8),
      // Context for plain elements (a <p> or <div> with no attributes).
      parentClasses: Array.from(element.parentElement?.classList || []).filter(isLikelyStableClass).slice(0, 6),
      text: textAnchor(element)
    };
  }

  function scoreFingerprint(element, fp) {
    let score = 0;
    if (fp.id && element.id === fp.id) score += 5;
    if (fp.testId && element.getAttribute("data-testid") === fp.testId) score += 5;
    if (fp.ariaLabel && element.getAttribute("aria-label") === fp.ariaLabel) score += 4;
    if (fp.role && element.getAttribute("role") === fp.role) score += 1;
    if (fp.text && fp.text.length >= 8 && textAnchor(element) === fp.text) {
      score += fp.text.length >= 20 ? 4 : 3;
    }
    const overlap = (wanted, list) =>
      wanted && wanted.length ? wanted.filter((name) => list.contains(name)).length / wanted.length : 0;
    score += Math.round(overlap(fp.classes, element.classList) * 4);
    if (element.parentElement) {
      score += Math.round(overlap(fp.parentClasses, element.parentElement.classList) * 2);
    }
    return score;
  }

  const HEAL_MIN_SCORE = 6;
  const HEAL_MIN_MARGIN = 2;
  const HEAL_MAX_CANDIDATES = 4000;

  // Returns the single element that clearly matches the fingerprint, or null
  // when the evidence is weak or ambiguous (never guess: a wrong guess would
  // hide something the user wants to see).
  function findByFingerprint(fp, root) {
    if (!fp || !fp.tag) {
      return null;
    }
    const scope = root || document;
    const candidates = scope.getElementsByTagName(fp.tag);
    if (!candidates.length || candidates.length > HEAL_MAX_CANDIDATES) {
      return null;
    }
    let best = null;
    let bestScore = 0;
    let runnerUp = 0;
    for (const candidate of candidates) {
      const score = scoreFingerprint(candidate, fp);
      if (score > bestScore) {
        runnerUp = bestScore;
        bestScore = score;
        best = candidate;
      } else if (score > runnerUp) {
        runnerUp = score;
      }
    }
    if (bestScore >= HEAL_MIN_SCORE && bestScore - runnerUp >= HEAL_MIN_MARGIN) {
      return best;
    }
    return null;
  }

  // Selector for "everything like this one": same tag and stable classes.
  // Only offered when it matches a sensible handful of siblings-in-kind.
  function buildSimilarSelector(element) {
    const selector = buildClassSelector(element, 3);
    if (!selector) {
      return null;
    }
    const count = countMatches(selector);
    if (count < 2 || count > 300) {
      return null;
    }
    return { selector, count };
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

    // Landmark and media tags are usually unique and survive layout changes.
    const tagName = element.tagName.toLowerCase();
    if (/^(main|header|footer|nav|aside|article|video|canvas)$/.test(tagName)) {
      candidates.push(tagName);
    }

    // Accessible names are tied to meaning, so they survive redesigns better
    // than generated class names or DOM position.
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel && ariaLabel.length <= 80) {
      candidates.push(`${element.tagName.toLowerCase()}[aria-label="${ariaLabel.replace(/["\\]/g, "\\$&")}"]`);
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

    if (element.isConnected) {
      const strictPath = buildStrictPathSelector(element);
      if (strictPath) {
        candidates.push(strictPath);
      }
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
    buildPathSelector,
    buildStrictPathSelector,
    describeElement,
    fingerprint,
    findByFingerprint,
    buildSimilarSelector
  };
})(window);
