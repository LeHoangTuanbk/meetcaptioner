import { captions, setCCEnabled, isCCEnabled } from "../state";
import { addOrUpdateCaption, finalizeCaption } from "../caption";
import { renderCaptions } from "../render";
import { closeCaptureGuide } from "../overlay/capture-guide";
import { getProviderLabel } from "../../shared/meeting-session";
import type { MeetingProvider } from "./types";

let currentCaptionRegion: HTMLElement | null = null;

const elementToCaptionId = new WeakMap<Element, number>();
const elementLastText = new WeakMap<Element, string>();
const elementLastSpeaker = new WeakMap<Element, string>();
const finalizationTimers = new Map<number, ReturnType<typeof setTimeout>>();

const FINALIZE_DELAY = 1500;

function getMeetingCodeFromUrl(): string | undefined {
  const match = window.location.pathname.match(/\/([a-z]{3}-[a-z]{4}-[a-z]{3})(?:\/|$)/);
  return match ? match[1] : undefined;
}

function getMeetingTitle(): string | undefined {
  const el = document.querySelector("[data-meeting-title]");
  return el?.getAttribute("data-meeting-title") || undefined;
}

function processCaption(entry: Element): void {
  const speakerEl = entry.querySelector(".NWpY1d");
  const speaker = speakerEl?.textContent?.trim() || "Unknown";

  const textEl = entry.querySelector(".ygicle");
  if (!textEl) {
    return;
  }

  const text = textEl.textContent?.trim();
  if (!text || text.length < 2) {
    return;
  }

  const lastText = elementLastText.get(entry);
  const lastSpeaker = elementLastSpeaker.get(entry);
  if (lastText === text && lastSpeaker === speaker) {
    return;
  }

  elementLastText.set(entry, text);
  elementLastSpeaker.set(entry, speaker);

  const existingCaptionId = elementToCaptionId.get(entry);

  if (existingCaptionId !== undefined) {
    const caption = captions.find((item) => item.id === existingCaptionId);

    if (!caption) {
      cancelFinalization(existingCaptionId);
      const newId = addOrUpdateCaption(null, speaker, text);
      elementToCaptionId.set(entry, newId);
      scheduleFinalization(newId);
      return;
    }

    if (caption.speaker === speaker) {
      if (text !== caption.text) {
        addOrUpdateCaption(existingCaptionId, speaker, text);
        scheduleFinalization(existingCaptionId);
      }
    } else {
      cancelFinalization(existingCaptionId);
      finalizeCaption(existingCaptionId);

      const newId = addOrUpdateCaption(null, speaker, text);
      elementToCaptionId.set(entry, newId);
      scheduleFinalization(newId);
    }

    return;
  }

  finalizePendingCaptions();

  const newId = addOrUpdateCaption(null, speaker, text);
  elementToCaptionId.set(entry, newId);
  scheduleFinalization(newId);
}

function scheduleFinalization(captionId: number): void {
  cancelFinalization(captionId);

  const timer = setTimeout(() => {
    finalizationTimers.delete(captionId);
    const caption = captions.find((item) => item.id === captionId);
    if (caption) {
      finalizeCaption(captionId);
    }
  }, FINALIZE_DELAY);

  finalizationTimers.set(captionId, timer);
}

function finalizePendingCaptions(): void {
  const pendingIds = Array.from(finalizationTimers.keys());
  for (const captionId of pendingIds) {
    cancelFinalization(captionId);
    finalizeCaption(captionId);
  }
}

function cancelFinalization(captionId: number): void {
  const timer = finalizationTimers.get(captionId);
  if (!timer) {
    return;
  }

  clearTimeout(timer);
  finalizationTimers.delete(captionId);
}

function extractCaptions(): void {
  const captionRegion = document.querySelector('[role="region"].vNKgIf.UDinHf');
  if (!captionRegion) {
    return;
  }

  const captionEntries = captionRegion.querySelectorAll(".nMcdL");
  if (captionEntries.length === 0) {
    return;
  }

  captionEntries.forEach(processCaption);
}

export const googleMeetProvider: MeetingProvider = {
  platform: "google-meet",

  matchesUrl(url) {
    return getGoogleMeetPageKind(url) !== null;
  },

  matchesPageContext(url) {
    return getGoogleMeetPageKind(url) !== null;
  },

  bootstrap() {
    return undefined;
  },

  startCaptionObserver() {
    let observer: MutationObserver | null = null;
    let extractTimeout: ReturnType<typeof setTimeout> | null = null;

    const debouncedExtract = () => {
      if (extractTimeout) {
        clearTimeout(extractTimeout);
      }
      extractTimeout = setTimeout(() => {
        extractCaptions();
      }, 100);
    };

    const observeCaptionRegion = () => {
      const captionRegion = document.querySelector(
        '[role="region"].vNKgIf.UDinHf'
      ) as HTMLElement | null;

      const needsReobserve =
        captionRegion &&
        (!currentCaptionRegion ||
          captionRegion !== currentCaptionRegion ||
          !document.body.contains(currentCaptionRegion));

      if (needsReobserve && captionRegion) {
        if (observer) {
          observer.disconnect();
          observer = null;
        }

        currentCaptionRegion = captionRegion;

        if (!isCCEnabled) {
          setCCEnabled(true);
          closeCaptureGuide();
          if (captions.length === 0) {
            renderCaptions();
          }
        }

        observer = new MutationObserver(debouncedExtract);
        observer.observe(captionRegion, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        extractCaptions();
      }

      if (!captionRegion && currentCaptionRegion) {
        currentCaptionRegion = null;
        setCCEnabled(false);

        if (observer) {
          observer.disconnect();
          observer = null;
        }

        finalizePendingCaptions();
        if (captions.length === 0) {
          renderCaptions();
        }
      }
    };

    const intervalId = setInterval(observeCaptionRegion, 2000);
    observeCaptionRegion();

    return () => {
      clearInterval(intervalId);
      if (extractTimeout) {
        clearTimeout(extractTimeout);
      }
      if (observer) {
        observer.disconnect();
      }
      currentCaptionRegion = null;
      setCCEnabled(false);
      finalizePendingCaptions();
    };
  },

  getSessionMetadata() {
    return {
      platform: "google-meet",
      providerLabel: getProviderLabel("google-meet"),
      title: getMeetingTitle(),
      sourceUrl: window.location.href,
      identifiers: {
        meetingCode: getMeetingCodeFromUrl(),
      },
    };
  },

  getEmptyState() {
    return {
      waitingTitle: "Waiting for captions...",
      waitingBody: "Turn on captions in Google Meet to start capturing text",
    };
  },

  getCaptureGuide() {
    return {
      modalTitle: "Enable Capture In Google Meet",
      modalBody:
        "MeetCaptioner can start once Google Meet captions are turned on in this browser meeting.",
      steps: [
        {
          title: "Open the meeting controls",
          detail: "Move your mouse to reveal the bottom meeting toolbar.",
        },
        {
          title: "Open captions controls",
          detail: "Click the captions or CC control in the meeting toolbar.",
        },
        {
          title: "Turn captions on",
          detail: "Once captions are enabled, MeetCaptioner will start capturing text automatically.",
        },
      ],
      troubleshootingHint:
        "If you do not see a captions control, check whether the meeting or browser state is still loading.",
    };
  },

  isCaptioningCurrentlyAvailable() {
    return document.querySelector('[role="region"].vNKgIf.UDinHf') !== null;
  },
};

function getGoogleMeetPageKind(
  url: URL
): "meeting" | "new" | null {
  if (url.pathname === "/new") {
    return "new";
  }

  if (/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:\/)?$/.test(url.pathname)) {
    return "meeting";
  }

  return null;
}

export const googleMeetProviderInternals = {
  getGoogleMeetPageKind,
};
