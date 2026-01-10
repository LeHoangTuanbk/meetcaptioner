export const MODELS: Record<string, readonly { id: string; name: string }[]> = {
  anthropic: [
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5 (Fastest)" },
    { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
    { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5" },
  ],
  openai: [
    { id: "gpt-4.1-nano", name: "GPT-4.1 Nano (Fastest)" },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
    { id: "gpt-5-nano", name: "GPT-5 Nano" },
  ],
  ollama: [],
};

export const LANGUAGES = [
  { code: "vi", name: "Vietnamese" },
  { code: "en", name: "English" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "it", name: "Italian" },
  { code: "th", name: "Thai" },
  { code: "id", name: "Indonesian" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
] as const;
