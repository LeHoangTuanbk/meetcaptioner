import { initializePlatformRuntime } from "./platform-runtime";

const INITIAL_RETRY_DELAY_MS = 1000;
const RETRY_INTERVAL_MS = 1000;
const MAX_RETRY_ATTEMPTS = 30;

let bootStarted = false;

export default defineContentScript({
  matches: [
    "https://meet.google.com/*",
    "https://teams.microsoft.com/l/meetup-join/*",
    "https://teams.microsoft.com/meet/*",
    "https://teams.microsoft.com/v2/*",
    "https://*.teams.microsoft.com/l/meetup-join/*",
    "https://*.teams.microsoft.com/meet/*",
    "https://*.teams.microsoft.com/v2/*",
    "https://teams.live.com/meet/*",
    "https://teams.live.com/v2/*",
    "https://*.teams.live.com/meet/*",
    "https://*.teams.live.com/v2/*",
    "https://*.zoom.us/wc/*",
    "https://*.zoom.us/j/*",
    "https://*.zoom.us/w/*",
  ],
  allFrames: true,
  runAt: "document_start",

  main() {
    // Prevent double injection
    if (document.querySelector('meta[name="meetcaptioner-injected"]')) {
      return;
    }

    const meta = document.createElement("meta");
    meta.name = "meetcaptioner-injected";
    meta.content = "true";
    (document.head || document.documentElement).appendChild(meta);

    void bootWithRetry();

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        void bootWithRetry();
      });
    } else {
      setTimeout(() => {
        void bootWithRetry();
      }, INITIAL_RETRY_DELAY_MS);
    }
  },
});

async function bootWithRetry(): Promise<void> {
  if (bootStarted) {
    return;
  }

  bootStarted = true;
  let attempts = 0;

  const tryInit = async () => {
    attempts += 1;

    try {
      const initialized = await initializePlatformRuntime();
      if (initialized || attempts >= MAX_RETRY_ATTEMPTS) {
        return;
      }
    } catch (error) {
      console.error("MeetCaptioner init retry failed", error);
      if (attempts >= MAX_RETRY_ATTEMPTS) {
        return;
      }
    }

    window.setTimeout(() => {
      void tryInit();
    }, RETRY_INTERVAL_MS);
  };

  if (document.readyState !== "loading") {
    window.setTimeout(() => {
      void tryInit();
    }, INITIAL_RETRY_DELAY_MS);
    return;
  }

  await tryInit();
}
