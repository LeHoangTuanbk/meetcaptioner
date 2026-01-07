/**
 * MeetCaptioner - Floating Caption Overlay with Real-time Translation
 * Displays captions directly on Google Meet with LLM-powered translation
 */
(function () {
  "use strict";

  if (window.__meetCaptionerInjected) return;
  window.__meetCaptionerInjected = true;

  console.log("[MeetCaptioner] Starting...");

  // ============ Constants ============
  const MAX_CAPTIONS = 50;
  const SEMANTIC_DELAY = 1500; // ms to wait before semantic translation

  const LANGUAGES = [
    { code: "vi", name: "Vietnamese" },
    { code: "en", name: "English" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
    { code: "it", name: "Italian" },
    { code: "th", name: "Thai" },
    { code: "id", name: "Indonesian" },
    { code: "nl", name: "Dutch" },
    { code: "pl", name: "Polish" },
    { code: "tr", name: "Turkish" },
  ];

  const MODELS = {
    anthropic: [
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5 (Fastest)" },
      { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
      { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5" },
    ],
    openai: [
      { id: "gpt-4.1-nano", name: "GPT-4.1 Nano (Fastest)" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
      { id: "gpt-5-nano", name: "GPT-5 Nano" },
    ],
  };

  // ============ State ============
  const captions = [];
  let overlay = null;
  let captionList = null;
  let isMinimized = false;
  let requestIdCounter = 0;
  const pendingRequests = new Map();

  // Default custom prompt for new users
  const DEFAULT_CUSTOM_PROMPT =
    "Translate naturally and smoothly. Keep technical terms and abbreviations as-is (API, ML, etc). Use appropriate formality for business context.";

  // Settings (loaded from storage)
  let settings = {
    provider: "openai",
    anthropicApiKey: "",
    openaiApiKey: "",
    model: "gpt-4.1-nano",
    targetLanguage: "en",
    translationEnabled: false,
    customPrompt: DEFAULT_CUSTOM_PROMPT,
  };

  // Translation debounce timers per caption
  const semanticTimers = new Map();

  // Track if CC is enabled (caption region detected)
  let isCCEnabled = false;

  // Wave indicator state
  let waveElement = null;
  let waveTimeout = null;

  function setWaveActive(active) {
    if (!waveElement) return;
    if (active) {
      waveElement.classList.add("mc-active");
      // Auto-deactivate after 3s of no new captions
      clearTimeout(waveTimeout);
      waveTimeout = setTimeout(() => {
        waveElement.classList.remove("mc-active");
      }, 3000);
    } else {
      waveElement.classList.remove("mc-active");
      clearTimeout(waveTimeout);
    }
  }

  // ============ Message Bridge ============
  function sendMessage(type, payload) {
    return new Promise((resolve, reject) => {
      const requestId = ++requestIdCounter;
      pendingRequests.set(requestId, { resolve, reject });

      window.postMessage(
        {
          source: "meetcaptioner",
          type,
          payload,
          requestId,
        },
        "*"
      );

      // Timeout after 30s
      setTimeout(() => {
        if (pendingRequests.has(requestId)) {
          pendingRequests.delete(requestId);
          reject(new Error("Request timeout"));
        }
      }, 30000);
    });
  }

  // Listen for responses from content script
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data?.source !== "meetcaptioner-response") return;

    const { requestId, response } = event.data;
    const pending = pendingRequests.get(requestId);
    if (pending) {
      pendingRequests.delete(requestId);
      pending.resolve(response);
    }
  });

  // ============ Settings ============
  async function loadSettings() {
    try {
      const response = await sendMessage("GET_SETTINGS", {});
      if (response?.success && response.settings) {
        const saved = response.settings;
        settings = { ...settings, ...saved };
        // Only use default customPrompt if key doesn't exist (new user)
        // If user explicitly cleared it (empty string), keep it empty
        if (saved.customPrompt !== undefined) {
          settings.customPrompt = saved.customPrompt;
        }
        updateUIFromSettings();
      }
    } catch (e) {
      console.debug("[MeetCaptioner] Could not load settings:", e);
    }
  }

  async function saveSettings(newSettings) {
    console.log("[MeetCaptioner] saveSettings called with:", {
      ...newSettings,
      apiKey: newSettings.apiKey ? "***" : undefined,
    });
    settings = { ...settings, ...newSettings };
    console.log("[MeetCaptioner] Updated local settings:", {
      ...settings,
      apiKey: settings.apiKey ? "***" : "(empty)",
    });
    try {
      const response = await sendMessage("SAVE_SETTINGS", settings);
      console.log("[MeetCaptioner] SAVE_SETTINGS response:", response);
    } catch (e) {
      console.error("[MeetCaptioner] Could not save settings:", e);
    }
    updateUIFromSettings();
  }

  function updateUIFromSettings() {
    // Update language selector
    const langSelect = document.getElementById("mc-lang-select");
    if (langSelect) langSelect.value = settings.targetLanguage;

    // Update translation toggle
    const translateToggle = document.getElementById("mc-translate-toggle");
    if (translateToggle) {
      translateToggle.classList.toggle(
        "mc-active",
        settings.translationEnabled
      );
      translateToggle.setAttribute(
        "data-tooltip",
        settings.translationEnabled ? "Translation ON" : "Translation OFF"
      );
    }

    // Toggle single/dual column mode
    if (overlay) {
      overlay.classList.toggle("translation-off", !settings.translationEnabled);
    }
  }

  // ============ Translation ============
  async function translateCaption(
    captionObj,
    mode = "optimistic",
    force = false
  ) {
    const apiKey =
      settings.provider === "anthropic"
        ? settings.anthropicApiKey
        : settings.openaiApiKey;

    console.log("[MeetCaptioner] translateCaption called, settings:", {
      translationEnabled: settings.translationEnabled,
      hasApiKey: !!apiKey,
      provider: settings.provider,
      model: settings.model,
      force,
    });

    // Skip if not enabled (unless forced by manual translate)
    if (!force && !settings.translationEnabled) {
      console.log("[MeetCaptioner] Translation skipped - not enabled");
      return;
    }

    if (!apiKey) {
      console.log(
        "[MeetCaptioner] Translation skipped - no API key for",
        settings.provider
      );
      captionObj.translationStatus = "error";
      captionObj.translationError = "No API key configured";
      updateCaptionTranslation(captionObj);
      return;
    }

    // Build context with user-edited translations for better accuracy
    let context = undefined;
    if (mode === "semantic") {
      const recentCaptions = captions.slice(-5);
      const contextParts = recentCaptions.map((c) => {
        if (c.userEdited && c.translation) {
          return `"${c.text}" = "${c.translation}"`;
        }
        return c.text;
      });
      context = contextParts.join(" | ");
    }

    try {
      captionObj.translationStatus =
        mode === "optimistic" ? "translating" : "refining";
      updateCaptionTranslation(captionObj);

      console.log("[MeetCaptioner] Sending TRANSLATE message...");
      const response = await sendMessage("TRANSLATE", {
        id: captionObj.id,
        text: captionObj.text,
        targetLang: settings.targetLanguage,
        mode,
        context,
        customPrompt: settings.customPrompt,
      });
      console.log("[MeetCaptioner] TRANSLATE response:", response);

      if (response?.success) {
        captionObj.translation = response.translation;
        captionObj.translationStatus = mode;
        updateCaptionTranslation(captionObj);
      } else {
        captionObj.translationStatus = "error";
        captionObj.translationError = response?.error || "Translation failed";
        updateCaptionTranslation(captionObj);
      }
    } catch (e) {
      console.error("[MeetCaptioner] Translation exception:", e);
      captionObj.translationStatus = "error";
      captionObj.translationError = String(e);
      updateCaptionTranslation(captionObj);
    }
  }

  function scheduleSemanticTranslation(captionObj) {
    // Clear existing timer for this caption
    if (semanticTimers.has(captionObj.id)) {
      clearTimeout(semanticTimers.get(captionObj.id));
    }

    // Schedule semantic translation after delay
    const timer = setTimeout(() => {
      semanticTimers.delete(captionObj.id);
      if (captionObj.translationStatus !== "semantic") {
        translateCaption(captionObj, "semantic");
      }
    }, SEMANTIC_DELAY);

    semanticTimers.set(captionObj.id, timer);
  }

  function updateCaptionTranslation(captionObj) {
    const captionEl = document.querySelector(
      `[data-caption-id="${captionObj.id}"]`
    );
    if (!captionEl) return;

    let wrapper = captionEl.querySelector(".mc-translation-wrapper");
    let transEl = captionEl.querySelector(".mc-translation");
    let reloadBtn = captionEl.querySelector(".mc-reload-action");

    // Create wrapper if not exists
    if (!wrapper) {
      wrapper = createElement("div", { className: "mc-translation-wrapper" });
      const originalEl = captionEl.querySelector(".mc-original");
      if (originalEl && originalEl.parentNode) {
        originalEl.parentNode.appendChild(wrapper);
      }
    }

    // Create translation element if not exists
    if (!transEl) {
      transEl = createElement("div", {
        className: "mc-translation",
        onClick: () => startEditTranslation(captionObj),
        "data-tooltip": "Click to edit",
      });
      wrapper.appendChild(transEl);
    }

    // Update translation content
    // Keep existing translation visible while loading new one
    if (captionObj.translationStatus === "translating") {
      if (captionObj.translation) {
        // Keep existing translation, add indicator
        transEl.textContent = captionObj.translation + " ...";
        transEl.className = "mc-translation mc-translating";
      } else {
        transEl.textContent = "...";
        transEl.className = "mc-translation mc-translating";
      }
    } else if (captionObj.translationStatus === "refining") {
      transEl.textContent = captionObj.translation
        ? captionObj.translation + " ↻"
        : "...";
      transEl.className = "mc-translation mc-refining";
    } else if (captionObj.translationStatus === "error") {
      // Keep existing translation visible on error
      if (captionObj.translation) {
        transEl.textContent = captionObj.translation + " ⚠";
        transEl.setAttribute(
          "data-tooltip",
          captionObj.translationError || "Error"
        );
      } else {
        transEl.textContent = "⚠ " + (captionObj.translationError || "Error");
      }
      transEl.className = "mc-translation mc-error";
    } else if (captionObj.translation) {
      transEl.textContent = captionObj.translation;
      transEl.className = "mc-translation";
      transEl.setAttribute("data-tooltip", "Click to edit");
    } else {
      transEl.textContent = "";
      transEl.className = "mc-translation";
    }

    // Add/update reload button if translation exists
    if (
      captionObj.translation &&
      captionObj.translationStatus !== "translating" &&
      captionObj.translationStatus !== "refining"
    ) {
      if (!reloadBtn) {
        reloadBtn = createElement("button", {
          className: "mc-action-btn mc-reload-action",
          "data-tooltip": "Re-translate",
          textContent: "↻",
          onClick: (e) => {
            e.stopPropagation();
            retranslateCaption(captionObj);
          },
        });
        wrapper.appendChild(reloadBtn);
      }
    } else if (reloadBtn) {
      reloadBtn.remove();
    }
  }

  // Start editing translation
  function startEditTranslation(captionObj) {
    const captionEl = document.querySelector(
      `[data-caption-id="${captionObj.id}"]`
    );
    if (!captionEl) return;

    const transEl = captionEl.querySelector(".mc-translation");
    if (
      !transEl ||
      transEl.classList.contains("mc-translating") ||
      transEl.classList.contains("mc-refining")
    )
      return;

    const currentText = captionObj.translation || "";
    const input = createElement("textarea", {
      className: "mc-translation-edit",
      value: currentText,
    });
    input.rows = 2;

    // Save on blur or Enter
    const saveEdit = () => {
      const newText = input.value.trim();
      if (newText !== currentText) {
        captionObj.translation = newText;
        captionObj.userEdited = true; // Mark as user edited for context
      }
      // Restore translation display
      updateCaptionTranslation(captionObj);
    };

    input.addEventListener("blur", saveEdit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        input.blur();
      }
      if (e.key === "Escape") {
        input.value = currentText;
        input.blur();
      }
    });

    transEl.textContent = "";
    transEl.appendChild(input);
    input.focus();
    input.select();
  }

  // Re-translate a caption
  function retranslateCaption(captionObj) {
    captionObj.translation = "";
    captionObj.translationStatus = "pending";
    captionObj.lastTranslatedLength = 0;
    translateCaption(captionObj, "semantic");
  }

  // Manual translate for a caption (bypasses translationEnabled check)
  function manualTranslate(captionObj) {
    translateCaption(captionObj, "semantic", true); // force = true
  }

  // ============ Helper ============
  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === "className") {
        el.className = value;
      } else if (key === "textContent") {
        el.textContent = value;
      } else if (key === "value") {
        // For input/textarea, set value property directly
        el.value = value;
      } else if (key.toLowerCase().startsWith("on")) {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    }
    children.forEach((child) => {
      if (typeof child === "string") {
        el.appendChild(document.createTextNode(child));
      } else if (child) {
        el.appendChild(child);
      }
    });
    return el;
  }

  // ============ Export Functions ============
  function exportToFile(content, filename) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function formatCaptionsOnly() {
    if (captions.length === 0) return "";
    const lines = captions.map((c) => `[${c.time}] ${c.speaker}: ${c.text}`);
    return lines.join("\n");
  }

  function formatTranslationsOnly() {
    if (captions.length === 0) return "";
    const lines = captions
      .filter((c) => c.translation)
      .map((c) => `[${c.time}] ${c.speaker}: ${c.translation}`);
    return lines.join("\n");
  }

  function formatBoth() {
    if (captions.length === 0) return "";
    const lines = captions.map((c) => {
      let line = `[${c.time}] ${c.speaker}:\n  Original: ${c.text}`;
      if (c.translation) {
        line += `\n  Translation: ${c.translation}`;
      }
      return line;
    });
    return lines.join("\n\n");
  }

  function exportCaptions(type) {
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:-]/g, "");
    let content, filename;

    switch (type) {
      case "captions":
        content = formatCaptionsOnly();
        filename = `captions_${timestamp}.txt`;
        break;
      case "translations":
        content = formatTranslationsOnly();
        filename = `translations_${timestamp}.txt`;
        break;
      case "both":
        content = formatBoth();
        filename = `captions_translations_${timestamp}.txt`;
        break;
      default:
        return;
    }

    if (!content) {
      console.log("[MeetCaptioner] No content to export");
      return;
    }

    exportToFile(content, filename);
  }

  // ============ UI: Create Overlay ============
  function createOverlay() {
    if (overlay) return;

    const styles = document.createElement("style");
    styles.textContent = `
      #meetcaptioner-overlay {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 480px;
        height: 400px;
        background: #1a1a2e;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-width: 520px;
        min-height: 200px;
      }
      #meetcaptioner-overlay.minimized {
        height: auto !important;
        width: auto !important;
        min-width: 0 !important;
        min-height: 0 !important;
      }
      #meetcaptioner-overlay.minimized .mc-content,
      #meetcaptioner-overlay.minimized .mc-resize-br,
      #meetcaptioner-overlay.minimized .mc-resize-bl,
      #meetcaptioner-overlay.minimized .mc-resize-b,
      #meetcaptioner-overlay.minimized .mc-header-left,
      #meetcaptioner-overlay.minimized .mc-header-right,
      #meetcaptioner-overlay.minimized .mc-header-translation,
      #meetcaptioner-overlay.minimized .mc-lang-select {
        display: none !important;
      }
      #meetcaptioner-overlay.minimized .mc-header {
        padding: 8px 12px;
        gap: 8px;
        border-radius: 12px;
      }
      #meetcaptioner-overlay.minimized .mc-minimized-controls {
        display: flex !important;
      }
      /* Tooltip above when minimized - align to right edge */
      #meetcaptioner-overlay.minimized [data-tooltip]::after {
        top: auto;
        bottom: 100%;
        left: auto;
        right: 0;
        transform: translateY(-4px);
      }
      /* Wave animation indicator */
      .mc-wave {
        display: flex;
        align-items: center;
        gap: 2px;
        height: 16px;
      }
      .mc-wave-bar {
        width: 3px;
        height: 6px;
        background: rgba(255,255,255,0.3);
        border-radius: 2px;
        transition: background 0.3s;
      }
      .mc-wave.mc-active .mc-wave-bar {
        background: #4ade80;
        animation: mcWave 1s ease-in-out infinite;
      }
      .mc-wave.mc-active .mc-wave-bar:nth-child(1) { animation-delay: 0s; }
      .mc-wave.mc-active .mc-wave-bar:nth-child(2) { animation-delay: 0.15s; }
      .mc-wave.mc-active .mc-wave-bar:nth-child(3) { animation-delay: 0.3s; }
      @keyframes mcWave {
        0%, 100% { height: 4px; }
        50% { height: 14px; }
      }
      .mc-minimized-controls {
        display: none;
        align-items: center;
        gap: 8px;
      }
      .mc-minimized-controls .mc-btn {
        width: 28px;
        height: 28px;
      }
      .mc-header {
        display: flex;
        align-items: center;
        padding: 10px 14px;
        background: #252540;
        cursor: grab;
        user-select: none;
        flex-shrink: 0;
        border-radius: 12px 12px 0 0;
        gap: 12px;
      }
      .mc-header:active { cursor: grabbing; }
      .mc-title {
        color: #fff;
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
      }
      .mc-header-left {
        display: flex;
        align-items: center;
        flex: 1;
      }
      .mc-header-right {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        flex: 1;
      }
      .mc-header-translation {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .mc-header-mini {
        display: flex;
        align-items: center;
        gap: 2px;
        opacity: 0.5;
        transition: opacity 0.2s;
      }
      .mc-header-mini:hover {
        opacity: 1;
      }
      .mc-header-mini .mc-btn {
        width: 26px;
        height: 26px;
        font-size: 14px;
      }
      .mc-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.6;
        transition: all 0.2s;
        color: #fff;
        border-radius: 8px;
        flex-shrink: 0;
      }
      .mc-btn:hover {
        opacity: 1;
        background: rgba(255,255,255,0.1);
      }
      /* Custom Tooltip - instant, no delay */
      [data-tooltip] {
        position: relative;
      }
      [data-tooltip]::after {
        content: attr(data-tooltip);
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(4px);
        background: rgba(0,0,0,0.9);
        color: #fff;
        font-size: 11px;
        font-weight: 400;
        padding: 4px 8px;
        border-radius: 4px;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.15s, visibility 0.15s;
        pointer-events: none;
        z-index: 10000;
      }
      [data-tooltip]:hover::after {
        opacity: 1;
        visibility: visible;
      }
      .mc-lang-select {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        color: #fff;
        font-size: 12px;
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
        outline: none;
        min-width: 100px;
        transition: all 0.4s ease;
        transform-origin: right center;
      }
      .mc-lang-select:hover {
        background: rgba(255,255,255,0.12);
        border-color: rgba(255,255,255,0.25);
      }
      .mc-lang-select option { background: #252540; color: #fff; }
      /* Translation Toggle */
      .mc-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .mc-toggle:hover {
        background: rgba(255,255,255,0.1);
      }
      .mc-toggle-switch {
        width: 36px;
        height: 20px;
        background: rgba(255,255,255,0.2);
        border-radius: 10px;
        position: relative;
        transition: all 0.2s;
      }
      .mc-toggle-switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        background: #fff;
        border-radius: 50%;
        transition: all 0.2s;
      }
      .mc-toggle.mc-active .mc-toggle-switch {
        background: #10b981;
      }
      .mc-toggle.mc-active .mc-toggle-switch::after {
        left: 18px;
      }
      .mc-content {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        min-height: 0;
        user-select: text;
        cursor: text;
      }
      .mc-content *::selection {
        background: rgba(255, 255, 255, 0.85) !important;
        color: #1a1a2e !important;
      }
      .mc-content::-webkit-scrollbar { width: 4px; }
      .mc-content::-webkit-scrollbar-track { background: transparent; }
      .mc-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 2px;
      }
      .mc-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .mc-caption {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .mc-caption:last-child { border-bottom: none; }
      .mc-caption.mc-new { animation: mcFadeIn 0.2s ease; }
      @keyframes mcFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .mc-speaker {
        color: #4ade80;
        font-size: 11px;
        font-weight: 600;
      }
      .mc-caption-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      /* Single column mode when translation is OFF */
      #meetcaptioner-overlay.translation-off .mc-caption-content {
        grid-template-columns: 1fr;
      }
      #meetcaptioner-overlay.translation-off .mc-translation-wrapper,
      #meetcaptioner-overlay.translation-off .mc-translate-action {
        display: none !important;
      }
      #meetcaptioner-overlay.translation-off .mc-lang-select {
        opacity: 0;
        transform: scale(0.9);
        pointer-events: none;
        width: 0;
        min-width: 0;
        padding: 0;
        margin: 0;
        border: none;
      }
      .mc-original {
        color: #e4e4e7;
        font-size: 13px;
        line-height: 1.45;
      }
      .mc-translation {
        color: #60a5fa;
        font-size: 13px;
        line-height: 1.45;
        font-style: italic;
      }
      .mc-translation.mc-translating {
        color: #6b7280;
        animation: mcPulse 1s infinite;
      }
      .mc-translation.mc-refining { color: #a78bfa; }
      .mc-translation.mc-error { color: #f87171; font-style: normal; }
      @keyframes mcPulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      .mc-time {
        color: #6b7280;
        font-size: 10px;
      }
      .mc-empty {
        color: #6b7280;
        text-align: center;
        padding: 32px 16px;
        font-size: 12px;
        line-height: 1.5;
      }
      .mc-resize {
        position: absolute;
        bottom: 4px;
        width: 16px;
        height: 16px;
        opacity: 0.4;
        transition: opacity 0.2s;
      }
      .mc-resize:hover { opacity: 0.9; }
      .mc-resize-br { right: 4px; cursor: nwse-resize; }
      .mc-resize-bl { left: 4px; cursor: nesw-resize; }
      .mc-resize::before, .mc-resize::after {
        content: '';
        position: absolute;
        background: rgba(255,255,255,0.5);
        border-radius: 1px;
      }
      .mc-resize-br::before { bottom: 2px; right: 2px; width: 8px; height: 2px; }
      .mc-resize-br::after { bottom: 2px; right: 2px; width: 2px; height: 8px; }
      .mc-resize-bl::before { bottom: 2px; left: 2px; width: 8px; height: 2px; }
      .mc-resize-bl::after { bottom: 2px; left: 2px; width: 2px; height: 8px; }
      .mc-resize-b {
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        cursor: ns-resize;
      }
      .mc-resize-b::before {
        content: '';
        position: absolute;
        bottom: 4px;
        left: 50%;
        transform: translateX(-50%);
        width: 24px;
        height: 3px;
        background: rgba(255,255,255,0.4);
        border-radius: 2px;
      }
      .mc-resize-b::after { display: none; }

      /* Caption action buttons */
      .mc-caption-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .mc-caption-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .mc-action-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 12px;
        padding: 2px 6px;
        color: #6b7280;
        border-radius: 4px;
        transition: all 0.15s;
      }
      .mc-action-btn:hover {
        background: rgba(255,255,255,0.1);
        color: #fff;
      }
      .mc-action-btn.mc-translate-action {
        color: #60a5fa;
      }
      .mc-action-btn.mc-reload-action {
        color: #a78bfa;
      }
      /* Translation with actions */
      .mc-translation-wrapper {
        display: flex;
        align-items: flex-start;
        gap: 4px;
      }
      .mc-translation {
        flex: 1;
        cursor: pointer;
      }
      .mc-translation:hover {
        background: rgba(255,255,255,0.05);
        border-radius: 4px;
      }
      .mc-translation-edit {
        background: rgba(255,255,255,0.08);
        border: 1px solid #60a5fa;
        border-radius: 4px;
        color: #60a5fa;
        font-size: 13px;
        padding: 4px 8px;
        width: 100%;
        outline: none;
        font-family: inherit;
        resize: none;
      }
      .mc-inline-actions {
        display: flex;
        flex-direction: column;
        gap: 2px;
        opacity: 0;
        transition: opacity 0.15s;
      }
      .mc-caption:hover .mc-inline-actions {
        opacity: 1;
      }
      /* Export dropdown */
      .mc-export-wrapper {
        position: relative;
      }
      .mc-export-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 4px;
        background: #252540;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 8px;
        padding: 4px;
        min-width: 160px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 100;
        opacity: 0;
        transform: translateY(-8px);
        pointer-events: none;
        transition: all 0.2s ease;
      }
      .mc-export-wrapper.open .mc-export-menu {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }
      .mc-export-item {
        display: block;
        width: 100%;
        padding: 8px 12px;
        background: none;
        border: none;
        color: #e4e4e7;
        font-size: 12px;
        text-align: left;
        cursor: pointer;
        border-radius: 4px;
        transition: background 0.15s;
      }
      .mc-export-item:hover {
        background: rgba(255,255,255,0.1);
      }
      .mc-export-item:disabled {
        color: #6b7280;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(styles);

    // Build header
    const title = createElement("span", {
      className: "mc-title",
      textContent: "Captions",
    });

    const translationTitle = createElement("span", {
      className: "mc-title mc-translation-label",
      textContent: "Translations",
    });

    // Language selector
    const langOptions = LANGUAGES.map((l) =>
      createElement("option", { value: l.code, textContent: l.name })
    );
    const langSelect = createElement(
      "select",
      {
        id: "mc-lang-select",
        className: "mc-lang-select",
        "data-tooltip": "Target Language",
        onChange: (e) => saveSettings({ targetLanguage: e.target.value }),
      },
      langOptions
    );
    langSelect.value = settings.targetLanguage;

    // Translation toggle (switch style)
    const toggleSwitch = createElement("div", {
      className: "mc-toggle-switch",
    });
    const translateToggle = createElement(
      "div",
      {
        id: "mc-translate-toggle",
        className:
          "mc-toggle" + (settings.translationEnabled ? " mc-active" : ""),
        "data-tooltip": settings.translationEnabled
          ? "Translation ON"
          : "Translation OFF",
        onClick: () => {
          settings.translationEnabled = !settings.translationEnabled;
          translateToggle.classList.toggle(
            "mc-active",
            settings.translationEnabled
          );
          saveSettings({ translationEnabled: settings.translationEnabled });
        },
      },
      [toggleSwitch]
    );

    // Export button with dropdown
    const exportMenu = createElement("div", { className: "mc-export-menu" }, [
      createElement("button", {
        className: "mc-export-item",
        textContent: "Export Captions",
        onClick: () => {
          exportCaptions("captions");
          exportWrapper.classList.remove("open");
        },
      }),
      createElement("button", {
        className: "mc-export-item",
        textContent: "Export Translations",
        onClick: () => {
          exportCaptions("translations");
          exportWrapper.classList.remove("open");
        },
      }),
      createElement("button", {
        className: "mc-export-item",
        textContent: "Export Both",
        onClick: () => {
          exportCaptions("both");
          exportWrapper.classList.remove("open");
        },
      }),
    ]);

    const exportBtn = createElement("button", {
      className: "mc-btn",
      "data-tooltip": "Export data",
      textContent: "↓",
      onClick: (e) => {
        e.stopPropagation();
        exportWrapper.classList.toggle("open");
      },
    });

    const exportWrapper = createElement(
      "div",
      { className: "mc-export-wrapper" },
      [exportBtn, exportMenu]
    );

    // Close export menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!exportWrapper.contains(e.target)) {
        exportWrapper.classList.remove("open");
      }
    });

    // Settings button - opens options page
    const settingsBtn = createElement("button", {
      className: "mc-btn",
      "data-tooltip": "Settings",
      textContent: "⚙",
      onClick: () => sendMessage("OPEN_OPTIONS", {}),
    });

    // Minimize button
    const minimizeBtn = createElement("button", {
      className: "mc-btn",
      "data-tooltip": "Minimize",
      textContent: "−",
      onClick: () => {
        isMinimized = !isMinimized;
        overlay.classList.toggle("minimized", isMinimized);
        minimizeBtn.textContent = isMinimized ? "+" : "−";
      },
    });

    // Header left: Captions title
    const headerLeft = createElement("div", { className: "mc-header-left" }, [
      title,
    ]);

    // Translation group: Translations + toggle
    const translationGroup = createElement(
      "div",
      { className: "mc-header-translation" },
      [translationTitle, translateToggle]
    );

    // Mini controls: export + settings + minimize
    const miniControls = createElement("div", { className: "mc-header-mini" }, [
      exportWrapper,
      settingsBtn,
      minimizeBtn,
    ]);

    // Header right: translation group + language + mini controls
    const headerRight = createElement("div", { className: "mc-header-right" }, [
      translationGroup,
      langSelect,
      miniControls,
    ]);

    // Minimized controls: wave + expand button (only shown when minimized)
    const waveIndicator = createElement("div", { className: "mc-wave" }, [
      createElement("div", { className: "mc-wave-bar" }),
      createElement("div", { className: "mc-wave-bar" }),
      createElement("div", { className: "mc-wave-bar" }),
    ]);
    waveElement = waveIndicator;

    const expandBtn = createElement("button", {
      className: "mc-btn",
      textContent: "+",
      onClick: () => {
        isMinimized = false;
        overlay.classList.remove("minimized");
        minimizeBtn.textContent = "−";
      },
    });

    const minimizedControls = createElement(
      "div",
      { className: "mc-minimized-controls" },
      [waveIndicator, expandBtn]
    );

    const header = createElement("div", { className: "mc-header" }, [
      headerLeft,
      headerRight,
      minimizedControls,
    ]);

    captionList = createElement("div", { className: "mc-list" });
    const content = createElement("div", { className: "mc-content" }, [
      captionList,
    ]);

    const resizeHandleBR = createElement("div", {
      className: "mc-resize mc-resize-br",
    });
    const resizeHandleBL = createElement("div", {
      className: "mc-resize mc-resize-bl",
    });
    const resizeHandleB = createElement("div", {
      className: "mc-resize mc-resize-b",
    });

    overlay = createElement("div", { id: "meetcaptioner-overlay" }, [
      header,
      content,
      resizeHandleBR,
      resizeHandleBL,
      resizeHandleB,
    ]);
    // Set initial translation mode class
    if (!settings.translationEnabled) {
      overlay.classList.add("translation-off");
    }
    document.body.appendChild(overlay);

    makeDraggable(overlay, header);
    makeResizable(overlay, resizeHandleBR, "br");
    makeResizable(overlay, resizeHandleBL, "bl");
    makeResizable(overlay, resizeHandleB, "b");

    renderCaptions();
  }

  // ============ UI: Resize & Drag ============
  function makeResizable(element, handle, corner) {
    let startX = 0,
      startY = 0,
      startWidth = 0,
      startHeight = 0,
      startLeft = 0;
    let isResizing = false;

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = element.offsetWidth;
      startHeight = element.offsetHeight;
      startLeft = element.getBoundingClientRect().left;

      const cursors = { br: "nwse-resize", bl: "nesw-resize", b: "ns-resize" };
      document.body.style.cursor = cursors[corner];
      document.body.style.userSelect = "none";

      document.addEventListener("mousemove", resize);
      document.addEventListener("mouseup", stopResize);
    });

    function resize(e) {
      if (!isResizing) return;
      e.preventDefault();

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newHeight = Math.max(200, startHeight + deltaY);
      element.style.height = newHeight + "px";

      if (corner === "br") {
        const newWidth = Math.max(520, startWidth + deltaX);
        element.style.width = newWidth + "px";
      } else if (corner === "bl") {
        const newWidth = Math.max(520, startWidth - deltaX);
        element.style.width = newWidth + "px";
        element.style.left = startLeft + deltaX + "px";
        element.style.right = "auto";
      }
    }

    function stopResize() {
      isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
    }
  }

  function makeDraggable(element, handle) {
    let startX = 0,
      startY = 0,
      startLeft = 0,
      startTop = 0;
    let isDragging = false;

    handle.addEventListener("mousedown", dragStart);

    function dragStart(e) {
      if (e.target.tagName === "BUTTON" || e.target.tagName === "SELECT")
        return;
      e.preventDefault();
      e.stopPropagation();

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = element.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", dragEnd);
    }

    function drag(e) {
      if (!isDragging) return;
      e.preventDefault();

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      element.style.left = startLeft + deltaX + "px";
      element.style.top = startTop + deltaY + "px";
      element.style.right = "auto";
      element.style.bottom = "auto";
    }

    function dragEnd() {
      isDragging = false;
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", dragEnd);
    }
  }

  // ============ UI: Render Captions ============
  function renderCaptions(updateOnly = false) {
    if (!captionList) return;

    if (captions.length === 0) {
      while (captionList.firstChild) {
        captionList.removeChild(captionList.firstChild);
      }
      const empty = createElement("div", { className: "mc-empty" });
      if (isCCEnabled) {
        // CC is on, waiting for speech
        empty.appendChild(document.createTextNode("You're all set!"));
        empty.appendChild(document.createElement("br"));
        empty.appendChild(
          document.createTextNode("Start speaking to see captions")
        );
      } else {
        // CC not enabled yet
        empty.appendChild(document.createTextNode("Waiting for captions..."));
        empty.appendChild(document.createElement("br"));
        empty.appendChild(document.createTextNode("Turn on CC in Google Meet"));
      }
      captionList.appendChild(empty);
      return;
    }

    const emptyEl = captionList.querySelector(".mc-empty");
    if (emptyEl) emptyEl.remove();

    const existingItems = captionList.querySelectorAll(".mc-caption");

    captions.forEach((c, i) => {
      if (existingItems[i]) {
        const item = existingItems[i];
        const textEl = item.querySelector(".mc-original");
        const timeEl = item.querySelector(".mc-time");
        if (textEl && textEl.textContent !== c.text) {
          textEl.textContent = c.text;
        }
        if (timeEl) timeEl.textContent = c.time;
        // Update translation
        updateCaptionTranslation(c);
      } else {
        const speaker = createElement("div", {
          className: "mc-speaker",
          textContent: c.speaker,
        });
        const original = createElement("div", {
          className: "mc-original",
          textContent: c.text,
        });

        // Translation wrapper with translation text and reload button
        const translationWrapper = createElement("div", {
          className: "mc-translation-wrapper",
        });
        const translation = createElement("div", {
          className:
            "mc-translation" +
            (c.translationStatus === "translating" ? " mc-translating" : ""),
          textContent:
            c.translation || (settings.translationEnabled ? "..." : ""),
          onClick: () => startEditTranslation(c),
          "data-tooltip": "Click to edit",
        });
        translationWrapper.appendChild(translation);

        const contentRow = createElement(
          "div",
          { className: "mc-caption-content" },
          [original, translationWrapper]
        );

        // Footer with time and translate button
        const time = createElement("div", {
          className: "mc-time",
          textContent: c.time,
        });
        const translateBtn = createElement("button", {
          className: "mc-action-btn mc-translate-action",
          "data-tooltip": "Translate",
          textContent: "Translate",
          onClick: (e) => {
            e.stopPropagation();
            manualTranslate(c);
          },
        });
        const actions = createElement(
          "div",
          { className: "mc-caption-actions" },
          [translateBtn]
        );
        const footer = createElement(
          "div",
          { className: "mc-caption-footer" },
          [time, actions]
        );

        const caption = createElement(
          "div",
          {
            className: "mc-caption mc-new",
            "data-caption-id": c.id,
          },
          [speaker, contentRow, footer]
        );
        captionList.appendChild(caption);
        setTimeout(() => caption.classList.remove("mc-new"), 200);

        // Add reload button if translation already exists
        if (
          c.translation &&
          c.translationStatus !== "translating" &&
          c.translationStatus !== "refining"
        ) {
          const reloadBtn = createElement("button", {
            className: "mc-action-btn mc-reload-action",
            "data-tooltip": "Re-translate",
            textContent: "↻",
            onClick: (e) => {
              e.stopPropagation();
              retranslateCaption(c);
            },
          });
          translationWrapper.appendChild(reloadBtn);
        }
      }
    });

    while (existingItems.length > captions.length) {
      const lastItem = captionList.lastElementChild;
      if (lastItem && lastItem.classList.contains("mc-caption")) {
        lastItem.remove();
      }
    }

    if (!updateOnly) {
      const content = overlay.querySelector(".mc-content");
      content.scrollTop = content.scrollHeight;
    }
  }

  // ============ Caption Processing ============
  let captionIdCounter = 0;

  // Remove ALL punctuation and spaces for comparison
  function stripPunctuation(text) {
    return text.replace(/[。、！？.!?,\s・「」『』（）()【】\[\]]/g, "");
  }

  // Check if newText is a continuation of oldText (handles punctuation changes)
  function isTextGrowing(oldText, newText) {
    // Strip all punctuation for comparison
    const oldStripped = stripPunctuation(oldText);
    const newStripped = stripPunctuation(newText);

    // New text must be longer (in stripped form)
    if (newStripped.length <= oldStripped.length) return false;

    // Check if new stripped text contains old stripped text at the start
    if (newStripped.startsWith(oldStripped)) return true;

    // Check if they share a significant common prefix (85% of old text)
    const checkLen = Math.max(5, Math.floor(oldStripped.length * 0.85));
    if (newStripped.slice(0, checkLen) === oldStripped.slice(0, checkLen)) {
      return true;
    }

    return false;
  }

  // Check if two texts are similar (for duplicate detection)
  function isSimilarText(text1, text2) {
    const s1 = stripPunctuation(text1);
    const s2 = stripPunctuation(text2);

    // Exact match after stripping
    if (s1 === s2) return true;

    // One contains the other
    if (s1.includes(s2) || s2.includes(s1)) return true;

    return false;
  }

  function addCaption(speaker, text) {
    if (!speaker || !text) return;

    const normalizedText = text.trim();

    // Check for similar/duplicate in ANY recent caption (handles punctuation variations)
    const similarDup = captions
      .slice(-10)
      .find((c) => isSimilarText(c.text, normalizedText));
    if (similarDup) {
      // If found and new text is longer (stripped), update the existing caption
      const oldStripped = stripPunctuation(similarDup.text);
      const newStripped = stripPunctuation(normalizedText);
      if (newStripped.length > oldStripped.length) {
        similarDup.text = normalizedText;
        similarDup.time = new Date().toLocaleTimeString();
        setWaveActive(true);
        // Update UI
        const captionEl = document.querySelector(
          `[data-caption-id="${similarDup.id}"]`
        );
        if (captionEl) {
          const textEl = captionEl.querySelector(".mc-original");
          const timeEl = captionEl.querySelector(".mc-time");
          if (textEl) textEl.textContent = normalizedText;
          if (timeEl) timeEl.textContent = similarDup.time;
        }
        // Re-translate if enabled
        if (settings.translationEnabled && similarDup.speaker === speaker) {
          scheduleSemanticTranslation(similarDup);
        }
      }
      return;
    }

    // Find the most recent caption from this speaker in last 5 entries
    let speakerCaption = null;
    for (
      let i = captions.length - 1;
      i >= Math.max(0, captions.length - 5);
      i--
    ) {
      if (captions[i].speaker === speaker) {
        speakerCaption = captions[i];
        break;
      }
    }

    // If we have a recent caption from this speaker
    if (speakerCaption) {
      const oldText = speakerCaption.text;
      const newText = normalizedText;

      // Exact duplicate - skip
      if (oldText === newText) return;

      // Similar text (punctuation only difference) - update existing
      if (isSimilarText(oldText, newText)) {
        const oldStripped = stripPunctuation(oldText);
        const newStripped = stripPunctuation(newText);
        // Update if new text is longer
        if (newStripped.length > oldStripped.length) {
          speakerCaption.text = newText;
          speakerCaption.time = new Date().toLocaleTimeString();
          setWaveActive(true);
          const captionEl = document.querySelector(
            `[data-caption-id="${speakerCaption.id}"]`
          );
          if (captionEl) {
            const textEl = captionEl.querySelector(".mc-original");
            const timeEl = captionEl.querySelector(".mc-time");
            if (textEl) textEl.textContent = newText;
            if (timeEl) timeEl.textContent = speakerCaption.time;
          }
          if (settings.translationEnabled) {
            scheduleSemanticTranslation(speakerCaption);
          }
        }
        return;
      }

      // Check if text is growing (handles punctuation changes during live recognition)
      if (isTextGrowing(oldText, newText)) {
        speakerCaption.text = newText;
        speakerCaption.time = new Date().toLocaleTimeString();
        setWaveActive(true);

        // Update the UI element for this caption
        const captionEl = document.querySelector(
          `[data-caption-id="${speakerCaption.id}"]`
        );
        if (captionEl) {
          const textEl = captionEl.querySelector(".mc-original");
          const timeEl = captionEl.querySelector(".mc-time");
          if (textEl) textEl.textContent = newText;
          if (timeEl) timeEl.textContent = speakerCaption.time;
        }

        // Re-translate when text updates
        if (settings.translationEnabled) {
          const lastTranslatedLen = speakerCaption.lastTranslatedLength || 0;
          const growth = newText.length - lastTranslatedLen;

          // Always schedule semantic
          scheduleSemanticTranslation(speakerCaption);

          // Optimistic if grew by 20+ chars since last translation, or no translation yet
          if (growth >= 20 || !speakerCaption.translation) {
            speakerCaption.lastTranslatedLength = newText.length;
            translateCaption(speakerCaption, "optimistic");
          }
        }
        return;
      }
    }

    const newCaption = {
      id: ++captionIdCounter,
      speaker,
      text: normalizedText,
      time: new Date().toLocaleTimeString(),
      translation: "",
      translationStatus: "pending",
      lastTranslatedLength: normalizedText.length,
    };

    captions.push(newCaption);
    setWaveActive(true);

    while (captions.length > MAX_CAPTIONS) {
      captions.shift();
    }

    renderCaptions(false);

    // Start optimistic translation
    if (settings.translationEnabled) {
      translateCaption(newCaption, "optimistic");
      scheduleSemanticTranslation(newCaption);
    }

    console.log("[MeetCaptioner] Caption:", speaker, "-", normalizedText);
  }

  // ============ Google Meet Caption Extraction ============
  function extractCaptions() {
    const captionRegion = document.querySelector(
      '[role="region"][aria-label="Captions"]'
    );
    if (!captionRegion) return;

    const captionEntries = captionRegion.querySelectorAll(".nMcdL");

    captionEntries.forEach((entry) => {
      const speakerEl = entry.querySelector(".NWpY1d");
      const speaker = speakerEl?.textContent?.trim() || "Speaker";

      const textEl = entry.querySelector(".ygicle");
      if (!textEl) return;

      const text = textEl.textContent?.trim();
      if (text && text.length > 1) {
        addCaption(speaker, text);
      }
    });
  }

  function debounce(fn, delay) {
    let timer = null;
    return function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  function startObserver() {
    let observer = null;
    const debouncedExtract = debounce(extractCaptions, 100);

    function observeCaptionRegion() {
      const captionRegion = document.querySelector(
        '[role="region"][aria-label="Captions"]'
      );

      if (captionRegion && !captionRegion._mcObserving) {
        captionRegion._mcObserving = true;

        // Update CC enabled state and re-render empty message
        if (!isCCEnabled) {
          isCCEnabled = true;
          if (captions.length === 0) {
            renderCaptions();
          }
        }

        if (observer) observer.disconnect();

        observer = new MutationObserver(debouncedExtract);
        observer.observe(captionRegion, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        console.log("[MeetCaptioner] Observing caption region");
      }
    }

    setInterval(observeCaptionRegion, 2000);
    observeCaptionRegion();

    console.log("[MeetCaptioner] Observer started");
  }

  // ============ Initialize ============
  async function init() {
    createOverlay();
    await loadSettings();
    startObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 1000);
  }

  const meta = document.createElement("meta");
  meta.name = "meetcaptioner-injected";
  meta.content = "true";
  (document.head || document.documentElement).appendChild(meta);

  console.log("[MeetCaptioner] Ready");
})();
