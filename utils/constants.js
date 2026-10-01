(function initQuietViewConstants(global) {
  const QUIETVIEW = {
    name: "QuietView",
    tagline: "Hide what distracts you. Focus on what matters.",
    version: "1.1.0",
    exportPrefix: "quietview-rules",
    exportFormatVersion: 2,
    prefsKey: "quietViewPrefs",
    seedKey: "quietViewSeeded",
    statsKey: "quietViewStats",
    firefoxId: "quietview@eligapris.com",
    contentScripts: ["utils/constants.js", "utils/selector.js", "utils/focus.js", "content.js"],
    storageKey: "quietViewRules",
    legacyStorageKey: "areaHiderRules",
    publisher: {
      name: "Eligapris",
      homepage: "https://eligapris.com",
      productUrl: "https://eligapris.com/quietview",
      privacyUrl: "https://eligapris.com/quietview/privacy",
      supportEmail: "support@eligapris.com"
    },
    colors: {
      accent: "#2d8f8f",
      accentRgb: "45, 143, 143",
      accentLight: "#7fdede",
      pickerOutline: "#2d8f8f",
      focusOutline: "#7c5cff",
      toastBg: "#1f2937",
      toastError: "#b3261e",
      surface: "#f4f6f8",
      text: "#1e293b",
      textMuted: "#64748b"
    }
  };

  global.QUIETVIEW = QUIETVIEW;
})(typeof globalThis !== "undefined" ? globalThis : window);
