import type { Settings } from "../types";
import { PROVIDERS } from "../types";

export const MODELS: Record<string, string[]> = {
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
  [PROVIDERS.ollama]: [],
};

export const DEFAULT_CUSTOM_PROMPT =
  "Translate naturally and smoothly. Keep technical terms and abbreviations as-is (API, ML, etc). Use appropriate formality for business context.";

export const DEFAULT_SETTINGS: Settings = {
  provider: PROVIDERS.openai,
  anthropicApiKey: "",
  openaiApiKey: "",
  ollamaBaseUrl: "http://localhost:11434",
  ollamaApiKey: "",
  model: "gpt-4.1-nano",
  targetLanguage: "en",
  translationEnabled: false,
  customPrompt: DEFAULT_CUSTOM_PROMPT,
};

export const LANGUAGES: Record<string, string> = {
  vi: "Vietnamese",
  en: "English",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  ru: "Russian",
  ar: "Arabic",
  hi: "Hindi",
  it: "Italian",
  th: "Thai",
  id: "Indonesian",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
};
