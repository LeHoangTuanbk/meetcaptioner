import { DEFAULT_CUSTOM_PROMPT } from "./constants";
import { updateSettings } from "./state";
import { createOverlay, updateUIFromSettings } from "./overlay";
import { startObserver } from "./observer";
import { initMeetingSession, updateSessionEndTime } from "./history-service";

export default defineContentScript({
  matches: ["https://meet.google.com/*"],
  runAt: "document_start",

  main() {
    const isMeetingUrl = /\/[a-z]{3}-[a-z]{4}-[a-z]{3}($|\?)/.test(
      window.location.pathname
    );

    if (!isMeetingUrl && window.location.pathname !== "/new") {
      return;
    }

    // Prevent double injection
    if (document.querySelector('meta[name="meetcaptioner-injected"]')) {
      return;
    }

    const meta = document.createElement("meta");
    meta.name = "meetcaptioner-injected";
    meta.content = "true";
    (document.head || document.documentElement).appendChild(meta);

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      setTimeout(init, 1000);
    }
  },
});

async function loadSettings(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "getSettings",
    });
    if (response?.success && response.settings) {
      const saved = response.settings;
      updateSettings(saved);
      if (saved.customPrompt !== undefined) {
        updateSettings({ customPrompt: saved.customPrompt });
      } else {
        updateSettings({ customPrompt: DEFAULT_CUSTOM_PROMPT });
      }
      updateUIFromSettings();
    }
  } catch {
    // Settings could not be loaded, using defaults
  }
}

async function init(): Promise<void> {
  createOverlay();
  await loadSettings();
  startObserver();

  initMeetingSession();

  window.addEventListener("beforeunload", () => {
    updateSessionEndTime();
  });
}
