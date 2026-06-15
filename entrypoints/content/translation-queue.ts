import type { Caption } from "./types";
import { captions, settings, overlay } from "./state";
import { translateCaption } from "./translation";
import { TranslationStatus, TRANSLATION_CONCURRENCY } from "./constants";

// Caption ids waiting to be translated, and those currently in flight.
const queue = new Set<number>();
const inFlight = new Set<number>();

function getScrollContainer(): HTMLElement | null {
  return (overlay?.querySelector(".mc-content") as HTMLElement | null) ?? null;
}

// 0 when the caption is visible in the overlay viewport, otherwise the pixel
// distance to the nearest viewport edge. Infinity when the element is gone.
function viewportDistance(captionId: number, container: HTMLElement): number {
  const el = container.querySelector(
    `[data-caption-id="${captionId}"]`
  ) as HTMLElement | null;
  if (!el) return Infinity;

  const elRect = el.getBoundingClientRect();
  const cRect = container.getBoundingClientRect();

  if (elRect.bottom >= cRect.top && elRect.top <= cRect.bottom) return 0;
  if (elRect.top > cRect.bottom) return elRect.top - cRect.bottom;
  return cRect.top - elRect.bottom;
}

function needsTranslation(c: Caption): boolean {
  if (inFlight.has(c.id)) return false;
  if (c.translationStatus === TranslationStatus.Translating) return false;
  if (
    c.translationStatus === TranslationStatus.Pending ||
    c.translationStatus === TranslationStatus.Error
  ) {
    return true;
  }
  return !c.translation;
}

// Pick the queued caption closest to the viewport so on-screen text is
// translated first, then nearby captions, expanding outward.
function pickNext(): number | null {
  const container = getScrollContainer();
  let bestId: number | null = null;
  let bestDist = Infinity;

  for (const id of queue) {
    const caption = captions.find((c) => c.id === id);
    if (!caption || !needsTranslation(caption)) {
      queue.delete(id);
      continue;
    }
    const dist = container ? viewportDistance(id, container) : 0;
    if (dist < bestDist) {
      bestDist = dist;
      bestId = id;
    }
  }

  return bestId;
}

function pump(): void {
  while (inFlight.size < TRANSLATION_CONCURRENCY) {
    const id = pickNext();
    if (id === null) break;

    queue.delete(id);
    const caption = captions.find((c) => c.id === id);
    if (!caption) continue;

    inFlight.add(id);
    translateCaption(caption, "semantic").finally(() => {
      inFlight.delete(id);
      pump();
    });
  }
}

// Queue a single caption (used when a live caption is finalized). The priority
// scheduler still ensures on-screen captions go first.
export function enqueueTranslation(captionId: number): void {
  if (!settings.translationEnabled) return;
  const caption = captions.find((c) => c.id === captionId);
  if (!caption || !needsTranslation(caption)) return;

  queue.add(captionId);
  pump();
}

// Queue every finalized, untranslated caption within `maxDistancePx` of the
// viewport. Used when translation is toggled on and while scrolling, so we
// translate what's on screen first and skip captions that are too far away.
export function enqueueNearbyCaptions(maxDistancePx = Infinity): void {
  if (!settings.translationEnabled) return;
  const container = getScrollContainer();

  for (const caption of captions) {
    if (!caption.isFinalized || !needsTranslation(caption)) continue;
    if (maxDistancePx !== Infinity && container) {
      if (viewportDistance(caption.id, container) > maxDistancePx) continue;
    }
    queue.add(caption.id);
  }

  pump();
}

export function clearTranslationQueue(): void {
  queue.clear();
}
