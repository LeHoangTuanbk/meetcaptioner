import { LANGUAGES } from "./constants";
import "./styles/index.css";
import {
  settings,
  updateSettings,
  overlay,
  setOverlay,
  setCaptionList,
  setWaveElement,
  isMinimized,
  setMinimized,
} from "./state";
import { createElement } from "./utils";
import { renderCaptions } from "./render";

async function saveSettings(newSettings: Partial<typeof settings>): Promise<void> {
  updateSettings(newSettings);
  try {
    await chrome.runtime.sendMessage({ action: "saveSettings", settings });
  } catch (e) {
    console.error("[MeetCaptioner] Could not save settings:", e);
  }
  updateUIFromSettings();
}

function updateUIFromSettings(): void {
  const langSelect = document.getElementById("mc-lang-select") as HTMLSelectElement | null;
  if (langSelect) langSelect.value = settings.targetLanguage;

  const translateToggle = document.getElementById("mc-translate-toggle");
  if (translateToggle) {
    translateToggle.classList.toggle("mc-active", settings.translationEnabled);
    translateToggle.setAttribute(
      "data-tooltip",
      settings.translationEnabled ? "Translation ON" : "Translation OFF"
    );
  }

  if (overlay) {
    overlay.classList.toggle("translation-off", !settings.translationEnabled);
  }
}

function makeResizable(element: HTMLElement, handle: HTMLElement, corner: "br" | "bl" | "b"): void {
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;
  let startLeft = 0;
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

  function resize(e: MouseEvent): void {
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

  function stopResize(): void {
    isResizing = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResize);
  }
}

function makeDraggable(element: HTMLElement, handle: HTMLElement): void {
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let isDragging = false;

  handle.addEventListener("mousedown", dragStart);

  function dragStart(e: MouseEvent): void {
    if ((e.target as HTMLElement).tagName === "BUTTON" || (e.target as HTMLElement).tagName === "SELECT") {
      return;
    }
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

  function drag(e: MouseEvent): void {
    if (!isDragging) return;
    e.preventDefault();

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newLeft = startLeft + deltaX;
    let newTop = startTop + deltaY;

    // Constrain within viewport bounds (keep at least 100px visible)
    const minVisible = 100;
    const maxLeft = window.innerWidth - minVisible;
    const maxTop = window.innerHeight - 50; // Keep header visible
    const minLeft = minVisible - element.offsetWidth;
    const minTop = 0;

    newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
    newTop = Math.max(minTop, Math.min(maxTop, newTop));

    element.style.left = newLeft + "px";
    element.style.top = newTop + "px";
    element.style.right = "auto";
    element.style.bottom = "auto";
  }

  function dragEnd(): void {
    isDragging = false;
    document.removeEventListener("mousemove", drag);
    document.removeEventListener("mouseup", dragEnd);
  }
}

export function createOverlay(): void {
  if (overlay) return;

  const title = createElement("span", { className: "mc-title", textContent: "Captions" });
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
      onChange: (e) => saveSettings({ targetLanguage: (e.target as HTMLSelectElement).value }),
    },
    langOptions
  ) as HTMLSelectElement;
  langSelect.value = settings.targetLanguage;

  const toggleSwitch = createElement("div", { className: "mc-toggle-switch" });
  const translateToggle = createElement(
    "div",
    {
      id: "mc-translate-toggle",
      className: "mc-toggle" + (settings.translationEnabled ? " mc-active" : ""),
      "data-tooltip": settings.translationEnabled ? "Translation ON" : "Translation OFF",
      onClick: () => {
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
        saveSettings({ translationEnabled: !settings.translationEnabled });
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
      setMinimized(!isMinimized);
      overlay?.classList.toggle("minimized", isMinimized);
      minimizeBtn.textContent = isMinimized ? "+" : "−";
    },
  });

  const headerLeft = createElement("div", { className: "mc-header-left" }, [title]);
  const translationGroup = createElement("div", { className: "mc-header-translation" }, [
    translationTitle,
    translateToggle,
  ]);
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
      setMinimized(false);
      overlay?.classList.remove("minimized");
      minimizeBtn.textContent = "−";
    },
  });

  const minimizedControls = createElement("div", { className: "mc-minimized-controls" }, [
    waveIndicator,
    expandBtn,
  ]);

  const header = createElement("div", { className: "mc-header" }, [
    headerLeft,
    headerRight,
    minimizedControls,
  ]);

  const captionListEl = createElement("div", { className: "mc-list" });
  setCaptionList(captionListEl);

  const content = createElement("div", { className: "mc-content" }, [captionListEl]);

  const resizeHandleBR = createElement("div", { className: "mc-resize mc-resize-br" });
  const resizeHandleBL = createElement("div", { className: "mc-resize mc-resize-bl" });
  const resizeHandleB = createElement("div", { className: "mc-resize mc-resize-b" });

  const overlayEl = createElement("div", { id: "meetcaptioner-overlay" }, [
    header,
    content,
    resizeHandleBR,
    resizeHandleBL,
    resizeHandleB,
  ]);

  if (!settings.translationEnabled) {
    overlayEl.classList.add("translation-off");
  }

  document.body.appendChild(overlayEl);
  setOverlay(overlayEl);

  makeDraggable(overlayEl, header);
  makeResizable(overlayEl, resizeHandleBR, "br");
  makeResizable(overlayEl, resizeHandleBL, "bl");
  makeResizable(overlayEl, resizeHandleB, "b");

  renderCaptions();
}

export { updateUIFromSettings };
