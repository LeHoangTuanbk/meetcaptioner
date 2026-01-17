import "../styles/index.css";
import { settings, overlay, setOverlay, setCaptionList } from "../state";
import { createElement } from "../libs";
import { renderCaptions } from "../render";
import { makeDraggable, makeResizable } from "./interactions";
import { createHeader } from "./header";

export { updateUIFromSettings } from "./settings";

function setupScrollToBottom(content: HTMLElement): HTMLElement {
  const scrollBtn = createElement("button", {
    className: "mc-scroll-bottom",
    "data-tooltip": "Scroll to bottom",
    textContent: "↓",
    onClick: () => {
      content.scrollTop = content.scrollHeight;
    },
  });

  const updateScrollButtonVisibility = () => {
    const isNearBottom =
      content.scrollHeight - content.scrollTop - content.clientHeight < 100;
    scrollBtn.classList.toggle("mc-visible", !isNearBottom);
  };

  content.addEventListener("scroll", updateScrollButtonVisibility);

  // Also update when content changes (new captions, text updates, etc.)
  const mutationObserver = new MutationObserver(updateScrollButtonVisibility);
  mutationObserver.observe(content, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  setTimeout(updateScrollButtonVisibility, 100);

  return scrollBtn;
}

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

  // Append scroll button AFTER overlay is in DOM to avoid flex layout issues
  const scrollBtn = setupScrollToBottom(content);
  overlayEl.appendChild(scrollBtn);

  makeDraggable(overlayEl, header);
  makeResizable(overlayEl, resizeHandleBR, "br");
  makeResizable(overlayEl, resizeHandleBL, "bl");
  makeResizable(overlayEl, resizeHandleB, "b");

  renderCaptions();
}
