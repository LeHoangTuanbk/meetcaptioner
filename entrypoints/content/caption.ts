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

/**
 * Add a new caption or update existing one
 * @param captionId - null to create new, or existing ID to update
 * @param speaker - speaker name
 * @param text - caption text
 * @returns caption ID
 */
export function addOrUpdateCaption(
  captionId: number | null,
  speaker: string,
  text: string
): number {
  // Edge case: Empty text
  if (!text || text.trim().length === 0) {
    return captionId ?? -1;
  }

  setWaveActive(true);

  if (captionId !== null) {
    // Update existing caption
    const caption = captions.find((c) => c.id === captionId);
    if (caption) {
      const textChanged = caption.text !== text;

      // Edge case: Text didn't actually change
      if (!textChanged) {
        return captionId;
      }

      caption.text = text;
      caption.time = new Date().toLocaleTimeString();

      // If text changed after finalization, need to re-translate
      if (caption.isFinalized && textChanged) {
        caption.translation = "";
        caption.translationStatus = "pending";
      }
      caption.isFinalized = false;

      // Update DOM
      const captionEl = document.querySelector(`[data-caption-id="${captionId}"]`);
      if (captionEl) {
        const textEl = captionEl.querySelector(".mc-original");
        const timeEl = captionEl.querySelector(".mc-time");
        const transEl = captionEl.querySelector(".mc-translation");
        if (textEl) textEl.textContent = text;
        if (timeEl) timeEl.textContent = caption.time;
        // Show "..." if we cleared translation
        if (transEl && !caption.translation && settings.translationEnabled) {
          transEl.textContent = "...";
        }
      }

      saveCaptionsDebounced();
      return captionId;
    }
    // Edge case: Caption no longer exists, fall through to create new
  }

  // Create new caption
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

  // Remove old captions if over limit
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

/**
 * Finalize a caption - trigger translation
 * Called when text has stopped changing
 */
export function finalizeCaption(captionId: number): void {
  const caption = captions.find((c) => c.id === captionId);

  // Edge case: Caption no longer exists
  if (!caption) {
    return;
  }

  // Edge case: Already finalized
  if (caption.isFinalized) {
    return;
  }

  caption.isFinalized = true;

  // Trigger translation
  if (settings.translationEnabled) {
    // Edge case: Already has translation (from previous finalization)
    if (caption.translation && caption.translationStatus !== "error") {
      return;
    }

    // Edge case: Currently translating
    if (caption.translationStatus === "translating") {
      return;
    }

    translateCaption(caption, "semantic");
  }

  saveCaptionsDebounced();
}

// Keep for backward compatibility
export function addCaption(speaker: string, text: string): void {
  addOrUpdateCaption(null, speaker, text);
}
