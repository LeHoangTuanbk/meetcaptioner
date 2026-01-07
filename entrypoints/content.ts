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

    // Inject the floating overlay script
    injectScript();

    // Set up message bridge between injected.js (MAIN) and background (extension)
    setupMessageBridge();
  },
});

function injectScript() {
  if (document.querySelector('meta[name="meetcaptioner-injected"]')) {
    return;
  }

  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.type = "text/javascript";

  const target = document.head || document.documentElement;

  script.onload = () => script.remove();
  target.prepend(script);
}

// Bridge messages between injected.js (page context) and background service worker
function setupMessageBridge() {
  console.log("[MeetCaptioner] Message bridge setup");

  window.addEventListener("message", async (event) => {
    // Only handle messages from our page
    if (event.source !== window) return;
    if (event.data?.source !== "meetcaptioner") return;

    const { type, payload, requestId } = event.data;
    console.log("[MeetCaptioner] Bridge received:", type, payload);

    try {
      let response;

      switch (type) {
        case "TRANSLATE":
          console.log("[MeetCaptioner] Sending translate to background...");
          response = await chrome.runtime.sendMessage({
            action: "translate",
            ...payload,
          });
          console.log("[MeetCaptioner] Background response:", response);
          break;

        case "SAVE_SETTINGS":
          response = await chrome.runtime.sendMessage({
            action: "saveSettings",
            settings: payload,
          });
          break;

        case "GET_SETTINGS":
          response = await chrome.runtime.sendMessage({
            action: "getSettings",
          });
          break;

        case "OPEN_OPTIONS":
          response = await chrome.runtime.sendMessage({
            action: "openOptions",
          });
          break;

        default:
          response = { success: false, error: "Unknown message type" };
      }

      // Send response back to injected.js
      window.postMessage(
        {
          source: "meetcaptioner-response",
          requestId,
          response,
        },
        "*"
      );
    } catch (error) {
      window.postMessage(
        {
          source: "meetcaptioner-response",
          requestId,
          response: { success: false, error: String(error) },
        },
        "*"
      );
    }
  });
}
