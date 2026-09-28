type CaptionToken = {
  end: number;
  value: string;
};

export type CaptionContinuationMatch = {
  boundary: number;
  matchedTokenCount: number;
};

const MIN_MATCHED_TOKENS = 4;
const MIN_PREVIOUS_COVERAGE = 0.6;
const MAX_PREVIOUS_ALIGNMENT_TOKENS = 200;
const MAX_CURRENT_ALIGNMENT_TOKENS = 320;

const wordSegmenter = new Intl.Segmenter(undefined, {
  granularity: "word",
});

const tokenize = (text: string): CaptionToken[] =>
  Array.from(wordSegmenter.segment(text))
    .filter((part) => part.isWordLike)
    .map((part) => ({
      end: part.index + part.segment.length,
      value: part.segment.toLocaleLowerCase(),
    }));

const advancePastSeparators = (text: string, start: number): number => {
  let boundary = start;
  while (boundary < text.length) {
    const separator = text
      .slice(boundary)
      .match(/^[\p{White_Space}\p{Punctuation}]/u)?.[0];
    if (!separator) break;
    boundary += separator.length;
  }
  return boundary;
};

const buildLcsMatrix = (
  previousTokens: CaptionToken[],
  currentTokens: CaptionToken[],
): number[][] => {
  const matrix = Array.from({ length: previousTokens.length + 1 }, () =>
    Array<number>(currentTokens.length + 1).fill(0),
  );

  for (
    let previousIndex = 1;
    previousIndex <= previousTokens.length;
    previousIndex++
  ) {
    for (
      let currentIndex = 1;
      currentIndex <= currentTokens.length;
      currentIndex++
    ) {
      matrix[previousIndex][currentIndex] =
        previousTokens[previousIndex - 1].value ===
        currentTokens[currentIndex - 1].value
          ? matrix[previousIndex - 1][currentIndex - 1] + 1
          : Math.max(
              matrix[previousIndex - 1][currentIndex],
              matrix[previousIndex][currentIndex - 1],
            );
    }
  }

  return matrix;
};

const findLastMatchedCurrentToken = (
  previousTokens: CaptionToken[],
  currentTokens: CaptionToken[],
  matrix: number[][],
): CaptionToken | null => {
  let previousIndex = previousTokens.length;
  let currentIndex = currentTokens.length;
  let lastMatchedToken: CaptionToken | null = null;

  while (previousIndex > 0 && currentIndex > 0) {
    if (
      previousTokens[previousIndex - 1].value ===
      currentTokens[currentIndex - 1].value
    ) {
      lastMatchedToken ??= currentTokens[currentIndex - 1];
      previousIndex -= 1;
      currentIndex -= 1;
    } else if (
      matrix[previousIndex - 1][currentIndex] >=
      matrix[previousIndex][currentIndex - 1]
    ) {
      previousIndex -= 1;
    } else {
      currentIndex -= 1;
    }
  }

  return lastMatchedToken;
};

/** Aligns cumulative caption versions even when Meet revises the previous tail. */
export const findCaptionContinuation = (
  previousText: string,
  currentText: string,
): CaptionContinuationMatch | null => {
  if (currentText.startsWith(previousText)) {
    return {
      boundary: previousText.length,
      matchedTokenCount: tokenize(previousText).length,
    };
  }

  const previousTokens = tokenize(previousText).slice(
    -MAX_PREVIOUS_ALIGNMENT_TOKENS,
  );
  const currentTokens = tokenize(currentText).slice(
    -MAX_CURRENT_ALIGNMENT_TOKENS,
  );
  if (previousTokens.length < MIN_MATCHED_TOKENS) return null;

  const matrix = buildLcsMatrix(previousTokens, currentTokens);
  const matchedTokenCount = matrix[previousTokens.length][currentTokens.length];
  const coverage = matchedTokenCount / previousTokens.length;
  if (
    matchedTokenCount < MIN_MATCHED_TOKENS ||
    coverage < MIN_PREVIOUS_COVERAGE
  ) {
    return null;
  }

  const lastMatchedToken = findLastMatchedCurrentToken(
    previousTokens,
    currentTokens,
    matrix,
  );
  if (!lastMatchedToken) return null;

  return {
    boundary: advancePastSeparators(currentText, lastMatchedToken.end),
    matchedTokenCount,
  };
};
