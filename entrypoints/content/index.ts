import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { DEFAULT_CUSTOM_PROMPT } from "@content/constants";
import { updateSettings } from "@content/state";
import { createOverlay } from "@content/overlay";
import { startObserver } from "@content/observer";
import {
  initMeetingSession,
  updateSessionEndTime,
} from "@content/history-service";
import "@content/overlay/styles.css";

export default defineContentScript({
  matches: ["https://meet.google.com/*"],
  runAt: "document_start",
  cssInjectionMode: "ui",

  main(ctx) {
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
      document.addEventListener("DOMContentLoaded", () => init(ctx), { once: true });
    } else {
      setTimeout(() => init(ctx), 1000);
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
    }
  } catch {
    // Settings could not be loaded, using defaults
  }
}

async function init(ctx: ContentScriptContext): Promise<void> {
  await createOverlay(ctx);
  await loadSettings();
  startObserver();

  initMeetingSession();

  window.addEventListener("beforeunload", () => {
    updateSessionEndTime();
  });
}
