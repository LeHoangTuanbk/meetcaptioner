import type { Caption, Settings } from "./types";
import { DEFAULT_CUSTOM_PROMPT } from "./constants";

export const captions: Caption[] = [];

export let settings: Settings = {
  provider: "openai",
  anthropicApiKey: "",
  openaiApiKey: "",
  model: "gpt-4.1-nano",
  targetLanguage: "en",
  translationEnabled: false,
  customPrompt: DEFAULT_CUSTOM_PROMPT,
};

export function updateSettings(newSettings: Partial<Settings>) {
  settings = { ...settings, ...newSettings };
}

export let captionIdCounter = 0;
export function getNextCaptionId() {
  return ++captionIdCounter;
}

export let isCCEnabled = false;
export function setCCEnabled(enabled: boolean) {
  isCCEnabled = enabled;
}

// Semantic translation timers per caption
export const semanticTimers = new Map<number, ReturnType<typeof setTimeout>>();

// Clean up timer for a specific caption
export function clearSemanticTimer(captionId: number) {
  const timer = semanticTimers.get(captionId);
  if (timer) {
    clearTimeout(timer);
    semanticTimers.delete(captionId);
  }
}

// UI element references
export let overlay: HTMLElement | null = null;
export let captionList: HTMLElement | null = null;
export let waveElement: HTMLElement | null = null;
export let waveTimeout: ReturnType<typeof setTimeout> | null = null;
export let isMinimized = false;

export function setOverlay(el: HTMLElement | null) {
  overlay = el;
}

export function setCaptionList(el: HTMLElement | null) {
  captionList = el;
}

export function setWaveElement(el: HTMLElement | null) {
  waveElement = el;
}

export function setWaveTimeout(timeout: ReturnType<typeof setTimeout> | null) {
  waveTimeout = timeout;
}

export function setMinimized(minimized: boolean) {
  isMinimized = minimized;
}
