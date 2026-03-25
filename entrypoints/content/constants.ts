import { LANGUAGE_OPTIONS } from "../shared/language-metadata";

export const MAX_CAPTIONS = 200;
export const SEMANTIC_DELAY = 1500;
// TODO: Refining, Semantic, Optimistic has not been used yet. Consider refactor code
export const TranslationStatus = {
  Pending: "pending",
  Translating: "translating",
  Refining: "refining",
  Optimistic: "optimistic",
  Semantic: "semantic",
  Error: "error",
} as const;

export type TranslationStatus =
  (typeof TranslationStatus)[keyof typeof TranslationStatus];

export const LANGUAGES = LANGUAGE_OPTIONS;

export const MODELS = {
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
} as const;

export const DEFAULT_CUSTOM_PROMPT =
  "Translate naturally and smoothly. Keep technical terms and abbreviations as-is (API, ML, etc). Use appropriate formality for business context.";
