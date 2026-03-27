import type { Caption, TranslateResponse } from "./types";
import { captions, settings } from "./state";
import { updateCaptionTranslation } from "./caption-ui";
import {
  updateCaptionInHistory,
  saveCaptionsDebounced,
} from "./history-service";
import { TranslationStatus } from "./constants";

type TranslateAllCaptionsOptions = {
  force?: boolean;
  includeTranslated?: boolean;
  resetExisting?: boolean;
  overridePending?: boolean;
};

const pendingTranslations = new Map<number, number>();
const translationEpochs = new Map<number, number>();

const CONTEXT_CAPTION_COUNT = 5;

function buildContext(currentCaption: Caption): string {
  const currentIndex = captions.findIndex((c) => c.id === currentCaption.id);
  if (currentIndex <= 0) return "";

  const startIndex = Math.max(0, currentIndex - CONTEXT_CAPTION_COUNT);
  const contextCaptions = captions.slice(startIndex, currentIndex);

  if (contextCaptions.length === 0) return "";

  return contextCaptions.map((c) => `[${c.speaker}]: ${c.text}`).join("\n");
}

function incrementTranslationEpoch(captionId: number): number {
  const nextEpoch = (translationEpochs.get(captionId) || 0) + 1;
  translationEpochs.set(captionId, nextEpoch);
  return nextEpoch;
}

function getTranslationConfigError(): string | null {
  if (settings.provider === "ollama") {
    return null;
  }

  const apiKey =
    settings.provider === "anthropic"
      ? settings.anthropicApiKey
      : settings.openaiApiKey;

  if (!apiKey.trim()) {
    return `API key not configured for ${settings.provider}`;
  }

  return null;
}

function resetCaptionTranslation(captionObj: Caption): void {
  incrementTranslationEpoch(captionObj.id);
  captionObj.translation = "";
  captionObj.translationError = undefined;
  captionObj.translationStatus = TranslationStatus.Pending;
  captionObj.userEdited = false;
  updateCaptionInHistory(captionObj.id, { translation: "" });
  saveCaptionsDebounced();
  updateCaptionTranslation(captionObj);
}

export function isTranslationConfigured(): boolean {
  return getTranslationConfigError() === null;
}

export function openTranslationSettings(): void {
  chrome.runtime.sendMessage({ action: "openOptions" });
}

export function cleanupTranslationState(captionId: number): void {
  pendingTranslations.delete(captionId);
  translationEpochs.delete(captionId);
}

export function resetTranslationState(): void {
  pendingTranslations.clear();
  translationEpochs.clear();
}

export async function translateCaption(
  captionObj: Caption,
  mode: "optimistic" | "semantic" = "semantic",
  force = false,
  overridePending = false
): Promise<void> {
  if (pendingTranslations.has(captionObj.id) && !overridePending) {
    return;
  }

  if (!force && !settings.translationEnabled) {
    return;
  }

  const configError = getTranslationConfigError();
  if (configError) {
    captionObj.translationStatus = TranslationStatus.Error;
    captionObj.translationError = configError;
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
  const requestEpoch = incrementTranslationEpoch(captionId);

  try {
    pendingTranslations.set(captionId, requestEpoch);
    captionObj.translationStatus = TranslationStatus.Translating;
    captionObj.translationError = undefined;
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
      force,
    })) as TranslateResponse;

    const stillExistsInUI = captions.find((c) => c.id === captionId);
    const isLatestRequest = translationEpochs.get(captionId) === requestEpoch;

    if (response?.success && response.translation && isLatestRequest) {
      updateCaptionInHistory(captionId, { translation: response.translation });
      saveCaptionsDebounced();

      if (stillExistsInUI) {
        captionObj.translation = response.translation;
        captionObj.translationStatus = TranslationStatus.Semantic;
        captionObj.translationError = undefined;
        updateCaptionTranslation(captionObj);
      }
    } else if (stillExistsInUI && isLatestRequest) {
      captionObj.translationStatus = TranslationStatus.Error;
      captionObj.translationError = response?.error || "Translation failed";
      updateCaptionTranslation(captionObj);
    }
  } catch (e) {
    if (translationEpochs.get(captionId) === requestEpoch) {
      captionObj.translationStatus = TranslationStatus.Error;
      captionObj.translationError = String(e);
      updateCaptionTranslation(captionObj);
    }
  } finally {
    if (pendingTranslations.get(captionId) === requestEpoch) {
      pendingTranslations.delete(captionId);
    }
  }
}

export function retranslateCaption(captionObj: Caption): void {
  resetCaptionTranslation(captionObj);
  captionObj.isFinalized = false;
  void translateCaption(captionObj, "semantic", true, true);
}

export function manualTranslate(captionObj: Caption): void {
  resetCaptionTranslation(captionObj);
  void translateCaption(captionObj, "semantic", true, true);
}

export async function translateAllExistingCaptions(
  options: TranslateAllCaptionsOptions = {}
): Promise<void> {
  const {
    force = false,
    includeTranslated = false,
    resetExisting = false,
    overridePending = false,
  } = options;

  const captionsToTranslate = captions.filter(
    (c) =>
      c.text.trim().length > 0 &&
      (includeTranslated || !c.translation) &&
      (overridePending || !pendingTranslations.has(c.id))
  );

  for (const caption of captionsToTranslate) {
    if (resetExisting) {
      resetCaptionTranslation(caption);
    }

    await translateCaption(caption, "semantic", force, overridePending);
  }
}
