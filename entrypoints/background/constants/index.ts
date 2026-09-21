import { DEFAULT_CAPTION_FONT_SIZE } from "@/shared/constants";
import type { Provider, Settings } from "../types";
import { PROVIDERS } from "../types";

export const MODELS: Record<Provider, readonly string[]> = {
  [PROVIDERS.anthropic]: [
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-5-20250929",
    "claude-opus-4-5-20251101",
  ],
  [PROVIDERS.openai]: [
    "gpt-4.1-nano",
    "gpt-4.1-mini",
    "gpt-4.1",
    "gpt-5-nano",
    "gpt-5-mini",
    "gpt-5",
  ],
  [PROVIDERS.gemini]: [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.1-pro-preview",
  ],
  [PROVIDERS.deepseek]: ["deepseek-flash"],
  [PROVIDERS.ollama]: [],
};

export const DEFAULT_CUSTOM_PROMPT =
  "Translate naturally and smoothly. Keep technical terms and abbreviations as-is (API, ML, etc). Use appropriate formality for business context.";

export const DEFAULT_SETTINGS: Settings = {
  provider: PROVIDERS.openai,
  anthropicApiKey: "",
  openaiApiKey: "",
  geminiApiKey: "",
  deepseekApiKey: "",
  ollamaBaseUrl: "http://localhost:11434",
  ollamaApiKey: "",
  model: "gpt-4.1-nano",
  targetLanguage: "en",
  translationEnabled: false,
  isOverlayMinimized: false,
  captionFontSize: DEFAULT_CAPTION_FONT_SIZE,
  customPrompt: DEFAULT_CUSTOM_PROMPT,
};
