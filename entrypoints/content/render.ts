import type { Caption } from "./types";
import { captions, settings, isCCEnabled, captionList, overlay } from "./state";
import { createElement } from "./utils";
import { updateCaptionTranslation, startEditTranslation } from "./caption-ui";
import { manualTranslate, retranslateCaption } from "./translation";

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
      empty.appendChild(document.createTextNode("Turn on CC in Google Meet"));
    }
    captionList.appendChild(empty);
    return;
  }

  const emptyEl = captionList.querySelector(".mc-empty");
  if (emptyEl) emptyEl.remove();

  const existingItems = captionList.querySelectorAll(".mc-caption");

  captions.forEach((c, i) => {
    if (existingItems[i]) {
      const item = existingItems[i];
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
      // Don't scroll if user is editing translation
      const isEditing = content.querySelector(".mc-translation-edit") !== null;
      if (isEditing) return;

      // Smart scroll: only auto-scroll if user is near bottom
      const isNearBottom = content.scrollHeight - content.scrollTop - content.clientHeight < 100;
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
    "data-tooltip": "Click to edit",
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
