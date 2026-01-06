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

    injectScript();
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
