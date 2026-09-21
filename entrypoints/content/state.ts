import type { Caption, Settings } from "@content/types";
import { DEFAULT_CAPTION_FONT_SIZE } from "@/shared/constants";
import { DEFAULT_CUSTOM_PROMPT } from "@content/constants";

export const captions: Caption[] = [];

type StateListener = () => void;

const listeners = new Set<StateListener>();
let stateVersion = 0;

export function subscribe(listener: StateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getStateVersion(): number {
  return stateVersion;
}

export function notifyStateChange(): void {
  stateVersion += 1;
  listeners.forEach((listener) => listener());
}

export let settings: Settings = {
  provider: "openai",
  anthropicApiKey: "",
  openaiApiKey: "",
  geminiApiKey: "",
  ollamaBaseUrl: "http://localhost:11434",
  ollamaApiKey: "",
  model: "gpt-4.1-nano",
  targetLanguage: "en",
  translationEnabled: false,
  captionFontSize: DEFAULT_CAPTION_FONT_SIZE,
  customPrompt: DEFAULT_CUSTOM_PROMPT,
};

export function updateSettings(newSettings: Partial<Settings>) {
  settings = { ...settings, ...newSettings };
  notifyStateChange();
}

export const hasActiveProviderCredentials = (): boolean => {
  switch (settings.provider) {
    case "anthropic":
      return Boolean(settings.anthropicApiKey);
    case "gemini":
      return Boolean(settings.geminiApiKey);
    case "ollama":
      return (
        Boolean(settings.ollamaBaseUrl) &&
        (!settings.ollamaBaseUrl.includes("ollama.com") ||
          Boolean(settings.ollamaApiKey))
      );
    default:
      return Boolean(settings.openaiApiKey);
  }
};

export let captionIdCounter = 0;
export function getNextCaptionId() {
  return ++captionIdCounter;
}

export let isCCEnabled = false;
export function setCCEnabled(enabled: boolean) {
  isCCEnabled = enabled;
  notifyStateChange();
}

export let isWaveActive = false;
export function setWaveActiveState(active: boolean): void {
  isWaveActive = active;
  notifyStateChange();
}

export const semanticTimers = new Map<number, ReturnType<typeof setTimeout>>();

export function clearSemanticTimer(captionId: number) {
  const timer = semanticTimers.get(captionId);
  if (timer) {
    clearTimeout(timer);
    semanticTimers.delete(captionId);
  }
}

export let waveTimeout: ReturnType<typeof setTimeout> | null = null;

export function setWaveTimeout(timeout: ReturnType<typeof setTimeout> | null) {
  waveTimeout = timeout;
}
