import type { Caption, TranslateResponse } from "./types";
import { captions, settings } from "./state";
import { updateCaptionTranslation } from "./caption-ui";
import {
  updateCaptionInHistory,
  saveCaptionsDebounced,
} from "./history-service";
import { TranslationStatus } from "./constants";

const pendingTranslations = new Set<number>();

const CONTEXT_CAPTION_COUNT = 5;

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
  force = false
): Promise<void> {
  if (pendingTranslations.has(captionObj.id)) {
    return;
  }

  const apiKey =
    settings.provider === "anthropic"
      ? settings.anthropicApiKey
      : settings.openaiApiKey;

  if (!force && !settings.translationEnabled) {
    return;
  }

  if (!apiKey) {
    captionObj.translationStatus = TranslationStatus.Error;
    captionObj.translationError = "No API key configured";
    updateCaptionTranslation(captionObj);
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
    updateCaptionTranslation(captionObj);

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
        updateCaptionTranslation(captionObj);
      }
    } else if (stillExistsInUI) {
      captionObj.translationStatus = TranslationStatus.Error;
      captionObj.translationError = response?.error || "Translation failed";
      updateCaptionTranslation(captionObj);
    }
  } catch (e) {
    captionObj.translationStatus = TranslationStatus.Error;
    captionObj.translationError = String(e);
    updateCaptionTranslation(captionObj);
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

export async function translateAllExistingCaptions(): Promise<void> {
  const untranslated = captions.filter(
    (c) =>
      !c.translation &&
      c.translationStatus !== TranslationStatus.Translating &&
      !pendingTranslations.has(c.id)
  );

  for (const caption of untranslated) {
    await translateCaption(caption, "semantic");
  }
}
