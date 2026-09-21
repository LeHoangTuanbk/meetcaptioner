import type { Caption } from "@content/types";
import { MAX_CAPTIONS, TranslationStatus } from "@content/constants";
import {
  captions,
  settings,
  getNextCaptionId,
  waveTimeout,
  setWaveTimeout,
  clearSemanticTimer,
  setWaveActiveState,
  notifyStateChange,
} from "@content/state";
import { enqueueTranslation } from "@content/translation-queue";
import { scrollToBottomIfNeeded } from "@content/overlay/runtime";
import {
  saveCaptionsDebounced,
  addCaptionToHistory,
  updateCaptionInHistory,
} from "@content/history-service";

export function setWaveActive(active: boolean): void {
  if (active) {
    setWaveActiveState(true);
    if (waveTimeout) clearTimeout(waveTimeout);
    setWaveTimeout(
      setTimeout(() => {
        setWaveActiveState(false);
      }, 3000)
    );
  } else {
    setWaveActiveState(false);
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

      const needsRetranslate = caption.isFinalized && textChanged;
      if (needsRetranslate) {
        caption.translationStatus = TranslationStatus.Pending;
      }
      caption.isFinalized = false;

      notifyStateChange();
      scrollToBottomIfNeeded();

      updateCaptionInHistory(captionId, { text });
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
    translationStatus: TranslationStatus.Pending,
    lastTranslatedLength: 0,
    isFinalized: false,
  };

  captions.push(newCaption);

  addCaptionToHistory(newCaption);

  while (captions.length > MAX_CAPTIONS) {
    const removed = captions.shift();
    if (removed) {
      clearSemanticTimer(removed.id);
    }
  }

  notifyStateChange();
  scrollToBottomIfNeeded();
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
    // Skip if already has translation and not pending retranslate
    if (
      caption.translation &&
      caption.translationStatus !== TranslationStatus.Error &&
      caption.translationStatus !== TranslationStatus.Pending
    ) {
      return;
    }

    if (caption.translationStatus === TranslationStatus.Translating) {
      return;
    }

    enqueueTranslation(caption.id);
  }

  saveCaptionsDebounced();
}

export function addCaption(speaker: string, text: string): void {
  addOrUpdateCaption(null, speaker, text);
}
