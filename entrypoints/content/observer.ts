import { captions, isCCEnabled, setCCEnabled } from "./state";
import { addOrUpdateCaption, finalizeCaption } from "./caption";
import { renderCaptions } from "./render";

let currentCaptionRegion: HTMLElement | null = null;

const elementToCaptionId = new WeakMap<Element, number>();

const elementLastText = new WeakMap<Element, string>();

const elementLastSpeaker = new WeakMap<Element, string>();

const finalizationTimers = new Map<number, ReturnType<typeof setTimeout>>();

const FINALIZE_DELAY = 1500;

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
    const caption = captions.find((c) => c.id === existingCaptionId);

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
  } else {
    finalizePendingCaptions();

    const newId = addOrUpdateCaption(null, speaker, text);
    elementToCaptionId.set(entry, newId);
    scheduleFinalization(newId);
  }
}

function scheduleFinalization(captionId: number): void {
  cancelFinalization(captionId);

  const timer = setTimeout(() => {
    finalizationTimers.delete(captionId);

    const caption = captions.find((c) => c.id === captionId);
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
  if (timer) {
    clearTimeout(timer);
    finalizationTimers.delete(captionId);
  }
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

export function startObserver(): void {
  let observer: MutationObserver | null = null;
  let extractTimeout: ReturnType<typeof setTimeout> | null = null;

  function debouncedExtract(): void {
    if (extractTimeout) clearTimeout(extractTimeout);
    extractTimeout = setTimeout(() => {
      extractCaptions();
    }, 100);
  }

  function observeCaptionRegion(): void {
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
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      finalizePendingCaptions();
    }
  }

  setInterval(observeCaptionRegion, 2000);
  observeCaptionRegion();
}
