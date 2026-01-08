import { captions, isCCEnabled, setCCEnabled } from "./state";
import { addOrUpdateCaption, finalizeCaption } from "./caption";
import { renderCaptions } from "./render";

let currentCaptionRegion: HTMLElement | null = null;

// Map DOM element → our caption ID
const elementToCaptionId = new WeakMap<Element, number>();

// Track last text for each element to detect changes
const elementLastText = new WeakMap<Element, string>();

// Track last speaker for each element
const elementLastSpeaker = new WeakMap<Element, string>();

// Track finalization timers
const finalizationTimers = new Map<number, ReturnType<typeof setTimeout>>();

// Time to wait before finalizing (translating) a caption
const FINALIZE_DELAY = 1500;

function processCaption(entry: Element): void {
  const speakerEl = entry.querySelector(".NWpY1d");
  const speaker = speakerEl?.textContent?.trim() || "Unknown";

  const textEl = entry.querySelector(".ygicle");
  if (!textEl) {
    console.log("[MeetCaptioner] No text element found in entry");
    return;
  }

  const text = textEl.textContent?.trim();

  // Edge case: Empty or very short text - skip
  if (!text || text.length < 2) {
    console.log("[MeetCaptioner] Text too short:", text);
    return;
  }

  const lastText = elementLastText.get(entry);
  const lastSpeaker = elementLastSpeaker.get(entry);

  // Edge case: No change at all - skip
  if (lastText === text && lastSpeaker === speaker) {
    // Don't log this - too noisy
    return;
  }

  console.log("[MeetCaptioner] Processing caption:", speaker, text.substring(0, 30));

  // Update tracking
  elementLastText.set(entry, text);
  elementLastSpeaker.set(entry, speaker);

  const existingCaptionId = elementToCaptionId.get(entry);

  if (existingCaptionId !== undefined) {
    // This DOM element already has a caption
    const caption = captions.find((c) => c.id === existingCaptionId);

    if (!caption) {
      // Edge case: Caption was removed from array (MAX_CAPTIONS limit)
      // Create a new caption for this element
      console.log("[MeetCaptioner] Caption removed, creating new for element");
      cancelFinalization(existingCaptionId);
      const newId = addOrUpdateCaption(null, speaker, text);
      elementToCaptionId.set(entry, newId);
      scheduleFinalization(newId);
      return;
    }

    if (caption.speaker === speaker) {
      // Same speaker - update text
      if (text !== caption.text) {
        addOrUpdateCaption(existingCaptionId, speaker, text);
        scheduleFinalization(existingCaptionId);
      }
    } else {
      // Edge case: Speaker changed in same DOM element
      // Finalize old caption immediately, create new
      console.log("[MeetCaptioner] Speaker changed in element:", lastSpeaker, "→", speaker);
      cancelFinalization(existingCaptionId);
      finalizeCaption(existingCaptionId);

      const newId = addOrUpdateCaption(null, speaker, text);
      elementToCaptionId.set(entry, newId);
      scheduleFinalization(newId);
    }
  } else {
    // New DOM element
    // First, finalize any pending captions
    finalizePendingCaptions();

    const newId = addOrUpdateCaption(null, speaker, text);
    elementToCaptionId.set(entry, newId);
    scheduleFinalization(newId);
  }
}

function scheduleFinalization(captionId: number): void {
  // Cancel existing timer for this caption
  cancelFinalization(captionId);

  // Schedule new finalization
  const timer = setTimeout(() => {
    finalizationTimers.delete(captionId);

    // Edge case: Verify caption still exists before finalizing
    const caption = captions.find((c) => c.id === captionId);
    if (caption) {
      finalizeCaption(captionId);
    } else {
      console.log("[MeetCaptioner] Caption gone before finalize:", captionId);
    }
  }, FINALIZE_DELAY);

  finalizationTimers.set(captionId, timer);
}

// Finalize all captions that have pending timers
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
  const captionRegion = document.querySelector(
    '[role="region"][aria-label="Captions"]'
  );
  if (!captionRegion) {
    console.log("[MeetCaptioner] No caption region found");
    return;
  }

  const captionEntries = captionRegion.querySelectorAll(".nMcdL");

  // Edge case: No entries - nothing to do
  if (captionEntries.length === 0) {
    console.log("[MeetCaptioner] No caption entries found");
    return;
  }

  console.log("[MeetCaptioner] Processing", captionEntries.length, "entries");
  captionEntries.forEach(processCaption);
}

export function startObserver(): void {
  let observer: MutationObserver | null = null;
  let extractTimeout: ReturnType<typeof setTimeout> | null = null;

  function debouncedExtract(): void {
    if (extractTimeout) clearTimeout(extractTimeout);
    extractTimeout = setTimeout(() => {
      console.log("[MeetCaptioner] Mutation detected, extracting...");
      extractCaptions();
    }, 100);
  }

  function observeCaptionRegion(): void {
    const captionRegion = document.querySelector(
      '[role="region"][aria-label="Captions"]'
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

      // Initial extraction
      extractCaptions();

      console.log("[MeetCaptioner] Observing caption region");
    }

    // Edge case: Caption region removed
    if (!captionRegion && currentCaptionRegion) {
      console.log("[MeetCaptioner] Caption region removed, finalizing all");
      currentCaptionRegion = null;
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      // Finalize any pending when captions are turned off
      finalizePendingCaptions();
    }
  }

  setInterval(observeCaptionRegion, 2000);
  observeCaptionRegion();

  console.log("[MeetCaptioner] Observer started");
}
