import type { Caption } from "./types";
import { MAX_CAPTIONS } from "./constants";
import {
  captions,
  settings,
  getNextCaptionId,
  waveElement,
  waveTimeout,
  setWaveTimeout,
  clearSemanticTimer,
} from "./state";
import { translateCaption } from "./translation";
import { renderCaptions } from "./render";
import { saveCaptionsDebounced } from "./history-service";

export function setWaveActive(active: boolean): void {
  if (!waveElement) return;
  if (active) {
    waveElement.classList.add("mc-active");
    if (waveTimeout) clearTimeout(waveTimeout);
    setWaveTimeout(
      setTimeout(() => {
        waveElement?.classList.remove("mc-active");
      }, 3000)
    );
  } else {
    waveElement.classList.remove("mc-active");
    if (waveTimeout) clearTimeout(waveTimeout);
  }
}

export function addOrUpdateCaption(
  captionId: number | null,
  speaker: string,
  text: string
): number {
  if (!text || text.trim().length === 0) {
    return captionId ?? -1;
  }

  setWaveActive(true);

  if (captionId !== null) {
    const caption = captions.find((c) => c.id === captionId);
    if (caption) {
      const textChanged = caption.text !== text;

      if (!textChanged) {
        return captionId;
      }

      caption.text = text;
      caption.time = new Date().toLocaleTimeString();

      if (caption.isFinalized && textChanged) {
        caption.translation = "";
        caption.translationStatus = "pending";
      }
      caption.isFinalized = false;

      const captionEl = document.querySelector(
        `[data-caption-id="${captionId}"]`
      );
      if (captionEl) {
        const textEl = captionEl.querySelector(".mc-original");
        const timeEl = captionEl.querySelector(".mc-time");
        const transEl = captionEl.querySelector(".mc-translation");
        if (textEl) textEl.textContent = text;
        if (timeEl) timeEl.textContent = caption.time;
        if (transEl && !caption.translation && settings.translationEnabled) {
          transEl.textContent = "...";
        }
      }

      saveCaptionsDebounced();
      return captionId;
    }
    // Edge case: Caption no longer exists, fall through to create new
  }

  const newId = getNextCaptionId();
  const newCaption: Caption = {
    id: newId,
    speaker,
    text,
    time: new Date().toLocaleTimeString(),
    translation: "",
    translationStatus: "pending",
    lastTranslatedLength: 0,
    isFinalized: false,
  };

  captions.push(newCaption);

  while (captions.length > MAX_CAPTIONS) {
    const removed = captions.shift();
    if (removed) {
      clearSemanticTimer(removed.id);
    }
  }

  renderCaptions(false);
  saveCaptionsDebounced();

  return newId;
}

export function finalizeCaption(captionId: number): void {
  const caption = captions.find((c) => c.id === captionId);

  if (!caption) {
    return;
  }

  if (caption.isFinalized) {
    return;
  }

  caption.isFinalized = true;

  if (settings.translationEnabled) {
    if (caption.translation && caption.translationStatus !== "error") {
      return;
    }

    if (caption.translationStatus === "translating") {
      return;
    }

    translateCaption(caption, "semantic");
  }

  saveCaptionsDebounced();
}

export function addCaption(speaker: string, text: string): void {
  addOrUpdateCaption(null, speaker, text);
}
