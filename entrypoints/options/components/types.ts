import { DEFAULT_CAPTION_FONT_SIZE } from "@/shared/constants";

export type Settings = {
  provider: "anthropic" | "openai" | "gemini" | "deepseek" | "ollama";
  anthropicApiKey: string;
  openaiApiKey: string;
  geminiApiKey: string;
  deepseekApiKey: string;
  ollamaBaseUrl: string;
  ollamaApiKey: string;
  model: string;
  targetLanguage: string;
  translationEnabled: boolean;
  captionFontSize: number;
  customPrompt: string;
};

export type Provider = Settings["provider"];

export const DEFAULT_CUSTOM_PROMPT =
  "Translate naturally and smoothly. Keep technical terms and abbreviations as-is (API, ML, etc). Use appropriate formality for business context.";

export const DEFAULT_SETTINGS: Settings = {
  provider: "openai",
  anthropicApiKey: "",
  openaiApiKey: "",
  geminiApiKey: "",
  deepseekApiKey: "",
  ollamaBaseUrl: "http://localhost:11434",
  ollamaApiKey: "",
  model: "gpt-4.1-nano",
  targetLanguage: "en",
  translationEnabled: false,
  captionFontSize: DEFAULT_CAPTION_FONT_SIZE,
  customPrompt: DEFAULT_CUSTOM_PROMPT,
};
