import { LANGUAGE_OPTIONS } from "../../shared/language-metadata";

export const MODELS: Record<string, readonly { id: string; name: string }[]> = {
  anthropic: [
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5 (Fastest)" },
    { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
    { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5" },
  ],
  openai: [
    { id: "gpt-5-mini", name: "GPT-5 Mini (Recommended)" },
    { id: "gpt-5.2", name: "GPT-5.2 (Highest Quality)" },
    { id: "gpt-5.1", name: "GPT-5.1" },
    { id: "gpt-5-nano", name: "GPT-5 Nano (Fastest)" },
    { id: "gpt-4.1", name: "GPT-4.1" },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
  ],
  ollama: [],
};

export const LANGUAGES = LANGUAGE_OPTIONS;
