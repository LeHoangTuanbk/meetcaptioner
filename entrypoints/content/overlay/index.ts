import "../styles/index.css";
import {
  settings,
  overlay,
  setOverlay,
  setCaptionList,
  setCaptureGuideElement,
  setWaveElement,
} from "../state";
import { createElement } from "../libs";
import { renderCaptions } from "../render";
import { makeDraggable, makeResizable } from "./interactions";
import { createCaptureGuide, syncCaptureGuide } from "./capture-guide";
import { createHeader } from "./header";
import { createScrollButton } from "./scroll-button";

export { updateUIFromSettings } from "./settings";

export function createOverlay(): void {
  if (overlay) return;

  const { header } = createHeader();

  const captionListEl = createElement("div", { className: "mc-list" });
  setCaptionList(captionListEl);

  const content = createElement("div", { className: "mc-content" }, [
    captionListEl,
  ]);

  const resizeHandleBR = createElement("div", {
    className: "mc-resize mc-resize-br",
  });
  const resizeHandleBL = createElement("div", {
    className: "mc-resize mc-resize-bl",
  });
  const resizeHandleB = createElement("div", {
    className: "mc-resize mc-resize-b",
  });

  const overlayEl = createElement("div", { id: "meetcaptioner-overlay" }, [
    header,
    content,
    resizeHandleBR,
    resizeHandleBL,
    resizeHandleB,
    createCaptureGuide(),
  ]);

  if (!settings.translationEnabled) {
    overlayEl.classList.add("translation-off");
  }

  document.body.appendChild(overlayEl);
  setOverlay(overlayEl);

  const scrollBtn = createScrollButton(content, overlayEl);
  overlayEl.appendChild(scrollBtn);

  makeDraggable(overlayEl, header);
  makeResizable(overlayEl, resizeHandleBR, "br");
  makeResizable(overlayEl, resizeHandleBL, "bl");
  makeResizable(overlayEl, resizeHandleB, "b");

  renderCaptions();
  syncCaptureGuide();
}

export function destroyOverlay(): void {
  if (overlay?.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }

  setOverlay(null);
  setCaptionList(null);
  setWaveElement(null);
  setCaptureGuideElement(null);
}
