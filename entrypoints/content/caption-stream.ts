import { addOrUpdateCaption, finalizeCaption } from "@content/caption";
import { splitLongCaption } from "@content/caption-segmenter";
import { captions } from "@content/state";

export type CaptionStreamState = {
  activeCaptionId: number | null;
  committedText: string;
  lastRawText: string;
  speaker: string;
};

export type CaptionStreamUpdate = {
  activeCaptionId: number | null;
  finalizedCaptionIds: number[];
  state: CaptionStreamState;
};

const MIN_COMMITTED_ANCHOR_LENGTH = 12;
const MAX_COMMITTED_ANCHOR_LENGTH = 64;

const findCommittedEnd = (
  rawText: string,
  committedText: string,
): number | null => {
  if (!committedText) return 0;
  if (rawText.startsWith(committedText)) return committedText.length;

  const maxLength = Math.min(
    committedText.length,
    MAX_COMMITTED_ANCHOR_LENGTH,
  );
  for (let length = maxLength; length >= MIN_COMMITTED_ANCHOR_LENGTH; length--) {
    const anchor = committedText.slice(-length);
    const anchorIndex = rawText.lastIndexOf(anchor);
    if (anchorIndex >= 0) return anchorIndex + anchor.length;
  }

  return null;
};

const createState = (speaker: string, rawText: string): CaptionStreamState => ({
  activeCaptionId: addOrUpdateCaption(null, speaker, rawText),
  committedText: "",
  lastRawText: rawText,
  speaker,
});

const finalizeActiveCaption = (
  state: CaptionStreamState,
  finalizedCaptionIds: number[],
): void => {
  if (state.activeCaptionId === null) return;

  finalizeCaption(state.activeCaptionId);
  finalizedCaptionIds.push(state.activeCaptionId);
  state.activeCaptionId = null;
};

const commitCaptionFinalizedByTimer = (state: CaptionStreamState): void => {
  if (state.activeCaptionId === null) return;

  const activeCaption = captions.find(
    (caption) => caption.id === state.activeCaptionId,
  );
  if (activeCaption?.isFinalized) {
    state.committedText = state.lastRawText;
    state.activeCaptionId = null;
  }
};

const applySplits = (
  state: CaptionStreamState,
  rawText: string,
  startIndex: number,
  finalizedCaptionIds: number[],
): void => {
  let segmentStart = startIndex;
  let segmentText = rawText.slice(segmentStart);
  let split = splitLongCaption(segmentText);

  while (split && state.activeCaptionId !== null) {
    state.activeCaptionId = addOrUpdateCaption(
      state.activeCaptionId,
      state.speaker,
      split.finalizedText,
    );
    finalizeActiveCaption(state, finalizedCaptionIds);

    segmentStart += split.consumedLength;
    state.committedText = rawText.slice(0, segmentStart);
    if (split.remainingText) {
      state.activeCaptionId = addOrUpdateCaption(
        null,
        state.speaker,
        split.remainingText,
      );
    }

    segmentText = rawText.slice(segmentStart);
    split = splitLongCaption(segmentText);
  }
};

/** Maps one cumulative Meet DOM caption to one or more immutable captions. */
export const updateCaptionStream = (
  previousState: CaptionStreamState | undefined,
  speaker: string,
  rawText: string,
): CaptionStreamUpdate => {
  const finalizedCaptionIds: number[] = [];
  let state = previousState;

  if (!state || state.speaker !== speaker) {
    if (state) finalizeActiveCaption(state, finalizedCaptionIds);
    state = createState(speaker, rawText);
  } else {
    commitCaptionFinalizedByTimer(state);
    const committedEnd = findCommittedEnd(rawText, state.committedText);

    if (committedEnd === null) {
      finalizeActiveCaption(state, finalizedCaptionIds);
      state = createState(speaker, rawText);
    } else {
      state.committedText = rawText.slice(0, committedEnd);
      const activeText = rawText.slice(committedEnd).trim();
      if (activeText && state.activeCaptionId === null) {
        state.activeCaptionId = addOrUpdateCaption(null, speaker, activeText);
      } else if (activeText && state.activeCaptionId !== null) {
        state.activeCaptionId = addOrUpdateCaption(
          state.activeCaptionId,
          speaker,
          activeText,
        );
      }
    }
  }

  const segmentStart = state.committedText.length;
  applySplits(state, rawText, segmentStart, finalizedCaptionIds);
  state.lastRawText = rawText;

  return {
    activeCaptionId: state.activeCaptionId,
    finalizedCaptionIds,
    state,
  };
};
