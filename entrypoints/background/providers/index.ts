import type { Settings, TranslateRequest } from "../types";
import { PROVIDERS } from "../types";
import { translateWithAnthropic } from "./anthropic";
import { translateWithDeepSeek } from "./deepseek";
import { translateWithGemini } from "./gemini";
import { translateWithOpenAI } from "./openai";

export const translateWithProvider = (
  settings: Settings,
  request: TranslateRequest,
  apiKey: string,
  model: string
): Promise<string> => {
  switch (settings.provider) {
    case PROVIDERS.anthropic:
      return translateWithAnthropic(request, apiKey, model);
    case PROVIDERS.gemini:
      return translateWithGemini(request, apiKey, model);
    case PROVIDERS.deepseek:
      return translateWithDeepSeek(request, apiKey, model);
    case PROVIDERS.openai:
      return translateWithOpenAI(request, apiKey, model);
    case PROVIDERS.ollama:
      throw new Error("Ollama must use its dedicated translation flow");
  }
};
