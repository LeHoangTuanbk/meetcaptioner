import { captions, isCCEnabled, setCCEnabled } from "../state";
import { addOrUpdateCaption, finalizeCaption } from "../caption";
import { renderCaptions } from "../render";
import { closeCaptureGuide } from "../overlay/capture-guide";
import { querySelectorAllDeep } from "../libs";
import { getProviderLabel } from "../../shared/meeting-session";
import type { MeetingProvider } from "./types";

const EXPLICIT_TEXT_SELECTOR = ".live-transcription-subtitle__item";

const SPEAKER_SELECTORS = [
  '[data-testid*="speaker"]',
  '[class*="speaker"]',
  '[aria-label*="speaker" i]',
].join(", ");

const TEXT_SELECTORS = [EXPLICIT_TEXT_SELECTOR].join(", ");

const FINALIZE_DELAY = 1500;
const SYSTEM_TEXT_PATTERN =
  /^(connecting|local data storage.*|captions will be shown in .+|english \(us\)|you have left the meeting|you left the meeting|joining meeting.*|meeting recording.*)$/i;

const elementToCaptionId = new WeakMap<Element, number>();
const elementLastText = new WeakMap<Element, string>();
const elementLastSpeaker = new WeakMap<Element, string>();
const finalizationTimers = new Map<number, ReturnType<typeof setTimeout>>();

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeZoomSpeaker(rawSpeaker: string): string {
  const normalized = normalizeWhitespace(rawSpeaker)
    .replace(/\s*,?\s*computer audio unmuted.*$/i, "")
    .replace(/\s*,?\s*computer audio muted.*$/i, "")
    .replace(/\s*,?\s*audio unmuted.*$/i, "")
    .replace(/\s*,?\s*audio muted.*$/i, "")
    .replace(/\s*,?\s*video off.*$/i, "")
    .replace(/\s*,?\s*video on.*$/i, "")
    .replace(/\s*\((host|me|host,\s*me)\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim()
    .replace(/[,\s]+$/g, "");

  return normalized || "Unknown";
}

function isInsideExtension(element: Element): boolean {
  return element.closest("#meetcaptioner-overlay") !== null;
}

function isVisibleElement(element: Element): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function isLikelyCaptionText(text: string): boolean {
  return text.length >= 2 && text.length <= 260;
}

function isLikelySystemMessage(text: string): boolean {
  return SYSTEM_TEXT_PATTERN.test(text);
}

function splitIntoSentenceCandidates(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean);
}

function getOverlapLength(previousText: string, nextText: string): number {
  const maxLength = Math.min(previousText.length, nextText.length);

  for (let length = maxLength; length > 0; length -= 1) {
    if (previousText.slice(-length) === nextText.slice(0, length)) {
      return length;
    }
  }

  return 0;
}

function resolveZoomTextTransition(
  previousText: string,
  nextText: string
): { mode: "update" | "replace"; text: string } {
  if (!previousText) {
    return { mode: "replace", text: nextText };
  }

  if (nextText.startsWith(previousText)) {
    return { mode: "update", text: nextText };
  }

  if (nextText.includes(previousText) && nextText.length > previousText.length) {
    return { mode: "update", text: nextText };
  }

  const overlapLength = getOverlapLength(previousText, nextText);
  if (overlapLength >= 8) {
    const deltaText = normalizeWhitespace(nextText.slice(overlapLength));
    return {
      mode: "replace",
      text: deltaText || nextText,
    };
  }

  return { mode: "replace", text: nextText };
}

function getExplicitSubtitleItems(): Element[] {
  return querySelectorAllDeep(EXPLICIT_TEXT_SELECTOR).filter(
    (item) =>
      !isInsideExtension(item) &&
      isVisibleElement(item) &&
      normalizeWhitespace(item.textContent || "").length > 0
  );
}

function getCaptionEntries(): Element[] {
  return getExplicitSubtitleItems();
}

function getSubtitleContainer(entry: Element): Element | null {
  return (
    entry.closest("#live-transcription-subtitle") ||
    entry.closest(".live-transcription-subtitle__box")
  );
}

function extractShortTextCandidates(container: Element): string[] {
  const lines = normalizeWhitespace(container.textContent || "")
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const descendants = Array.from(container.querySelectorAll("*"))
    .map((node) => normalizeWhitespace(node.textContent || ""))
    .filter(Boolean);

  return Array.from(new Set([...lines, ...descendants])).filter(
    (text) =>
      text.length >= 2 &&
      text.length <= 80 &&
      !isLikelySystemMessage(text) &&
      !isLikelyCaptionText(text)
  );
}

function extractZoomSpeakerFromAvatar(entry: Element): string | undefined {
  const subtitleContainer = getSubtitleContainer(entry);
  const avatarSrc =
    subtitleContainer?.querySelector("img")?.getAttribute("src") || "";

  if (!avatarSrc) {
    return undefined;
  }

  const matchingImages = querySelectorAllDeep("img")
    .filter((node) => node instanceof HTMLImageElement)
    .filter((image) => image.getAttribute("src") === avatarSrc)
    .filter((image) => !subtitleContainer?.contains(image));

  for (const image of matchingImages) {
    let current: Element | null = image;
    let depth = 0;

    while (current && depth < 5) {
      const ariaLabel = normalizeWhitespace(
        current.getAttribute("aria-label") || ""
      );
      if (
        ariaLabel &&
        ariaLabel.length <= 80 &&
        !/^(participant|video|audio|mute|unmute)$/i.test(ariaLabel)
      ) {
        return ariaLabel;
      }

      const candidates = extractShortTextCandidates(current);
      const speakerCandidate = candidates.find(
        (candidate) =>
          candidate.length <= 60 &&
          /[a-z]/i.test(candidate) &&
          candidate.split(" ").length <= 6
      );

      if (speakerCandidate) {
        return normalizeZoomSpeaker(speakerCandidate);
      }

      current = current.parentElement;
      depth += 1;
    }
  }

  return undefined;
}

function extractSpeakerAndText(entry: Element): { speaker: string; text: string } | null {
  if (
    entry instanceof HTMLElement &&
    entry.matches(EXPLICIT_TEXT_SELECTOR)
  ) {
    const directText = normalizeWhitespace(entry.textContent || "");
    if (!directText || !isLikelyCaptionText(directText)) {
      return null;
    }

    return {
      speaker: normalizeZoomSpeaker(extractZoomSpeakerFromAvatar(entry) || "Unknown"),
      text: directText,
    };
  }

  const explicitSpeaker = normalizeZoomSpeaker(
    entry.querySelector(SPEAKER_SELECTORS)?.textContent || ""
  );

  const visibleLines =
    entry instanceof HTMLElement
      ? entry.innerText
          .split("\n")
          .map((line) => normalizeWhitespace(line))
          .filter(Boolean)
      : [];

  const candidateTexts = Array.from(
    new Set(
      Array.from(entry.querySelectorAll(TEXT_SELECTORS))
        .map((node) => normalizeWhitespace(node.textContent || ""))
        .concat(visibleLines)
        .filter(Boolean)
    )
  ).filter((text) => isLikelyCaptionText(text) && text !== explicitSpeaker);

  if (explicitSpeaker && candidateTexts.length > 0) {
    return {
      speaker: explicitSpeaker,
      text: candidateTexts[0],
    };
  }

  const fullText = normalizeWhitespace(entry.textContent || "");
  const inlineSpeaker = fullText.match(/^([^:]{1,60}):\s+(.+)$/);
  if (inlineSpeaker) {
    return {
      speaker: inlineSpeaker[1].trim(),
      text: inlineSpeaker[2].trim(),
    };
  }

  const text = candidateTexts[0] || fullText;
  if (!isLikelyCaptionText(text)) {
    return null;
  }

  return {
    speaker: explicitSpeaker || "Unknown",
    text,
  };
}

function normalizeZoomTitle(rawTitle: string): string | undefined {
  const title = rawTitle
    .replace(/\s*-\s*Zoom\s*$/i, "")
    .replace(/\s*\|\s*Zoom\s*$/i, "")
    .trim();

  if (!title) {
    return undefined;
  }

  if (/^zoom$/i.test(title) || /^zoom meeting$/i.test(title)) {
    return undefined;
  }

  return title || undefined;
}

function extractZoomMeetingNumber(url: URL): string | undefined {
  const pathMatch = url.pathname.match(
    /^\/(?:wc\/(\d+)\/(?:start|join)|wc\/join\/(\d+)|j\/(\d+)|w\/(\d+))(?:\/|$)/
  );
  if (pathMatch?.[1]) {
    return pathMatch[1];
  }
  if (pathMatch?.[2]) {
    return pathMatch[2];
  }
  if (pathMatch?.[3]) {
    return pathMatch[3];
  }
  if (pathMatch?.[4]) {
    return pathMatch[4];
  }

  const confno = url.searchParams.get("confno");
  return confno || undefined;
}

function extractZoomMeetingId(url: URL): string | undefined {
  const meetingId =
    url.searchParams.get("mn") ||
    url.searchParams.get("mid") ||
    url.searchParams.get("meetingId");

  if (meetingId) {
    return meetingId;
  }

  return extractZoomMeetingNumber(url);
}

function extractZoomFallbackIdentifier(): string | undefined {
  const title = normalizeZoomTitle(document.title || "");
  if (title) {
    return title;
  }

  const participantLabel = normalizeWhitespace(
    querySelectorAllDeep('[aria-label*="participant" i]')[0]?.getAttribute("aria-label") ||
      querySelectorAllDeep('[class*="participant"]')[0]?.textContent ||
      ""
  );

  return participantLabel || undefined;
}

function isZoomIframeContext(): boolean {
  return window.top !== window;
}

function hasZoomWebClientFrame(): boolean {
  return document.querySelector("iframe#webclient") !== null;
}

function shouldActivateZoomProvider(url: URL): boolean {
  const isMatchingPath =
    url.hostname.endsWith(".zoom.us") &&
    (/^\/wc\/\d+\/(?:start|join)(?:\/|$)/.test(url.pathname) ||
      /^\/wc\/join\/\d+(?:\/|$)/.test(url.pathname) ||
      /^\/j\/\d+(?:\/|$)/.test(url.pathname) ||
      /^\/w\/\d+(?:\/|$)/.test(url.pathname));

  if (!isMatchingPath) {
    return false;
  }

  if (isZoomIframeContext()) {
    return isZoomMeetingContext(url);
  }

  // In Zoom PWA/app shell, the actual meeting surface usually lives inside
  // iframe#webclient. Avoid initializing the overlay in the top document.
  if (hasZoomWebClientFrame()) {
    return false;
  }

  // For top-level Zoom documents, only activate when explicit subtitle DOM is
  // already visible. This avoids a duplicate idle overlay in the shell page.
  return getExplicitSubtitleItems().length > 0;
}

function isZoomMeetingContext(url: URL): boolean {
  const title = normalizeZoomTitle(document.title || "");
  const hasMeetingTitle = Boolean(title);

  const hasCaptionControls =
    querySelectorAllDeep('[aria-label*="caption" i]').length > 0 ||
    querySelectorAllDeep('[aria-label*="subtitle" i]').length > 0 ||
    querySelectorAllDeep('[aria-label*="transcript" i]').length > 0;

  const hasMeetingChrome =
    querySelectorAllDeep('[class*="footer"]').length > 0 ||
    querySelectorAllDeep('[class*="meeting"]').length > 0 ||
    querySelectorAllDeep('[class*="video"]').length > 0;
  const hasExplicitCaptions = getExplicitSubtitleItems().length > 0;

  if (
    /^\/wc\/\d+\/(?:start|join)(?:\/|$)/.test(url.pathname) ||
    /^\/wc\/join\/\d+(?:\/|$)/.test(url.pathname) ||
    /^\/j\/\d+(?:\/|$)/.test(url.pathname)
  ) {
    return true;
  }

  return hasExplicitCaptions || hasCaptionControls || hasMeetingChrome || hasMeetingTitle;
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

function cancelFinalization(captionId: number): void {
  const timer = finalizationTimers.get(captionId);
  if (!timer) {
    return;
  }

  clearTimeout(timer);
  finalizationTimers.delete(captionId);
}

function finalizePendingCaptions(): void {
  const pendingIds = Array.from(finalizationTimers.keys());
  for (const captionId of pendingIds) {
    cancelFinalization(captionId);
    finalizeCaption(captionId);
  }
}

function processCaptionEntry(entry: Element): void {
  const extracted = extractSpeakerAndText(entry);
  if (!extracted) {
    return;
  }

  const { speaker } = extracted;
  const sentenceCandidates = splitIntoSentenceCandidates(extracted.text);
  const text =
    sentenceCandidates.length > 0
      ? sentenceCandidates[sentenceCandidates.length - 1]
      : extracted.text;

  if (isLikelySystemMessage(text)) {
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

    const resolvedSpeaker =
      speaker === "Unknown" && caption.speaker !== "Unknown"
        ? caption.speaker
        : speaker;

    if (caption.speaker === resolvedSpeaker) {
      if (caption.text !== text) {
        const transition = resolveZoomTextTransition(caption.text, text);

        if (transition.mode === "update") {
          addOrUpdateCaption(existingCaptionId, resolvedSpeaker, transition.text);
          scheduleFinalization(existingCaptionId);
          return;
        }

        cancelFinalization(existingCaptionId);
        finalizeCaption(existingCaptionId);

        const newId = addOrUpdateCaption(null, resolvedSpeaker, transition.text);
        elementToCaptionId.set(entry, newId);
        scheduleFinalization(newId);
        return;
      } else {
        scheduleFinalization(existingCaptionId);
      }
      return;
    }

    cancelFinalization(existingCaptionId);
    finalizeCaption(existingCaptionId);

    const newId = addOrUpdateCaption(null, speaker, text);
    elementToCaptionId.set(entry, newId);
    scheduleFinalization(newId);
    return;
  }

  finalizePendingCaptions();

  const newId = addOrUpdateCaption(null, speaker, text);
  elementToCaptionId.set(entry, newId);
  scheduleFinalization(newId);
}

function extractCaptions(): void {
  const entries = getCaptionEntries();
  if (entries.length === 0) {
    return;
  }

  entries.forEach(processCaptionEntry);
}

export const zoomWebProvider: MeetingProvider = {
  platform: "zoom-web",

  matchesUrl(url) {
    return shouldActivateZoomProvider(url);
  },

  matchesPageContext(url) {
    return shouldActivateZoomProvider(url);
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
      }, 120);
    };

    const updateCaptioningState = () => {
      const hasCaptions = getExplicitSubtitleItems().some((item) => {
        const text = normalizeWhitespace(item.textContent || "");
        return Boolean(text) && !isLikelySystemMessage(text);
      });

      if (hasCaptions && !isCCEnabled) {
        setCCEnabled(true);
        closeCaptureGuide();
        if (captions.length === 0) {
          renderCaptions();
        }
      }

      if (!hasCaptions && isCCEnabled) {
        setCCEnabled(false);
        finalizePendingCaptions();
        if (captions.length === 0) {
          renderCaptions();
        }
      }

      if (hasCaptions) {
        extractCaptions();
      }
    };

    if (document.body) {
      observer = new MutationObserver(debouncedExtract);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    const intervalId = window.setInterval(updateCaptioningState, 1800);
    updateCaptioningState();

    return () => {
      window.clearInterval(intervalId);
      if (extractTimeout) {
        clearTimeout(extractTimeout);
      }
      if (observer) {
        observer.disconnect();
      }
      setCCEnabled(false);
      finalizePendingCaptions();
    };
  },

  getSessionMetadata() {
    const url = new URL(window.location.href);
    const meetingNumber = extractZoomMeetingNumber(url);
    const meetingId = extractZoomMeetingId(url) || extractZoomFallbackIdentifier();

    return {
      platform: "zoom-web",
      providerLabel: getProviderLabel("zoom-web"),
      title: normalizeZoomTitle(document.title),
      sourceUrl: window.location.href,
      identifiers: {
        meetingId,
        meetingNumber,
      },
    };
  },

  getEmptyState() {
    return {
      waitingTitle: "Waiting for captions...",
      waitingBody:
        "Turn on captions or live transcription in Zoom Web App to start capturing text",
    };
  },

  getCaptureGuide() {
    return {
      modalTitle: "Enable Capture In Zoom Web App",
      modalBody:
        "MeetCaptioner can start once Zoom Web App captions or live transcription are enabled in this browser meeting.",
      steps: [
        {
          title: "Open meeting controls",
          detail: "Use the in-meeting toolbar at the bottom of the Zoom Web App window.",
        },
        {
          title: "Open captions controls",
          detail: "Look for captions, transcript, or live transcription controls in the toolbar or more menu.",
        },
        {
          title: "Enable captions",
          detail: "Turn on captions or live transcription so text becomes visible in the browser meeting UI.",
        },
      ],
      troubleshootingHint:
        "Some Zoom meetings may prefer the desktop app or restrict caption controls based on host settings.",
    };
  },

  isCaptioningCurrentlyAvailable() {
    return getExplicitSubtitleItems().some((item) => {
      const text = normalizeWhitespace(item.textContent || "");
      return Boolean(text) && !isLikelySystemMessage(text);
    });
  },
};

export const zoomWebProviderInternals = {
  extractCaptionEntries: getCaptionEntries,
  extractSpeakerAndText,
  extractZoomFallbackIdentifier,
  extractZoomMeetingId,
  extractZoomMeetingNumber,
  getExplicitSubtitleItems,
  hasZoomWebClientFrame,
  isZoomIframeContext,
  isZoomMeetingContext,
  normalizeZoomTitle,
  shouldActivateZoomProvider,
};
