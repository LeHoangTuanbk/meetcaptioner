import type { Caption } from "./types";
import { captions, settings, isCCEnabled, captionList, overlay } from "./state";
import { createElement, copyToClipboard } from "./libs";
import { updateCaptionTranslation, startEditTranslation } from "./caption-ui";
import { manualTranslate, retranslateCaption } from "./translation";

function showCopyFeedback(element: HTMLElement): void {
  const caption = element.closest(".mc-caption");
  if (!caption) return;

  const existing = caption.querySelector(".mc-copy-indicator");
  if (existing) existing.remove();

  element.classList.add("mc-copied");

  const indicator = document.createElement("span");
  indicator.className = "mc-copy-indicator";
  indicator.textContent = "✓ Copied!";

  caption.appendChild(indicator);

  setTimeout(() => {
    element.classList.remove("mc-copied");
    indicator.remove();
  }, 2000);
}

export function renderCaptions(updateOnly = false): void {
  if (!captionList) return;

  if (captions.length === 0) {
    while (captionList.firstChild) {
      captionList.removeChild(captionList.firstChild);
    }
    const empty = createElement("div", { className: "mc-empty" });
    if (isCCEnabled) {
      empty.appendChild(document.createTextNode("You're all set!"));
      empty.appendChild(document.createElement("br"));
      empty.appendChild(
        document.createTextNode("Start speaking to see captions")
      );
    } else {
      empty.appendChild(document.createTextNode("Waiting for captions..."));
      empty.appendChild(document.createElement("br"));
      empty.appendChild(
        document.createTextNode("Please, turn on CC in Google Meet")
      );
    }
    captionList.appendChild(empty);
    return;
  }

  const emptyEl = captionList.querySelector(".mc-empty");
  if (emptyEl) emptyEl.remove();

  const existingItems = captionList.querySelectorAll(".mc-caption");

  captions.forEach((c, i) => {
    if (existingItems[i]) {
      const item = existingItems[i] as HTMLElement;

      const currentId = item.getAttribute("data-caption-id");
      if (currentId !== String(c.id)) {
        item.setAttribute("data-caption-id", String(c.id));
      }

      const speakerEl = item.querySelector(".mc-speaker");
      if (speakerEl && speakerEl.textContent !== c.speaker) {
        speakerEl.textContent = c.speaker;
      }

      const textEl = item.querySelector(".mc-original");
      const timeEl = item.querySelector(".mc-time");
      if (textEl && textEl.textContent !== c.text) {
        textEl.textContent = c.text;
      }
      if (timeEl) timeEl.textContent = c.time;
      updateCaptionTranslation(c);
    } else {
      const captionEl = createCaptionElement(c);
      captionList?.appendChild(captionEl);
      setTimeout(() => captionEl.classList.remove("mc-new"), 200);

      if (
        c.translation &&
        c.translationStatus !== "translating" &&
        c.translationStatus !== "refining"
      ) {
        const wrapper = captionEl.querySelector(".mc-translation-wrapper");
        if (wrapper) {
          const reloadBtn = createElement("button", {
            className: "mc-action-btn mc-reload-action",
            "data-tooltip": "Re-translate",
            textContent: "↻",
            onClick: (e) => {
              e.stopPropagation();
              retranslateCaption(c);
            },
          });
          wrapper.appendChild(reloadBtn);
        }
      }
    }
  });

  while (existingItems.length > captions.length) {
    const lastItem = captionList.lastElementChild;
    if (lastItem?.classList.contains("mc-caption")) {
      lastItem.remove();
    }
  }

  if (!updateOnly && overlay) {
    const content = overlay.querySelector(".mc-content");
    if (content) {
      const isEditing = content.querySelector(".mc-translation-edit") !== null;
      if (isEditing) return;

      const isNearBottom =
        content.scrollHeight - content.scrollTop - content.clientHeight < 100;
      if (isNearBottom) {
        content.scrollTop = content.scrollHeight;
      }
    }
  }
}

function createCaptionElement(c: Caption): HTMLElement {
  const speaker = createElement("div", {
    className: "mc-speaker",
    textContent: c.speaker,
  });

  const original = createElement("div", {
    className: "mc-original",
    textContent: c.text,
    "data-tooltip": "Double-click to copy",
    onDblClick: async (e: Event) => {
      e.stopPropagation();
      const success = await copyToClipboard(c.text);
      if (success) showCopyFeedback(e.target as HTMLElement);
    },
  });

  const translationWrapper = createElement("div", {
    className: "mc-translation-wrapper",
  });

  const translation = createElement("div", {
    className:
      "mc-translation" +
      (c.translationStatus === "translating" ? " mc-translating" : ""),
    textContent: c.translation || (settings.translationEnabled ? "..." : ""),
    onClick: () => startEditTranslation(c),
    onDblClick: async (e: Event) => {
      e.stopPropagation();
      if (c.translation) {
        const success = await copyToClipboard(c.translation);
        if (success) showCopyFeedback(e.target as HTMLElement);
      }
    },
    "data-tooltip": "Click to edit, double-click to copy",
  });
  translationWrapper.appendChild(translation);

  const contentRow = createElement("div", { className: "mc-caption-content" }, [
    original,
    translationWrapper,
  ]);

  const time = createElement("div", {
    className: "mc-time",
    textContent: c.time,
  });

  const translateBtn = createElement("button", {
    className: "mc-action-btn mc-translate-action",
    "data-tooltip": "Translate",
    textContent: "Translate",
    onClick: (e) => {
      e.stopPropagation();
      manualTranslate(c);
    },
  });

  const actions = createElement("div", { className: "mc-caption-actions" }, [
    translateBtn,
  ]);
  const footer = createElement("div", { className: "mc-caption-footer" }, [
    time,
    actions,
  ]);

  return createElement(
    "div",
    {
      className: "mc-caption mc-new",
      "data-caption-id": c.id,
    },
    [speaker, contentRow, footer]
  );
}
