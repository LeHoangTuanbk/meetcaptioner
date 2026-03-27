import type { Caption, Settings } from "./types";
import { DEFAULT_CUSTOM_PROMPT } from "./constants";
import type {
  PlatformEmptyState,
  ProviderCaptureGuide,
} from "./providers/types";

export const captions: Caption[] = [];

export let settings: Settings = {
  provider: "openai",
  anthropicApiKey: "",
  openaiApiKey: "",
  model: "gpt-5-mini",
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

export function resetCaptionIdCounter() {
  captionIdCounter = 0;
}

export let isCCEnabled = false;
export function setCCEnabled(enabled: boolean) {
  isCCEnabled = enabled;
}

export let emptyStateMessage: PlatformEmptyState = {
  waitingTitle: "Waiting for captions...",
  waitingBody: "Enable captions in your meeting to start capturing text",
};

export function setEmptyStateMessage(message: PlatformEmptyState) {
  emptyStateMessage = message;
}

export const semanticTimers = new Map<number, ReturnType<typeof setTimeout>>();

export function clearSemanticTimer(captionId: number) {
  const timer = semanticTimers.get(captionId);
  if (timer) {
    clearTimeout(timer);
    semanticTimers.delete(captionId);
  }
}

export let overlay: HTMLElement | null = null;
export let captionList: HTMLElement | null = null;
export let waveElement: HTMLElement | null = null;
export let waveTimeout: ReturnType<typeof setTimeout> | null = null;
export let captureGuide: ProviderCaptureGuide | null = null;
export let isCaptureGuideOpen = false;
export let captureGuideElement: HTMLElement | null = null;
export let isMinimized = false;
export let savedPosition: {
  left: string;
  top: string;
  width: string;
  height: string;
} | null = null;

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

export function setCaptureGuide(guide: ProviderCaptureGuide | null) {
  captureGuide = guide;
}

export function setCaptureGuideOpen(open: boolean) {
  isCaptureGuideOpen = open;
}

export function setCaptureGuideElement(el: HTMLElement | null) {
  captureGuideElement = el;
}

export function setMinimized(minimized: boolean) {
  isMinimized = minimized;
}

export function setSavedPosition(
  pos: { left: string; top: string; width: string; height: string } | null
) {
  savedPosition = pos;
}

export function resetContentState(): void {
  captions.length = 0;
  resetCaptionIdCounter();
  isCCEnabled = false;
  emptyStateMessage = {
    waitingTitle: "Waiting for captions...",
    waitingBody: "Enable captions in your meeting to start capturing text",
  };
  captureGuide = null;
  isCaptureGuideOpen = false;
  overlay = null;
  captionList = null;
  waveElement = null;
  captureGuideElement = null;
  isMinimized = false;
  savedPosition = null;

  if (waveTimeout) {
    clearTimeout(waveTimeout);
    waveTimeout = null;
  }
}
