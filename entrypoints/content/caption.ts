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
import { stripPunctuation, isSimilarText, isTextGrowing } from "./utils";
import { translateCaption, scheduleSemanticTranslation } from "./translation";
import { renderCaptions } from "./render";

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

function updateCaptionElement(caption: Caption, newText: string): void {
  caption.text = newText;
  caption.time = new Date().toLocaleTimeString();
  setWaveActive(true);

  const captionEl = document.querySelector(`[data-caption-id="${caption.id}"]`);
  if (captionEl) {
    const textEl = captionEl.querySelector(".mc-original");
    const timeEl = captionEl.querySelector(".mc-time");
    if (textEl) textEl.textContent = newText;
    if (timeEl) timeEl.textContent = caption.time;
  }
}

function triggerTranslationIfNeeded(caption: Caption, newText: string): void {
  if (!settings.translationEnabled) return;

  const growth = newText.length - (caption.lastTranslatedLength || 0);
  if (growth >= 10 || !caption.translation) {
    caption.lastTranslatedLength = newText.length;
    translateCaption(caption, "optimistic");
  }
  scheduleSemanticTranslation(caption);
}

export function addCaption(speaker: string, text: string): void {
  if (!speaker || !text) return;

  const normalizedText = text.trim();

  // Check for similar/duplicate in recent captions
  const similarDup = captions
    .slice(-10)
    .find((c) => isSimilarText(c.text, normalizedText));

  if (similarDup) {
    const oldStripped = stripPunctuation(similarDup.text);
    const newStripped = stripPunctuation(normalizedText);
    if (newStripped.length > oldStripped.length) {
      updateCaptionElement(similarDup, normalizedText);
      if (similarDup.speaker === speaker) {
        triggerTranslationIfNeeded(similarDup, normalizedText);
      }
    }
    return;
  }

  // Find recent caption from same speaker
  let speakerCaption: Caption | null = null;
  for (let i = captions.length - 1; i >= Math.max(0, captions.length - 5); i--) {
    if (captions[i].speaker === speaker) {
      speakerCaption = captions[i];
      break;
    }
  }

  if (speakerCaption) {
    const oldText = speakerCaption.text;
    const newText = normalizedText;

    if (oldText === newText) return;

    if (isSimilarText(oldText, newText)) {
      const oldStripped = stripPunctuation(oldText);
      const newStripped = stripPunctuation(newText);
      if (newStripped.length > oldStripped.length) {
        updateCaptionElement(speakerCaption, newText);
        triggerTranslationIfNeeded(speakerCaption, newText);
      }
      return;
    }

    if (isTextGrowing(oldText, newText)) {
      updateCaptionElement(speakerCaption, newText);
      triggerTranslationIfNeeded(speakerCaption, newText);
      return;
    }
  }

  // Create new caption
  const newCaption: Caption = {
    id: getNextCaptionId(),
    speaker,
    text: normalizedText,
    time: new Date().toLocaleTimeString(),
    translation: "",
    translationStatus: "pending",
    lastTranslatedLength: normalizedText.length,
  };

  captions.push(newCaption);
  setWaveActive(true);

  // Remove old captions and clean up their timers
  while (captions.length > MAX_CAPTIONS) {
    const removed = captions.shift();
    if (removed) {
      clearSemanticTimer(removed.id);
    }
  }

  renderCaptions(false);

  if (settings.translationEnabled) {
    translateCaption(newCaption, "optimistic");
    scheduleSemanticTranslation(newCaption);
  }
}
