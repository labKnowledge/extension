(function initQuietViewConstants(global) {
  const QUIETVIEW = {
    name: "QuietView",
    tagline: "Hide clutter. Keep your view quiet.",
    version: "1.0.0",
    exportPrefix: "quietview-rules",
    exportFormatVersion: 1,
    pickerStatusKey: "quietviewPickerStatus",
    storageKey: "quietViewRules",
    legacyStorageKey: "areaHiderRules",
    colors: {
      accent: "#2d8f8f",
      accentRgb: "45, 143, 143",
      pickerOutline: "#2d8f8f",
      toastOk: "#2d8f8f",
      toastError: "#b3261e",
      surface: "#f4f6f8",
      text: "#1e293b",
      textMuted: "#64748b"
    }
  };

  global.QUIETVIEW = QUIETVIEW;
})(typeof globalThis !== "undefined" ? globalThis : window);
