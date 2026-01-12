export type Settings = {
  provider: "anthropic" | "openai" | "ollama";
  anthropicApiKey: string;
  openaiApiKey: string;
  ollamaBaseUrl: string;
  ollamaApiKey: string;
  model: string;
  targetLanguage: string;
  translationEnabled: boolean;
  customPrompt: string;
};

export const DEFAULT_CUSTOM_PROMPT =
  "Translate naturally and smoothly. Keep technical terms and abbreviations as-is (API, ML, etc). Use appropriate formality for business context.";

export const DEFAULT_SETTINGS: Settings = {
  provider: "openai",
  anthropicApiKey: "",
  openaiApiKey: "",
  ollamaBaseUrl: "http://localhost:11434",
  ollamaApiKey: "",
  model: "gpt-4.1-nano",
  targetLanguage: "en",
  translationEnabled: false,
  customPrompt: DEFAULT_CUSTOM_PROMPT,
};
