import type { Caption, TranslateResponse } from "./types";
import { captions, settings } from "./state";
import { updateCaptionTranslation } from "./caption-ui";

// Track ongoing translation requests to prevent duplicates
const pendingTranslations = new Set<number>();

export async function translateCaption(
  captionObj: Caption,
  mode: "optimistic" | "semantic" = "semantic",
  force = false
): Promise<void> {
  // Edge case: Caption ID is being translated already
  if (pendingTranslations.has(captionObj.id)) {
    console.log("[MeetCaptioner] Translation already pending for:", captionObj.id);
    return;
  }

  const apiKey =
    settings.provider === "anthropic"
      ? settings.anthropicApiKey
      : settings.openaiApiKey;

  // Edge case: Translation disabled (and not forced)
  if (!force && !settings.translationEnabled) {
    console.log("[MeetCaptioner] Translation disabled");
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
    console.log("[MeetCaptioner] Empty text, skipping translation");
    return;
  }

  // Save the text we're translating
  const textToTranslate = captionObj.text;
  const captionId = captionObj.id;

  try {
    pendingTranslations.add(captionId);
    captionObj.translationStatus = "translating";
    updateCaptionTranslation(captionObj);

    console.log("[MeetCaptioner] Translating:", captionId, textToTranslate.substring(0, 50));

    const response = (await chrome.runtime.sendMessage({
      action: "translate",
      id: captionId,
      text: textToTranslate,
      targetLang: settings.targetLanguage,
      mode,
      customPrompt: settings.customPrompt,
    })) as TranslateResponse;

    // Edge case: Caption was removed during translation
    const stillExists = captions.find((c) => c.id === captionId);
    if (!stillExists) {
      console.log("[MeetCaptioner] Caption removed during translation:", captionId);
      return;
    }

    // Log if text changed during translation
    if (captionObj.text !== textToTranslate) {
      console.log("[MeetCaptioner] Text changed during translation, applying anyway:", captionId);
    }

    if (response?.success && response.translation) {
      captionObj.translation = response.translation;
      captionObj.translationStatus = "semantic";
      console.log("[MeetCaptioner] Translation success:", captionId, response.translation.substring(0, 50));
      updateCaptionTranslation(captionObj);
    } else {
      // Edge case: API returned error
      captionObj.translationStatus = "error";
      captionObj.translationError = response?.error || "Translation failed";
      console.log("[MeetCaptioner] Translation failed:", captionId, captionObj.translationError);
      updateCaptionTranslation(captionObj);
    }
  } catch (e) {
    // Edge case: Network error or extension error
    captionObj.translationStatus = "error";
    captionObj.translationError = String(e);
    console.log("[MeetCaptioner] Translation error:", captionId, e);
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

  console.log("[MeetCaptioner] Translating all existing:", untranslated.length, "captions");

  for (const caption of untranslated) {
    await translateCaption(caption, "semantic");
  }
}
