import { findCaptionContinuation } from "@content/caption-text-alignment";
import type { CaptionStreamState } from "@content/caption-stream";

type TrackedCaptionStream = {
  detachedAt: number | null;
  element: Element;
  state: CaptionStreamState;
};

const REPLACED_ELEMENT_TTL = 10_000;
const MIN_REPLACED_EXACT_TEXT_LENGTH = 12;

const elementStreams = new WeakMap<Element, TrackedCaptionStream>();
const trackedStreams = new Set<TrackedCaptionStream>();

const findReplacedStream = (
  speaker: string,
  text: string,
): TrackedCaptionStream | undefined => {
  let bestMatch: TrackedCaptionStream | undefined;
  let bestScore = 0;

  for (const tracked of trackedStreams) {
    if (tracked.detachedAt === null || tracked.state.speaker !== speaker) continue;
    if (
      tracked.state.lastRawText === text &&
      text.length < MIN_REPLACED_EXACT_TEXT_LENGTH
    ) {
      continue;
    }

    const match = findCaptionContinuation(tracked.state.lastRawText, text);
    if (match && match.matchedTokenCount > bestScore) {
      bestMatch = tracked;
      bestScore = match.matchedTokenCount;
    }
  }

  return bestMatch;
};

export const findTrackedCaptionStream = (
  entry: Element,
  speaker: string,
  text: string,
): CaptionStreamState | undefined => {
  const directlyTracked = elementStreams.get(entry);
  const tracked = directlyTracked ?? findReplacedStream(speaker, text);
  if (!tracked) return undefined;

  if (!directlyTracked) elementStreams.delete(tracked.element);
  tracked.detachedAt = null;
  tracked.element = entry;
  elementStreams.set(entry, tracked);
  return tracked.state;
};

export const setTrackedCaptionStream = (
  entry: Element,
  state: CaptionStreamState,
): void => {
  const tracked = elementStreams.get(entry);
  if (tracked) {
    tracked.state = state;
    return;
  }

  const newTracked = { detachedAt: null, element: entry, state };
  trackedStreams.add(newTracked);
  elementStreams.set(entry, newTracked);
};

export const refreshTrackedCaptionStreams = (
  currentEntries: Set<Element>,
): void => {
  const now = Date.now();
  for (const tracked of trackedStreams) {
    if (tracked.detachedAt === null && !currentEntries.has(tracked.element)) {
      tracked.detachedAt = now;
    }
    if (
      tracked.detachedAt !== null &&
      now - tracked.detachedAt > REPLACED_ELEMENT_TTL
    ) {
      elementStreams.delete(tracked.element);
      trackedStreams.delete(tracked);
    }
  }
};
