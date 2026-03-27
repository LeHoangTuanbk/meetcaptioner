import { createElement } from "../libs";
import {
  captureGuide,
  captureGuideElement,
  isCaptureGuideOpen,
  setCaptureGuideElement,
  setCaptureGuideOpen,
} from "../state";

function renderCaptureGuideContent(): void {
  if (!captureGuideElement) {
    return;
  }

  const titleEl = captureGuideElement.querySelector(
    ".mc-capture-guide-title"
  ) as HTMLElement | null;
  const bodyEl = captureGuideElement.querySelector(
    ".mc-capture-guide-body"
  ) as HTMLElement | null;
  const stepsEl = captureGuideElement.querySelector(
    ".mc-capture-guide-steps"
  ) as HTMLElement | null;
  const troubleshootingEl = captureGuideElement.querySelector(
    ".mc-capture-guide-troubleshooting"
  ) as HTMLElement | null;

  if (!titleEl || !bodyEl || !stepsEl || !troubleshootingEl) {
    return;
  }

  titleEl.textContent = captureGuide?.modalTitle || "Capture Help";
  bodyEl.textContent = captureGuide?.modalBody || "";

  while (stepsEl.firstChild) {
    stepsEl.removeChild(stepsEl.firstChild);
  }

  for (const [index, step] of (captureGuide?.steps || []).entries()) {
    const stepEl = createElement("li", { className: "mc-capture-guide-step" }, [
      createElement("div", {
        className: "mc-capture-guide-step-number",
        textContent: String(index + 1),
      }),
      createElement("div", { className: "mc-capture-guide-step-content" }, [
        createElement("div", {
          className: "mc-capture-guide-step-title",
          textContent: step.title,
        }),
        createElement("div", {
          className: "mc-capture-guide-step-detail",
          textContent: step.detail,
        }),
      ]),
    ]);

    stepsEl.appendChild(stepEl);
  }

  troubleshootingEl.textContent = captureGuide?.troubleshootingHint || "";
  troubleshootingEl.style.display = captureGuide?.troubleshootingHint
    ? "block"
    : "none";
}

export function syncCaptureGuide(): void {
  renderCaptureGuideContent();

  if (!captureGuideElement) {
    return;
  }

  captureGuideElement.classList.toggle("mc-open", isCaptureGuideOpen);
}

export function openCaptureGuide(): void {
  if (!captureGuide) {
    return;
  }

  setCaptureGuideOpen(true);
  syncCaptureGuide();
}

export function closeCaptureGuide(): void {
  setCaptureGuideOpen(false);
  syncCaptureGuide();
}

export function createCaptureGuide(): HTMLElement {
  const closeBtn = createElement("button", {
    className: "mc-capture-guide-close",
    textContent: "Close",
    onClick: () => closeCaptureGuide(),
  });

  const guide = createElement(
    "div",
    {
      className: "mc-capture-guide",
    },
    [
      createElement("div", { className: "mc-capture-guide-backdrop" }),
      createElement("div", { className: "mc-capture-guide-modal" }, [
        createElement("div", { className: "mc-capture-guide-title" }),
        createElement("div", { className: "mc-capture-guide-body" }),
        createElement("ol", { className: "mc-capture-guide-steps" }),
        createElement("div", {
          className: "mc-capture-guide-troubleshooting",
        }),
        createElement("div", { className: "mc-capture-guide-actions" }, [
          closeBtn,
        ]),
      ]),
    ]
  );

  guide.addEventListener("click", (event) => {
    if (event.target === guide.querySelector(".mc-capture-guide-backdrop")) {
      closeCaptureGuide();
    }
  });

  setCaptureGuideElement(guide);
  syncCaptureGuide();

  return guide;
}
