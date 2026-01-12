import type { TranslateRequest, TranslateResponse } from "./types";
import { PROVIDERS } from "./types";
import { MODELS } from "./constants";
import { RateLimitError } from "./errors";
import { sanitizeError } from "./utils";
import { getSettings } from "./settings";
import { translateWithAnthropic } from "./providers/anthropic";
import { translateWithOpenAI } from "./providers/openai";
import { translateWithOllama } from "./providers/ollama";

export async function translate(
  request: TranslateRequest
): Promise<TranslateResponse> {
  const { settings } = await getSettings();

  if (settings.provider === PROVIDERS.ollama) {
    if (!settings.ollamaBaseUrl) {
      return {
        success: false,
        error: "Ollama base URL not configured",
      };
    }
    const isCloudUrl = settings.ollamaBaseUrl.includes("ollama.com");
    if (isCloudUrl && !settings.ollamaApiKey) {
      return {
        success: false,
        error: "API key required for Ollama Cloud",
      };
    }
  } else {
    const apiKey =
      settings.provider === PROVIDERS.anthropic
        ? settings.anthropicApiKey
        : settings.openaiApiKey;

    if (!apiKey) {
      return {
        success: false,
        error: `API key not configured for ${settings.provider}`,
      };
    }
  }

  if (!settings.translationEnabled) {
    return { success: false, error: "Translation disabled" };
  }

  if (settings.provider === PROVIDERS.ollama) {
    try {
      const translation = await translateWithOllama(
        request,
        settings.ollamaBaseUrl,
        settings.model,
        settings.ollamaApiKey || undefined
      );
      return {
        success: true,
        id: request.id,
        translation,
        mode: request.mode,
      };
    } catch (error) {
      return {
        success: false,
        id: request.id,
        error: sanitizeError(error),
      };
    }
  }

  const apiKey =
    settings.provider === PROVIDERS.anthropic
      ? settings.anthropicApiKey
      : settings.openaiApiKey;

  const modelList = MODELS[settings.provider];
  const startIndex = modelList.indexOf(settings.model);
  const modelsToTry =
    startIndex >= 0
      ? [...modelList.slice(startIndex), ...modelList.slice(0, startIndex)]
      : modelList;

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const translation =
        settings.provider === PROVIDERS.anthropic
          ? await translateWithAnthropic(request, apiKey, model)
          : await translateWithOpenAI(request, apiKey, model);

      return {
        success: true,
        id: request.id,
        translation,
        mode: request.mode,
      };
    } catch (error) {
      lastError = error as Error;
      if (error instanceof RateLimitError) {
        continue;
      }
      break;
    }
  }

  return {
    success: false,
    id: request.id,
    error: sanitizeError(lastError),
  };
}
