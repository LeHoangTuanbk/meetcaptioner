import { DEFAULT_CUSTOM_PROMPT } from "./constants";
import {
  createOverlay,
  destroyOverlay,
  updateUIFromSettings,
} from "./overlay";
import {
  initMeetingSession,
  resetMeetingSession,
  updateSessionEndTime,
} from "./history-service";
import {
  getProviderByPlatform,
  getProviderForPageContext,
  getProviderForUrl,
} from "./providers/registry";
import {
  resetContentState,
  setCaptureGuide,
  setEmptyStateMessage,
  updateSettings,
} from "./state";
import { openCaptureGuide } from "./overlay/capture-guide";
import type { MeetingProvider } from "./providers/types";

let runtimeInitialized = false;
let stopObservingCurrentProvider: (() => void) | null = null;
let activeProviderPlatform: MeetingProvider["platform"] | null = null;
let lifecycleMonitorId: number | null = null;

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
  const url = new URL(window.location.href);
  return (
    getProviderForUrl(url) !== null || getProviderForPageContext(url) !== null
  );
}

export async function initializePlatformRuntime(
  initialProviderPlatform?: MeetingProvider["platform"]
): Promise<(() => void) | null> {
  if (runtimeInitialized) {
    return () => undefined;
  }

  if (!document.body) {
    return null;
  }

  const provider =
    (initialProviderPlatform
      ? getProviderByPlatform(initialProviderPlatform)
      : null) ||
    getProviderForUrl(new URL(window.location.href)) ||
    getProviderForPageContext(new URL(window.location.href));

  if (!provider) {
    return null;
  }

  setEmptyStateMessage(provider.getEmptyState());
  setCaptureGuide(provider.getCaptureGuide());

  createOverlay();
  await loadSettings();

  await provider.bootstrap();

  const stopObserving = provider.startCaptionObserver();
  stopObservingCurrentProvider = stopObserving;
  activeProviderPlatform = provider.platform;
  runtimeInitialized = true;

  initMeetingSession(provider.getSessionMetadata(), () =>
    provider.getSessionMetadata()
  );

  if (!provider.isCaptioningCurrentlyAvailable()) {
    openCaptureGuide();
  }

  window.addEventListener("beforeunload", () => {
    updateSessionEndTime();
  });

  startLifecycleMonitor();

  return stopObserving;
}

function startLifecycleMonitor(): void {
  if (lifecycleMonitorId !== null) {
    window.clearInterval(lifecycleMonitorId);
  }

  lifecycleMonitorId = window.setInterval(() => {
    if (!runtimeInitialized || !activeProviderPlatform) {
      return;
    }

    const provider = getProviderByPlatform(activeProviderPlatform);
    if (!provider) {
      teardownPlatformRuntime();
      return;
    }

    const currentUrl = new URL(window.location.href);
    const isStillActive =
      provider.matchesUrl(currentUrl) ||
      provider.matchesPageContext?.(currentUrl) ||
      false;

    if (!isStillActive) {
      teardownPlatformRuntime();
    }
  }, 1500);
}

function teardownPlatformRuntime(): void {
  if (!runtimeInitialized) {
    return;
  }

  stopObservingCurrentProvider?.();
  stopObservingCurrentProvider = null;

  if (lifecycleMonitorId !== null) {
    window.clearInterval(lifecycleMonitorId);
    lifecycleMonitorId = null;
  }

  updateSessionEndTime();
  destroyOverlay();
  resetMeetingSession();
  resetContentState();

  runtimeInitialized = false;
  activeProviderPlatform = null;
}
