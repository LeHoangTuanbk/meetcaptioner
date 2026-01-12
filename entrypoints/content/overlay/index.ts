import "../styles/index.css";
import { settings, overlay, setOverlay, setCaptionList } from "../state";
import { createElement } from "../libs";
import { renderCaptions } from "../render";
import { makeDraggable, makeResizable } from "./interactions";
import { createHeader } from "./header";

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
