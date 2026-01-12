import type { Caption } from "./types";
import { createElement } from "./libs";
import { retranslateCaption } from "./translation";

export function updateCaptionTranslation(captionObj: Caption): void {
  const captionEl = document.querySelector(
    `[data-caption-id="${captionObj.id}"]`
  );
  if (!captionEl) {
    return;
  }

  let wrapper = captionEl.querySelector(".mc-translation-wrapper");
  let transEl = captionEl.querySelector(
    ".mc-translation"
  ) as HTMLElement | null;
  let reloadBtn = captionEl.querySelector(".mc-reload-action");

  if (!wrapper) {
    wrapper = createElement("div", { className: "mc-translation-wrapper" });
    const originalEl = captionEl.querySelector(".mc-original");
    if (originalEl?.parentNode) {
      originalEl.parentNode.appendChild(wrapper);
    }
  }

  if (!transEl) {
    transEl = createElement("div", {
      className: "mc-translation",
      onClick: () => startEditTranslation(captionObj),
      "data-tooltip": "Click to edit",
    });
    wrapper.appendChild(transEl);
  }

  if (captionObj.translationStatus === "translating") {
    if (captionObj.translation) {
      transEl.textContent = captionObj.translation + " ...";
      transEl.className = "mc-translation mc-translating";
    } else {
      transEl.textContent = "...";
      transEl.className = "mc-translation mc-translating";
    }
  } else if (captionObj.translationStatus === "refining") {
    transEl.textContent = captionObj.translation
      ? captionObj.translation + " ↻"
      : "...";
    transEl.className = "mc-translation mc-refining";
  } else if (captionObj.translationStatus === "error") {
    if (captionObj.translation) {
      transEl.textContent = captionObj.translation + " ⚠";
      transEl.setAttribute(
        "data-tooltip",
        captionObj.translationError || "Error"
      );
    } else {
      transEl.textContent = "⚠ " + (captionObj.translationError || "Error");
    }
    transEl.className = "mc-translation mc-error";
  } else if (captionObj.translation) {
    transEl.textContent = captionObj.translation;
    transEl.className = "mc-translation";
    transEl.setAttribute("data-tooltip", "Click to edit");
  } else {
    transEl.textContent = "";
    transEl.className = "mc-translation";
  }

  if (
    captionObj.translation &&
    captionObj.translationStatus !== "translating" &&
    captionObj.translationStatus !== "refining"
  ) {
    if (!reloadBtn) {
      reloadBtn = createElement("button", {
        className: "mc-action-btn mc-reload-action",
        "data-tooltip": "Re-translate",
        textContent: "↻",
        onClick: (e) => {
          e.stopPropagation();
          retranslateCaption(captionObj);
        },
      });
      wrapper.appendChild(reloadBtn);
    }
  } else if (reloadBtn) {
    reloadBtn.remove();
  }
}

function autoResizeTextarea(textarea: HTMLTextAreaElement): void {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

export function startEditTranslation(captionObj: Caption): void {
  const captionEl = document.querySelector(
    `[data-caption-id="${captionObj.id}"]`
  );
  if (!captionEl) return;

  const transEl = captionEl.querySelector(
    ".mc-translation"
  ) as HTMLElement | null;
  if (
    !transEl ||
    transEl.classList.contains("mc-translating") ||
    transEl.classList.contains("mc-refining")
  ) {
    return;
  }

  const currentText = captionObj.translation || "";
  const input = createElement("textarea", {
    className: "mc-translation-edit",
    value: currentText,
  }) as HTMLTextAreaElement;

  const saveEdit = () => {
    const newText = input.value.trim();
    if (newText !== currentText) {
      captionObj.translation = newText;
      captionObj.userEdited = true;
    }
    updateCaptionTranslation(captionObj);
  };

  input.addEventListener("blur", saveEdit);
  input.addEventListener("input", () => autoResizeTextarea(input));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      input.blur();
    }
    if (e.key === "Escape") {
      input.value = currentText;
      input.blur();
    }
  });

  input.addEventListener("click", (e) => e.stopPropagation());
  input.addEventListener("mousedown", (e) => e.stopPropagation());
  input.addEventListener("mouseup", (e) => e.stopPropagation());

  transEl.textContent = "";
  transEl.appendChild(input);

  requestAnimationFrame(() => {
    autoResizeTextarea(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });
}
