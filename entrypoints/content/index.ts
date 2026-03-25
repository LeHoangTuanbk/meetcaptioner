import {
  initializePlatformRuntime,
  isSupportedMeetingPage,
} from "./platform-runtime";

export default defineContentScript({
  matches: ["https://meet.google.com/*"],
  runAt: "document_start",

  main() {
    if (!isSupportedMeetingPage()) {
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

async function init(): Promise<void> {
  await initializePlatformRuntime();
}
