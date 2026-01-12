import { LANGUAGES } from "../constants";
import {
  settings,
  overlay,
  setWaveElement,
  isMinimized,
  setMinimized,
  savedPosition,
  setSavedPosition,
} from "../state";
import { createElement } from "../libs";
import { translateAllExistingCaptions } from "../translation";
import { saveOverlaySettings } from "./settings";

export function createHeader(): {
  header: HTMLElement;
  minimizeBtn: HTMLButtonElement;
} {
  const title = createElement("span", {
    className: "mc-title",
    textContent: "Captions",
  });

  const translationTitle = createElement("span", {
    className: "mc-title mc-translation-label",
    textContent: "Translations",
  });

  const langOptions = LANGUAGES.map((l) =>
    createElement("option", { value: l.code, textContent: l.name })
  );

  const langSelect = createElement(
    "select",
    {
      id: "mc-lang-select",
      className: "mc-lang-select",
      "data-tooltip": "Target Language",
      onChange: (e) =>
        saveOverlaySettings({
          targetLanguage: (e.target as HTMLSelectElement).value,
        }),
    },
    langOptions
  ) as HTMLSelectElement;
  langSelect.value = settings.targetLanguage;

  const toggleSwitch = createElement("div", { className: "mc-toggle-switch" });

  const translateToggle = createElement(
    "div",
    {
      id: "mc-translate-toggle",
      className:
        "mc-toggle" + (settings.translationEnabled ? " mc-active" : ""),
      "data-tooltip": settings.translationEnabled
        ? "Translation ON"
        : "Translation OFF",
      onClick: async () => {
        if (!settings.translationEnabled) {
          const apiKey =
            settings.provider === "anthropic"
              ? settings.anthropicApiKey
              : settings.openaiApiKey;
          if (!apiKey) {
            chrome.runtime.sendMessage({ action: "openOptions" });
            return;
          }
        }
        const newEnabled = !settings.translationEnabled;
        await saveOverlaySettings({ translationEnabled: newEnabled });

        if (newEnabled) {
          translateAllExistingCaptions();
        }
      },
    },
    [toggleSwitch]
  );

  const settingsBtn = createElement("button", {
    className: "mc-btn",
    "data-tooltip": "Settings",
    textContent: "⚙",
    onClick: () => chrome.runtime.sendMessage({ action: "openOptions" }),
  });

  const minimizeBtn = createElement("button", {
    className: "mc-btn",
    "data-tooltip": "Minimize",
    textContent: "−",
    onClick: () => {
      if (!overlay) return;

      if (!isMinimized) {
        setSavedPosition({
          left: overlay.style.left,
          top: overlay.style.top,
          width: overlay.style.width,
          height: overlay.style.height,
        });

        const rect = overlay.getBoundingClientRect();
        const rightEdge = window.innerWidth - rect.right;

        overlay.style.left = "auto";
        overlay.style.right = Math.max(20, rightEdge) + "px";
      }

      setMinimized(true);
      overlay.classList.add("minimized");
      minimizeBtn.textContent = "+";
    },
  }) as HTMLButtonElement;

  const headerLeft = createElement("div", { className: "mc-header-left" }, [
    title,
  ]);

  const translationGroup = createElement(
    "div",
    { className: "mc-header-translation" },
    [translationTitle, translateToggle]
  );

  const miniControls = createElement("div", { className: "mc-header-mini" }, [
    settingsBtn,
    minimizeBtn,
  ]);

  const headerRight = createElement("div", { className: "mc-header-right" }, [
    translationGroup,
    langSelect,
    miniControls,
  ]);

  const waveIndicator = createElement("div", { className: "mc-wave" }, [
    createElement("div", { className: "mc-wave-bar" }),
    createElement("div", { className: "mc-wave-bar" }),
    createElement("div", { className: "mc-wave-bar" }),
  ]);
  setWaveElement(waveIndicator);

  const expandBtn = createElement("button", {
    className: "mc-btn",
    textContent: "+",
    onClick: () => {
      if (!overlay) return;

      if (savedPosition) {
        overlay.style.left = savedPosition.left;
        overlay.style.top = savedPosition.top;
        overlay.style.width = savedPosition.width;
        overlay.style.height = savedPosition.height;
        overlay.style.right = "auto";
        setSavedPosition(null);
      }

      setMinimized(false);
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

  return { header, minimizeBtn };
}
