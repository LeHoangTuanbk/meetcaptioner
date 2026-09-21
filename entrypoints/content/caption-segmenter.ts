import {
  CAPTION_SEGMENT_HARD_TOKEN_LIMIT,
  CAPTION_SEGMENT_SOFT_TOKEN_LIMIT,
} from "@content/constants";

export type CaptionSplit = {
  finalizedText: string;
  remainingText: string;
  consumedLength: number;
};

const denseScriptPattern =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const latinOrNumberPattern = /[\p{Script=Latin}\p{Number}]/u;
const sentenceTerminalPattern =
  /\p{Sentence_Terminal}[\p{Close_Punctuation}\p{Final_Punctuation}"']*\s*$/u;
const numberPattern = /\p{Number}/u;

const sentenceSegmenter = new Intl.Segmenter(undefined, {
  granularity: "sentence",
});
const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

/** Estimates translation tokens across Latin, CJK, and mixed-language text. */
export const estimateTranslationTokens = (text: string): number => {
  let tokens = 0;

  for (const { segment } of graphemeSegmenter.segment(text)) {
    if (/^\s+$/u.test(segment)) {
      tokens += 0.25;
    } else if (denseScriptPattern.test(segment)) {
      tokens += 1;
    } else if (latinOrNumberPattern.test(segment)) {
      tokens += 0.25;
    } else {
      tokens += 0.5;
    }
  }

  return tokens;
};

const findSentenceBoundary = (text: string): number | null => {
  const boundaries: number[] = [];

  for (const sentence of sentenceSegmenter.segment(text)) {
    if (!sentenceTerminalPattern.test(sentence.segment)) continue;
    boundaries.push(sentence.index + sentence.segment.length);
  }

  // Live captions often continue with lowercase text after a period, which
  // Intl.Segmenter may not recognize as a new sentence.
  if (boundaries.length === 0) {
    const unicodeBoundaryPattern =
      /\p{Sentence_Terminal}[\p{Close_Punctuation}\p{Final_Punctuation}"']*\s*/gu;
    for (const match of text.matchAll(unicodeBoundaryPattern)) {
      const terminalIndex = match.index ?? 0;
      const terminal = text[terminalIndex];
      const isDecimalPoint =
        (terminal === "." || terminal === "．") &&
        numberPattern.test(text[terminalIndex - 1] ?? "") &&
        numberPattern.test(text[terminalIndex + 1] ?? "");
      if (!isDecimalPoint) boundaries.push(terminalIndex + match[0].length);
    }
  }

  let boundaryBeforeSoftLimit: number | null = null;

  for (const boundary of boundaries) {
    const tokenCount = estimateTranslationTokens(text.slice(0, boundary));

    if (tokenCount > CAPTION_SEGMENT_HARD_TOKEN_LIMIT) {
      return boundaryBeforeSoftLimit;
    }
    if (tokenCount >= CAPTION_SEGMENT_SOFT_TOKEN_LIMIT) return boundary;

    if (tokenCount >= CAPTION_SEGMENT_SOFT_TOKEN_LIMIT * 0.8) {
      boundaryBeforeSoftLimit = boundary;
    }
  }

  return boundaryBeforeSoftLimit;
};

const findHardBoundary = (text: string): number => {
  let tokenCount = 0;
  let previousBoundary = 0;
  let lastWordBoundary = 0;

  for (const grapheme of graphemeSegmenter.segment(text)) {
    const nextBoundary = grapheme.index + grapheme.segment.length;
    const nextCount = tokenCount + estimateTranslationTokens(grapheme.segment);

    if (/^\s+$/u.test(grapheme.segment)) {
      lastWordBoundary = grapheme.index;
    }

    if (nextCount > CAPTION_SEGMENT_HARD_TOKEN_LIMIT) {
      return lastWordBoundary || previousBoundary || nextBoundary;
    }

    tokenCount = nextCount;
    previousBoundary = nextBoundary;
  }

  return text.length;
};

/** Returns a safe split once the caption reaches its soft or hard limit. */
export const splitLongCaption = (text: string): CaptionSplit | null => {
  const tokenCount = estimateTranslationTokens(text);
  if (tokenCount < CAPTION_SEGMENT_SOFT_TOKEN_LIMIT) return null;

  const sentenceBoundary = findSentenceBoundary(text);
  const boundary =
    sentenceBoundary ??
    (tokenCount >= CAPTION_SEGMENT_HARD_TOKEN_LIMIT
      ? findHardBoundary(text)
      : null);
  if (boundary === null || boundary <= 0) return null;

  let consumedLength = boundary;
  while (/^\s$/u.test(text[consumedLength] ?? "")) consumedLength += 1;

  const finalizedText = text.slice(0, boundary).trim();
  if (!finalizedText) return null;

  return {
    finalizedText,
    remainingText: text.slice(consumedLength).trim(),
    consumedLength,
  };
};
