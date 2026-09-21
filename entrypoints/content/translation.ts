import type { Caption, TranslateResponse } from "@content/types";
import {
  captions,
  settings,
  hasActiveProviderCredentials,
  notifyStateChange,
} from "@content/state";
import { scrollToBottomIfNeeded } from "@content/overlay/runtime";
import {
  updateCaptionInHistory,
  saveCaptionsDebounced,
} from "@content/history-service";
import { TranslationStatus } from "@content/constants";

const pendingTranslations = new Set<number>();

const CONTEXT_CAPTION_COUNT = 5;

function refreshCaption(): void {
  notifyStateChange();
  scrollToBottomIfNeeded();
}

function buildContext(currentCaption: Caption): string {
  const currentIndex = captions.findIndex((c) => c.id === currentCaption.id);
  if (currentIndex <= 0) return "";

  const startIndex = Math.max(0, currentIndex - CONTEXT_CAPTION_COUNT);
  const contextCaptions = captions.slice(startIndex, currentIndex);

  if (contextCaptions.length === 0) return "";

  return contextCaptions.map((c) => `[${c.speaker}]: ${c.text}`).join("\n");
}

export async function translateCaption(
  captionObj: Caption,
  mode: "optimistic" | "semantic" = "semantic",
  force = false,
): Promise<void> {
  if (pendingTranslations.has(captionObj.id)) {
    return;
  }

  if (!force && !settings.translationEnabled) {
    return;
  }

  if (!hasActiveProviderCredentials()) {
    captionObj.translationStatus = TranslationStatus.Error;
    captionObj.translationError =
      "Provider credentials are not configured correctly";
    refreshCaption();
    return;
  }

  if (!captionObj.text || captionObj.text.trim().length === 0) {
    return;
  }

  const textToTranslate = captionObj.text;
  const captionId = captionObj.id;
  const speaker = captionObj.speaker;
  const context = buildContext(captionObj);

  try {
    pendingTranslations.add(captionId);
    captionObj.translationStatus = TranslationStatus.Translating;
    refreshCaption();

    const response = (await chrome.runtime.sendMessage({
      action: "translate",
      id: captionId,
      text: textToTranslate,
      targetLang: settings.targetLanguage,
      mode,
      speaker,
      context,
      customPrompt: settings.customPrompt,
    })) as TranslateResponse;

    const stillExistsInUI = captions.find((c) => c.id === captionId);

    if (response?.success && response.translation) {
      updateCaptionInHistory(captionId, { translation: response.translation });
      saveCaptionsDebounced();

      if (stillExistsInUI) {
        captionObj.translation = response.translation;
        captionObj.translationStatus = TranslationStatus.Semantic;
        refreshCaption();
      }
    } else if (stillExistsInUI) {
      captionObj.translationStatus = TranslationStatus.Error;
      captionObj.translationError = response?.error || "Translation failed";
      refreshCaption();
    }
  } catch (e) {
    captionObj.translationStatus = TranslationStatus.Error;
    captionObj.translationError = String(e);
    refreshCaption();
  } finally {
    pendingTranslations.delete(captionId);
  }
}

export function retranslateCaption(captionObj: Caption): void {
  captionObj.translationStatus = TranslationStatus.Pending;
  captionObj.isFinalized = false;
  translateCaption(captionObj, "semantic");
}

export function manualTranslate(captionObj: Caption): void {
  translateCaption(captionObj, "semantic", true);
}
