import { DEFAULT_CUSTOM_PROMPT } from "./constants";
import { createOverlay, updateUIFromSettings } from "./overlay";
import { initMeetingSession, updateSessionEndTime } from "./history-service";
import { getProviderForUrl } from "./providers/registry";
import { setCaptureGuide, setEmptyStateMessage, updateSettings } from "./state";
import { openCaptureGuide } from "./overlay/capture-guide";

async function loadSettings(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "getSettings",
    });

    if (response?.success && response.settings) {
      const saved = response.settings;
      updateSettings(saved);
      if (saved.customPrompt !== undefined) {
        updateSettings({ customPrompt: saved.customPrompt });
      } else {
        updateSettings({ customPrompt: DEFAULT_CUSTOM_PROMPT });
      }
      updateUIFromSettings();
    }
  } catch {
    // Settings could not be loaded, using defaults
  }
}

export function isSupportedMeetingPage(): boolean {
  return getProviderForUrl(new URL(window.location.href)) !== null;
}

export async function initializePlatformRuntime(): Promise<(() => void) | null> {
  const provider = getProviderForUrl(new URL(window.location.href));
  if (!provider) {
    return null;
  }

  setEmptyStateMessage(provider.getEmptyState());
  setCaptureGuide(provider.getCaptureGuide());

  createOverlay();
  await loadSettings();

  await provider.bootstrap();

  const stopObserving = provider.startCaptionObserver();

  initMeetingSession(provider.getSessionMetadata(), () =>
    provider.getSessionMetadata()
  );

  if (!provider.isCaptioningCurrentlyAvailable()) {
    openCaptureGuide();
  }

  window.addEventListener("beforeunload", () => {
    updateSessionEndTime();
  });

  return stopObserving;
}
