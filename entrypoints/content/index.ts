import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { createOverlay } from "@content/overlay";
import { startObserver } from "@content/observer";
import { loadSettings, startSettingsSync } from "@content/settings-sync";
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

const init = async (ctx: ContentScriptContext): Promise<void> => {
  await createOverlay(ctx);
  startSettingsSync(ctx);
  await loadSettings();
  startObserver();

  initMeetingSession();

  window.addEventListener("beforeunload", () => {
    updateSessionEndTime();
  });
};
