import type { Caption, TranslateResponse } from "./types";
import { captions, settings } from "./state";
import { updateCaptionTranslation } from "./caption-ui";

// Track ongoing translation requests to prevent duplicates
const pendingTranslations = new Set<number>();

// Number of previous captions to include as context
const CONTEXT_CAPTION_COUNT = 5;

function buildContext(currentCaption: Caption): string {
  // Find index of current caption
  const currentIndex = captions.findIndex((c) => c.id === currentCaption.id);
  if (currentIndex <= 0) return "";

  // Get previous captions for context
  const startIndex = Math.max(0, currentIndex - CONTEXT_CAPTION_COUNT);
  const contextCaptions = captions.slice(startIndex, currentIndex);

  if (contextCaptions.length === 0) return "";

  return contextCaptions
    .map((c) => `[${c.speaker}]: ${c.text}`)
    .join("\n");
}

export async function translateCaption(
  captionObj: Caption,
  mode: "optimistic" | "semantic" = "semantic",
  force = false
): Promise<void> {
  // Edge case: Caption ID is being translated already
  if (pendingTranslations.has(captionObj.id)) {
    return;
  }

  const apiKey =
    settings.provider === "anthropic"
      ? settings.anthropicApiKey
      : settings.openaiApiKey;

  // Edge case: Translation disabled (and not forced)
  if (!force && !settings.translationEnabled) {
    return;
  }

  // Edge case: No API key
  if (!apiKey) {
    captionObj.translationStatus = "error";
    captionObj.translationError = "No API key configured";
    updateCaptionTranslation(captionObj);
    return;
  }

  // Edge case: Empty text
  if (!captionObj.text || captionObj.text.trim().length === 0) {
    return;
  }

  // Save the text we're translating
  const textToTranslate = captionObj.text;
  const captionId = captionObj.id;
  const speaker = captionObj.speaker;
  const context = buildContext(captionObj);

  try {
    pendingTranslations.add(captionId);
    captionObj.translationStatus = "translating";
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

    // Edge case: Caption was removed during translation
    const stillExists = captions.find((c) => c.id === captionId);
    if (!stillExists) {
      return;
    }

    if (response?.success && response.translation) {
      captionObj.translation = response.translation;
      captionObj.translationStatus = "semantic";
      updateCaptionTranslation(captionObj);
    } else {
      // Edge case: API returned error
      captionObj.translationStatus = "error";
      captionObj.translationError = response?.error || "Translation failed";
      updateCaptionTranslation(captionObj);
    }
  } catch (e) {
    // Edge case: Network error or extension error
    captionObj.translationStatus = "error";
    captionObj.translationError = String(e);
    updateCaptionTranslation(captionObj);
  } finally {
    pendingTranslations.delete(captionId);
  }
}

export function retranslateCaption(captionObj: Caption): void {
  // Clear current translation
  captionObj.translation = "";
  captionObj.translationStatus = "pending";
  captionObj.isFinalized = false;
  translateCaption(captionObj, "semantic");
}

export function manualTranslate(captionObj: Caption): void {
  // Force translate even if disabled
  translateCaption(captionObj, "semantic", true);
}

export async function translateAllExistingCaptions(): Promise<void> {
  const untranslated = captions.filter(
    (c) =>
      !c.translation &&
      c.translationStatus !== "translating" &&
      !pendingTranslations.has(c.id)
  );

  for (const caption of untranslated) {
    await translateCaption(caption, "semantic");
  }
}
