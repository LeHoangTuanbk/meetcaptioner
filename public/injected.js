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
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
  ];

  const MODELS = {
    anthropic: [
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5 (Fastest)" },
      { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
      { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5" },
    ],
    openai: [
      { id: "gpt-5-nano", name: "GPT-5 Nano (Fastest)" },
      { id: "gpt-5-mini", name: "GPT-5 Mini" },
      { id: "gpt-5.2", name: "GPT-5.2" },
    ],
  };

  // ============ State ============
  const captions = [];
  let overlay = null;
  let captionList = null;
  let isMinimized = false;
  let requestIdCounter = 0;
  const pendingRequests = new Map();

  // Settings (loaded from storage)
  let settings = {
    provider: "anthropic",
    anthropicApiKey: "",
    openaiApiKey: "",
    model: "claude-haiku-4-5-20251001",
    targetLanguage: "vi",
    translationEnabled: false,
    customPrompt: "",
  };

  // Translation debounce timers per caption
  const semanticTimers = new Map();

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
        settings = { ...settings, ...response.settings };
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
      translateToggle.title = settings.translationEnabled
        ? "Translation ON"
        : "Translation OFF";
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
        title: "Click to edit translation",
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
        transEl.title = captionObj.translationError || "Error";
      } else {
        transEl.textContent = "⚠ " + (captionObj.translationError || "Error");
      }
      transEl.className = "mc-translation mc-error";
    } else if (captionObj.translation) {
      transEl.textContent = captionObj.translation;
      transEl.className = "mc-translation";
      transEl.title = "Click to edit translation";
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
          title: "Re-translate",
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
        min-width: 320px;
        min-height: 200px;
      }
      #meetcaptioner-overlay.minimized {
        height: auto !important;
        width: 140px !important;
        min-width: 0 !important;
        min-height: 0 !important;
      }
      #meetcaptioner-overlay.minimized .mc-content,
      #meetcaptioner-overlay.minimized .mc-resize-br,
      #meetcaptioner-overlay.minimized .mc-resize-bl,
      #meetcaptioner-overlay.minimized .mc-resize-b,
      #meetcaptioner-overlay.minimized .mc-header-left,
      #meetcaptioner-overlay.minimized .mc-header-translation,
      #meetcaptioner-overlay.minimized .mc-lang-select {
        display: none !important;
      }
      #meetcaptioner-overlay.minimized .mc-header-mini {
        opacity: 1;
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
        padding: 4px 10px;
        border-radius: 6px;
        transition: all 0.2s;
        background: rgba(255,255,255,0.05);
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
    `;
    document.head.appendChild(styles);

    // Build header
    const title = createElement("span", {
      className: "mc-title",
      textContent: "Captions",
    });

    const translationTitle = createElement("span", {
      className: "mc-title",
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
        title: "Toggle Translation",
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


    // Settings button - opens options page
    const settingsBtn = createElement("button", {
      className: "mc-btn",
      title: "Settings",
      textContent: "⚙",
      onClick: () => sendMessage("OPEN_OPTIONS", {}),
    });

    // Minimize button
    const minimizeBtn = createElement("button", {
      className: "mc-btn",
      title: "Minimize",
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
    const translationGroup = createElement("div", { className: "mc-header-translation" }, [
      translationTitle,
      translateToggle,
    ]);

    // Mini controls: settings + minimize
    const miniControls = createElement("div", { className: "mc-header-mini" }, [
      settingsBtn,
      minimizeBtn,
    ]);

    // Header right: translation group + language + mini controls
    const headerRight = createElement("div", { className: "mc-header-right" }, [
      translationGroup,
      langSelect,
      miniControls,
    ]);

    const header = createElement("div", { className: "mc-header" }, [
      headerLeft,
      headerRight,
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
        const newWidth = Math.max(320, startWidth + deltaX);
        element.style.width = newWidth + "px";
      } else if (corner === "bl") {
        const newWidth = Math.max(320, startWidth - deltaX);
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
      empty.appendChild(document.createTextNode("Waiting for captions..."));
      empty.appendChild(document.createElement("br"));
      empty.appendChild(document.createTextNode("Turn on CC in Google Meet"));
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
          title: "Click to edit translation",
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
          title: "Translate this caption",
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
            title: "Re-translate",
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

  // Normalize text for comparison (remove trailing punctuation)
  function normalizeForCompare(text) {
    return text.trim().replace(/[。、！？.!?,\s]+$/g, "");
  }

  // Check if newText is a continuation of oldText (handles punctuation changes)
  function isTextGrowing(oldText, newText) {
    if (newText.length <= oldText.length) return false;

    const oldNorm = normalizeForCompare(oldText);
    const newNorm = normalizeForCompare(newText);

    // Check if new text starts with old text (after removing punctuation)
    if (newNorm.startsWith(oldNorm)) return true;

    // Check if they share a significant common prefix (80% of shorter)
    const minLen = Math.min(oldNorm.length, newNorm.length);
    const checkLen = Math.max(5, Math.floor(minLen * 0.8));
    return newNorm.slice(0, checkLen) === oldNorm.slice(0, checkLen);
  }

  function addCaption(speaker, text) {
    if (!speaker || !text) return;

    const normalizedText = text.trim();

    // Check for exact duplicate in ANY recent caption first
    const exactDup = captions.slice(-10).find((c) => c.text === normalizedText);
    if (exactDup) return;

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

      // New text is shorter or equal - likely partial/duplicate, skip
      if (newText.length <= oldText.length) return;

      // Check if text is growing (handles punctuation changes during live recognition)
      if (isTextGrowing(oldText, newText)) {
        speakerCaption.text = newText;
        speakerCaption.time = new Date().toLocaleTimeString();

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
