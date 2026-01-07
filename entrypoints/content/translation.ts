import type { Caption, TranslateResponse } from "./types";
import { SEMANTIC_DELAY } from "./constants";
import { captions, settings, semanticTimers } from "./state";
import { updateCaptionTranslation } from "./caption-ui";

export async function translateCaption(
  captionObj: Caption,
  mode: "optimistic" | "semantic" = "optimistic",
  force = false
): Promise<void> {
  const apiKey =
    settings.provider === "anthropic"
      ? settings.anthropicApiKey
      : settings.openaiApiKey;

  if (!force && !settings.translationEnabled) {
    return;
  }

  if (!apiKey) {
    captionObj.translationStatus = "error";
    captionObj.translationError = "No API key configured";
    updateCaptionTranslation(captionObj);
    return;
  }

  let context: string | undefined;
  if (mode === "semantic") {
    const recentCaptions = captions.slice(-5);
    const contextParts = recentCaptions.map((c) => {
      if (c.userEdited && c.translation) {
        return `"${c.text}" = "${c.translation}"`;
      }
      return c.text;
    });
    context = contextParts.join(" | ");
  }

  try {
    captionObj.translationStatus = mode === "optimistic" ? "translating" : "refining";
    updateCaptionTranslation(captionObj);

    const response = await chrome.runtime.sendMessage({
      action: "translate",
      id: captionObj.id,
      text: captionObj.text,
      targetLang: settings.targetLanguage,
      mode,
      context,
      customPrompt: settings.customPrompt,
    }) as TranslateResponse;

    if (response?.success && response.translation) {
      captionObj.translation = response.translation;
      captionObj.translationStatus = mode;
      updateCaptionTranslation(captionObj);
    } else {
      captionObj.translationStatus = "error";
      captionObj.translationError = response?.error || "Translation failed";
      updateCaptionTranslation(captionObj);
    }
  } catch (e) {
    captionObj.translationStatus = "error";
    captionObj.translationError = String(e);
    updateCaptionTranslation(captionObj);
  }
}

export function scheduleSemanticTranslation(captionObj: Caption): void {
  if (semanticTimers.has(captionObj.id)) {
    clearTimeout(semanticTimers.get(captionObj.id));
  }

  const textLengthAtSchedule = captionObj.text.length;

  const timer = setTimeout(() => {
    semanticTimers.delete(captionObj.id);
    const textChanged = captionObj.text.length !== textLengthAtSchedule;
    if (textChanged || captionObj.translationStatus !== "semantic") {
      translateCaption(captionObj, "semantic");
    }
  }, SEMANTIC_DELAY);

  semanticTimers.set(captionObj.id, timer);
}

export function retranslateCaption(captionObj: Caption): void {
  captionObj.translation = "";
  captionObj.translationStatus = "pending";
  captionObj.lastTranslatedLength = 0;
  translateCaption(captionObj, "semantic");
}

export function manualTranslate(captionObj: Caption): void {
  translateCaption(captionObj, "semantic", true);
}
