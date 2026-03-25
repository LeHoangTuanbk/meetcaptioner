import { captions, isCCEnabled, setCCEnabled } from "../state";
import { addOrUpdateCaption, finalizeCaption } from "../caption";
import { renderCaptions } from "../render";
import { closeCaptureGuide } from "../overlay/capture-guide";
import { getProviderLabel } from "../../shared/meeting-session";
import type { MeetingProvider } from "./types";

const STRONG_ENTRY_SELECTORS = [
  '[data-tid="closed-captions-v2-items-renderer"]',
  '[data-tid="author"]',
  '[data-tid="closed-caption-text"]',
  ".fui-ChatMessageCompact",
  '[data-tid*="caption-item"]',
  '[data-tid*="subtitle-item"]',
  '[data-tid*="transcript-message"]',
  '[data-tid*="closed-caption-item"]',
  '[class*="caption-item"]',
  '[class*="subtitle-item"]',
].join(", ");

const EXPLICIT_TEXT_SELECTOR = '[data-tid="closed-caption-text"]';
const EXPLICIT_AUTHOR_SELECTOR = '[data-tid="author"]';

const REGION_SELECTORS = [
  '[data-tid="closed-caption-renderer-wrapper"]',
  '[data-tid="closed-caption-v2-window-wrapper"]',
  '[data-tid="closed-caption-v2-virtual-list-content"]',
  '[aria-label="Live Captions"]',
  '[aria-label*="caption" i]',
  '[aria-label*="subtitle" i]',
  '[aria-label*="transcript" i]',
  '[aria-live="polite"]',
  '[aria-live="assertive"]',
  '[role="log"]',
].join(", ");

const SPEAKER_SELECTORS = [
  EXPLICIT_AUTHOR_SELECTOR,
  '[data-tid*="speaker"]',
  '[class*="speaker"]',
  '[data-tid*="author"]',
].join(", ");

const TEXT_SELECTORS = [
  EXPLICIT_TEXT_SELECTOR,
  '[data-tid*="text"]',
  '[data-tid*="line"]',
  '[class*="text"]',
  '[class*="line"]',
  "span",
  "p",
].join(", ");

const FINALIZE_DELAY = 1500;
const RECENT_SIGNATURE_WINDOW_MS = 4000;
const CAPTION_KEYWORD_PATTERN =
  /(caption|captions|subtitle|subtitles|transcript|closed-caption|live-caption)/i;
const DISALLOWED_HINT_PATTERN =
  /(setting|settings|menu|trigger-button|dismiss-button|overflow)/i;
const SYSTEM_SPEAKER_PATTERN =
  /^(unknown|new notification|captions will be shown in .+|microsoft teams meeting)$/i;
const SYSTEM_TEXT_PATTERN =
  /^(microsoft teams meeting|camera is off|your microphone isn't working.*|captions will be shown in .+|english \(us\)|you have left the call|you left the call)$/i;

const elementToCaptionId = new WeakMap<Element, number>();
const elementLastText = new WeakMap<Element, string>();
const elementLastSpeaker = new WeakMap<Element, string>();
const finalizationTimers = new Map<number, ReturnType<typeof setTimeout>>();
const recentCaptionSignatures = new Map<string, number>();

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isInsideExtension(element: Element): boolean {
  return element.closest("#meetcaptioner-overlay") !== null;
}

function isVisibleElement(element: Element): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  return true;
}

function collectElementHints(element: Element): string {
  const attrs = [
    element.getAttribute("data-tid"),
    element.getAttribute("aria-label"),
    element.getAttribute("id"),
    element.getAttribute("role"),
    element.className,
  ];

  return attrs.filter(Boolean).join(" ");
}

function hasCaptionKeywordHint(element: Element | null): boolean {
  if (!element) {
    return false;
  }

  return CAPTION_KEYWORD_PATTERN.test(collectElementHints(element));
}

function hasDisallowedHint(element: Element | null): boolean {
  if (!element) {
    return false;
  }

  return DISALLOWED_HINT_PATTERN.test(collectElementHints(element));
}

function findCaptionRegionAncestor(element: Element | null): Element | null {
  let current = element;
  let depth = 0;

  while (current && depth < 6) {
    if (hasCaptionKeywordHint(current)) {
      return current;
    }

    current = current.parentElement;
    depth += 1;
  }

  return null;
}

function collectLeafTexts(element: Element): string[] {
  const descendants = Array.from(element.querySelectorAll("*"));
  const leaves = descendants.filter(
    (node) => node.children.length === 0 && !isInsideExtension(node)
  );

  const sourceNodes = leaves.length > 0 ? leaves : [element];

  return Array.from(
    new Set(
      sourceNodes
        .map((node) => normalizeWhitespace(node.textContent || ""))
        .filter(Boolean)
    )
  );
}

function isLikelyCaptionText(text: string): boolean {
  return text.length >= 3 && text.length <= 240;
}

function isLikelySystemMessage(speaker: string, text: string): boolean {
  if (SYSTEM_TEXT_PATTERN.test(text)) {
    return true;
  }

  if (SYSTEM_SPEAKER_PATTERN.test(speaker) && SYSTEM_TEXT_PATTERN.test(text)) {
    return true;
  }

  if (/^(english|persian|arabic|french|german|spanish)(\s*\(.+\))?$/i.test(text)) {
    return true;
  }

  return false;
}

function buildCaptionSignature(speaker: string, text: string): string {
  return `${speaker.toLowerCase()}::${text.toLowerCase()}`;
}

function hasRecentCaptionSignature(signature: string): boolean {
  const now = Date.now();

  for (const [key, timestamp] of recentCaptionSignatures.entries()) {
    if (now - timestamp > RECENT_SIGNATURE_WINDOW_MS) {
      recentCaptionSignatures.delete(key);
    }
  }

  const lastSeenAt = recentCaptionSignatures.get(signature);
  return typeof lastSeenAt === "number" && now - lastSeenAt <= RECENT_SIGNATURE_WINDOW_MS;
}

function rememberCaptionSignature(signature: string): void {
  recentCaptionSignatures.set(signature, Date.now());
}

function getLatestPendingCaption() {
  for (let index = captions.length - 1; index >= 0; index -= 1) {
    const caption = captions[index];
    if (!caption.isFinalized) {
      return caption;
    }
  }

  return null;
}

function decodeTeamsDisplayName(value: string): string {
  try {
    return normalizeWhitespace(decodeURIComponent(value));
  } catch {
    return normalizeWhitespace(value);
  }
}

function extractSpeakerFromAvatar(entry: Element): string | undefined {
  const image = entry.querySelector("img");
  if (!image) {
    return undefined;
  }

  const altText = normalizeWhitespace(image.getAttribute("alt") || "");
  if (altText && altText.toLowerCase() !== "avatar") {
    return altText;
  }

  const ariaLabel = normalizeWhitespace(image.getAttribute("aria-label") || "");
  if (ariaLabel) {
    return ariaLabel;
  }

  const src = image.getAttribute("src") || "";
  if (!src) {
    return undefined;
  }

  try {
    const url = new URL(src);
    const displayName = url.searchParams.get("displayname");
    return displayName ? decodeTeamsDisplayName(displayName) : undefined;
  } catch {
    const match = src.match(/[?&]displayname=([^&]+)/i);
    return match?.[1] ? decodeTeamsDisplayName(match[1]) : undefined;
  }
}

function isLikelyCaptionEntry(element: Element): boolean {
  if (isInsideExtension(element) || !isVisibleElement(element)) {
    return false;
  }

  if (hasDisallowedHint(element)) {
    return false;
  }

  if (
    element.querySelector(
      'button, input, textarea, select, [role="button"], [role="menuitem"]'
    )
  ) {
    return false;
  }

  if (!findCaptionRegionAncestor(element) && !hasCaptionKeywordHint(element)) {
    return false;
  }

  const text = normalizeWhitespace(element.textContent || "");
  if (!isLikelyCaptionText(text)) {
    return false;
  }

  if (element.childElementCount > 25) {
    return false;
  }

  return true;
}

function extractSpeakerAndText(entry: Element): { speaker: string; text: string } | null {
  const visibleLines =
    entry instanceof HTMLElement
      ? entry.innerText
          .split("\n")
          .map((line) => normalizeWhitespace(line))
          .filter(Boolean)
      : [];

  const explicitSpeakerNode = entry.querySelector(SPEAKER_SELECTORS);
  const explicitSpeakerText = normalizeWhitespace(
    explicitSpeakerNode?.textContent || ""
  );
  const avatarSpeakerText = extractSpeakerFromAvatar(entry) || "";
  const speakerText = explicitSpeakerText || avatarSpeakerText;

  const explicitTextNode = entry.querySelector(TEXT_SELECTORS);
  const explicitCaptionText = normalizeWhitespace(
    explicitTextNode?.textContent || ""
  );

  if (speakerText && explicitCaptionText && isLikelyCaptionText(explicitCaptionText)) {
    return {
      speaker: speakerText,
      text: explicitCaptionText,
    };
  }

  const explicitTexts = Array.from(entry.querySelectorAll(TEXT_SELECTORS))
    .map((node) => normalizeWhitespace(node.textContent || ""))
    .filter(Boolean)
    .filter((text) => text !== speakerText);

  const leafTexts = collectLeafTexts(entry).filter((text) => text !== speakerText);
  const candidateTexts = Array.from(new Set([...explicitTexts, ...leafTexts]))
    .filter((text) => isLikelyCaptionText(text))
    .sort((left, right) => right.length - left.length);

  if (speakerText && visibleLines.length > 0) {
    const lineTexts = visibleLines.filter(
      (line) =>
        line !== speakerText &&
        !line.startsWith(`${speakerText} `) &&
        !line.startsWith(`${speakerText}.`) &&
        !line.startsWith(speakerText) &&
        isLikelyCaptionText(line)
    );

    if (lineTexts.length > 0) {
      return {
        speaker: speakerText,
        text: lineTexts[0],
      };
    }
  }

  if (visibleLines.length >= 2) {
    const [firstLine, ...restLines] = visibleLines;
    const textLines = restLines.filter((line) => isLikelyCaptionText(line));

    if (textLines.length > 0) {
      return {
        speaker: firstLine,
        text: textLines[0],
      };
    }
  }

  if (speakerText && candidateTexts.length > 0) {
    const bestCandidate = candidateTexts.find(
      (candidate) =>
        candidate !== speakerText &&
        !candidate.startsWith(speakerText) &&
        !candidate.includes(`${speakerText}${speakerText}`) &&
        !candidate.includes(`${speakerText} ${speakerText}`)
    );

    if (bestCandidate) {
      return {
        speaker: speakerText,
        text: bestCandidate,
      };
    }
  }

  const fullText = normalizeWhitespace(entry.textContent || "");
  const speakerFromInline = fullText.match(/^([^:]{1,60}):\s+(.+)$/);
  if (speakerFromInline) {
    return {
      speaker: speakerFromInline[1].trim(),
      text: speakerFromInline[2].trim(),
    };
  }

  if (candidateTexts.length >= 2) {
    return {
      speaker: candidateTexts[0],
      text: candidateTexts[1],
    };
  }

  const text = candidateTexts[0] || fullText;
  if (!isLikelyCaptionText(text)) {
    return null;
  }

  return {
    speaker: speakerText || "Unknown",
    text,
  };
}

function normalizeEntryCandidate(candidate: Element): Element | null {
  if (candidate.getAttribute("data-tid") === "closed-captions-v2-items-renderer") {
    return candidate.closest(".fui-ChatMessageCompact");
  }

  if (candidate.getAttribute("data-tid") === "author") {
    return candidate.closest(".fui-ChatMessageCompact");
  }

  if (candidate.getAttribute("data-tid") === "closed-caption-text") {
    return candidate.closest(".fui-ChatMessageCompact");
  }

  if (candidate.classList.contains("fui-ChatMessageCompact")) {
    return candidate;
  }

  return candidate;
}

function getFallbackEntries(): Element[] {
  const regions = getCaptionRegions();

  const entries = new Set<Element>();

  for (const region of regions) {
    const chatMessageItems = Array.from(
      region.querySelectorAll(".fui-ChatMessageCompact")
    )
      .map(normalizeEntryCandidate)
      .filter((candidate): candidate is Element => Boolean(candidate))
      .filter((candidate) => candidate.querySelector('[data-tid="closed-caption-text"]'));

    if (chatMessageItems.length > 0) {
      for (const item of chatMessageItems) {
        entries.add(item);
      }
      continue;
    }

    const descendants = Array.from(region.querySelectorAll("*")).filter(
      isLikelyCaptionEntry
    );
    const leafCandidates = descendants.filter(
      (candidate) =>
        !descendants.some(
          (other) => other !== candidate && candidate.contains(other)
        )
    );

    const directChildren = Array.from(region.children).filter(isLikelyCaptionEntry);
    const preferredEntries = leafCandidates.length > 0 ? leafCandidates : directChildren;
    if (preferredEntries.length > 0) {
      for (const child of preferredEntries) {
        entries.add(child);
      }
      continue;
    }

    if (isLikelyCaptionEntry(region)) {
      entries.add(region);
    }
  }

  return Array.from(entries);
}

function getCaptionRegions(): Element[] {
  const candidates = Array.from(document.querySelectorAll(REGION_SELECTORS)).filter(
    (region) =>
      !isInsideExtension(region) &&
      isVisibleElement(region) &&
      !hasDisallowedHint(region)
  );

  const regions = candidates.filter((region) => {
    if (hasCaptionKeywordHint(region)) {
      return true;
    }

    return findCaptionRegionAncestor(region.parentElement) !== null;
  });

  return Array.from(new Set(regions));
}

function getCaptionEntries(): Element[] {
  const regions = getCaptionRegions();

  const explicitMatches = regions.flatMap((region) =>
    Array.from(region.querySelectorAll(EXPLICIT_TEXT_SELECTOR))
      .map((node) => node.closest(".fui-ChatMessageCompact"))
      .filter((candidate): candidate is Element => Boolean(candidate))
      .filter((candidate) => region.contains(candidate))
      .filter(
        (candidate) =>
          candidate.querySelector(EXPLICIT_TEXT_SELECTOR) !== null &&
          candidate.querySelector(EXPLICIT_AUTHOR_SELECTOR) !== null
      )
      .filter(isLikelyCaptionEntry)
  );

  if (explicitMatches.length > 0) {
    return Array.from(new Set(explicitMatches));
  }

  const strongMatches = regions
    .flatMap((region) =>
      Array.from(region.querySelectorAll(STRONG_ENTRY_SELECTORS))
        .map(normalizeEntryCandidate)
        .filter((candidate): candidate is Element => Boolean(candidate))
        .filter((candidate) => region.contains(candidate))
        .filter(
          (candidate) =>
            candidate.classList.contains("fui-ChatMessageCompact") ||
            candidate.querySelector('[data-tid="closed-caption-text"]') !== null
        )
        .filter(isLikelyCaptionEntry)
    );

  if (strongMatches.length > 0) {
    return Array.from(new Set(strongMatches));
  }

  return getFallbackEntries();
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
  if (!extracted || !isLikelyCaptionText(extracted.text)) {
    return;
  }

  const { speaker, text } = extracted;
  if (isLikelySystemMessage(speaker, text)) {
    return;
  }

  const signature = buildCaptionSignature(speaker, text);

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
      if (caption.text !== text) {
        addOrUpdateCaption(existingCaptionId, speaker, text);
        rememberCaptionSignature(signature);
        scheduleFinalization(existingCaptionId);
      }
      return;
    }

    cancelFinalization(existingCaptionId);
    finalizeCaption(existingCaptionId);

    const newId = addOrUpdateCaption(null, speaker, text);
    elementToCaptionId.set(entry, newId);
    rememberCaptionSignature(signature);
    scheduleFinalization(newId);
    return;
  }

  if (speaker === "Unknown") {
    const latestPendingCaption = getLatestPendingCaption();
    if (
      latestPendingCaption &&
      latestPendingCaption.speaker !== "Unknown" &&
      !latestPendingCaption.text.includes(text)
    ) {
      const mergedText = normalizeWhitespace(
        `${latestPendingCaption.text} ${text}`
      );
      addOrUpdateCaption(
        latestPendingCaption.id,
        latestPendingCaption.speaker,
        mergedText
      );
      rememberCaptionSignature(
        buildCaptionSignature(latestPendingCaption.speaker, mergedText)
      );
      scheduleFinalization(latestPendingCaption.id);
      elementToCaptionId.set(entry, latestPendingCaption.id);
      return;
    }
  }

  if (hasRecentCaptionSignature(signature)) {
    return;
  }

  finalizePendingCaptions();

  const newId = addOrUpdateCaption(null, speaker, text);
  elementToCaptionId.set(entry, newId);
  rememberCaptionSignature(signature);
  scheduleFinalization(newId);
}

function extractCaptions(): void {
  const entries = getCaptionEntries();
  if (entries.length === 0) {
    return;
  }

  entries.forEach(processCaptionEntry);
}

function normalizeTeamsTitle(rawTitle: string): string | undefined {
  const title = rawTitle
    .replace(/\s*\|\s*Microsoft Teams\s*$/i, "")
    .replace(/\s*\|\s*Teams\s*$/i, "")
    .trim();

  if (!title) {
    return undefined;
  }

  if (
    /^microsoft teams$/i.test(title) ||
    /^teams$/i.test(title) ||
    /^microsoft teams meeting$/i.test(title)
  ) {
    return undefined;
  }

  return title || undefined;
}

function extractTeamsThreadId(url: URL): string | undefined {
  const matchupPath = url.pathname.match(/\/l\/meetup-join\/([^/]+)/);
  if (matchupPath?.[1]) {
    try {
      return decodeURIComponent(matchupPath[1]);
    } catch {
      return matchupPath[1];
    }
  }

  const threadId = url.searchParams.get("threadId");
  return threadId || undefined;
}

function extractTeamsMeetingId(url: URL): string | undefined {
  const meetingId =
    url.searchParams.get("meetingId") ||
    url.searchParams.get("meetingid") ||
    url.searchParams.get("meeting-id");

  if (meetingId) {
    return meetingId;
  }

  const context = url.searchParams.get("context");
  if (!context) {
    return undefined;
  }

  const decodedContext = decodeURIComponent(context);
  const match = decodedContext.match(/"Oid":"([^"]+)"/i);
  return match?.[1];
}

function extractTeamsParticipantLabel(): string | undefined {
  const candidate =
    document.querySelector('[data-tid="calling-pagination"] [data-tid]') ||
    document.querySelector('[data-tid="calling-pagination"] [aria-label]') ||
    document.querySelector('[data-tid="calling-screen-avatar"] img') ||
    document.querySelector('[data-tid="calling-participant-stream"]');

  if (!candidate) {
    return undefined;
  }

  const dataTid = normalizeWhitespace(candidate.getAttribute("data-tid") || "");
  if (
    dataTid &&
    !/^calling-pagination$/i.test(dataTid) &&
    !/^calling-screen-avatar$/i.test(dataTid) &&
    !/^calling-participant-stream$/i.test(dataTid)
  ) {
    return dataTid;
  }

  const ariaLabel = normalizeWhitespace(candidate.getAttribute("aria-label") || "");
  if (
    ariaLabel &&
    !/^(meeting controls|calling controls|calling indicators)$/i.test(ariaLabel)
  ) {
    return ariaLabel;
  }

  if (candidate instanceof HTMLImageElement) {
    const src = candidate.getAttribute("src") || "";
    const match = src.match(/[?&]displayname=([^&]+)/i);
    if (match?.[1]) {
      return decodeTeamsDisplayName(match[1]);
    }
  }

  return undefined;
}

function extractTeamsFallbackIdentifier(): string | undefined {
  const participantLabel = extractTeamsParticipantLabel();
  if (participantLabel) {
    return participantLabel;
  }

  const title = normalizeTeamsTitle(document.title || "");
  return title || undefined;
}

function isTeamsMeetingContext(url: URL): boolean {
  const title = normalizeTeamsTitle(document.title || "");
  const hasMeetingTitle =
    Boolean(title) &&
    /^(meeting with|meet now|call with|incoming call|meeting)/i.test(title || "");

  const hasCaptionControls =
    document.querySelector('[data-tid="closed-captions-settings-menu-trigger-button"]') !==
      null ||
    document.querySelector('[data-tid="captions-panel-dismiss-button"]') !== null ||
    document.querySelector('[aria-label*="Live Caption" i]') !== null ||
    document.querySelector('[aria-label*="Hide live captions" i]') !== null;

  const hasMeetingChrome =
    document.querySelector('[data-tid*="calling-screen"]') !== null ||
    document.querySelector('[data-tid*="call-control"]') !== null ||
    document.querySelector('[data-tid*="meeting-stage"]') !== null;

  if (url.pathname.startsWith("/meet/")) {
    return true;
  }

  if (url.pathname.startsWith("/v2/")) {
    return hasCaptionControls || hasMeetingChrome || getCaptionRegions().length > 0;
  }

  return hasCaptionControls || hasMeetingChrome || hasMeetingTitle;
}

export const microsoftTeamsProvider: MeetingProvider = {
  platform: "microsoft-teams",

  matchesUrl(url) {
    const isMicrosoftHost =
      url.hostname === "teams.microsoft.com" ||
      url.hostname.endsWith(".teams.microsoft.com");
    const isLiveHost =
      url.hostname === "teams.live.com" || url.hostname.endsWith(".teams.live.com");

    if (isLiveHost) {
      return url.pathname.startsWith("/meet/");
    }

    if (!isMicrosoftHost) {
      return false;
    }

    return (
      url.pathname.includes("/l/meetup-join/") || url.pathname.includes("/meet/")
    );
  },

  matchesPageContext(url) {
    const isTeamsHost =
      url.hostname === "teams.microsoft.com" ||
      url.hostname.endsWith(".teams.microsoft.com") ||
      url.hostname === "teams.live.com" ||
      url.hostname.endsWith(".teams.live.com");

    if (!isTeamsHost) {
      return false;
    }

    return isTeamsMeetingContext(url);
  },

  bootstrap() {
    return undefined;
  },

  startCaptionObserver() {
    let observers: MutationObserver[] = [];
    let extractTimeout: ReturnType<typeof setTimeout> | null = null;

    const debouncedExtract = () => {
      if (extractTimeout) {
        clearTimeout(extractTimeout);
      }

      extractTimeout = setTimeout(() => {
        extractCaptions();
      }, 120);
    };

    const resetObservers = () => {
      for (const observer of observers) {
        observer.disconnect();
      }
      observers = [];
    };

    const bindObservers = () => {
      resetObservers();

      const regions = getCaptionRegions();
      for (const region of regions) {
        const observer = new MutationObserver(debouncedExtract);
        observer.observe(region, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        observers.push(observer);
      }
    };

    const updateCaptioningState = () => {
      bindObservers();

      const hasCaptions = getCaptionEntries().length > 0;

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
      bindObservers();
    }

    const intervalId = setInterval(updateCaptioningState, 1800);
    updateCaptioningState();

    return () => {
      clearInterval(intervalId);
      if (extractTimeout) {
        clearTimeout(extractTimeout);
      }
      resetObservers();
      setCCEnabled(false);
      finalizePendingCaptions();
    };
  },

  getSessionMetadata() {
    const sourceUrl = window.location.href;
    const url = new URL(sourceUrl);
    const meetingId = extractTeamsMeetingId(url);
    const threadId = extractTeamsThreadId(url);
    const fallbackIdentifier = extractTeamsFallbackIdentifier();

    return {
      platform: "microsoft-teams",
      providerLabel: getProviderLabel("microsoft-teams"),
      title: normalizeTeamsTitle(document.title),
      sourceUrl,
      identifiers: {
        meetingId: meetingId || fallbackIdentifier,
        threadId,
      },
    };
  },

  getEmptyState() {
    return {
      waitingTitle: "Waiting for captions...",
      waitingBody:
        "Turn on live captions in Microsoft Teams Web to start capturing text",
    };
  },

  getCaptureGuide() {
    return {
      modalTitle: "Enable Capture In Microsoft Teams",
      modalBody:
        "MeetCaptioner can start once Microsoft Teams live captions are enabled in this browser meeting.",
      steps: [
        {
          title: "Open meeting controls",
          detail: "Move your mouse or focus the meeting footer controls.",
        },
        {
          title: "Open more actions",
          detail: "Find the More actions menu in the Teams meeting controls.",
        },
        {
          title: "Turn on live captions",
          detail: "Enable live captions so caption text becomes available on the meeting page.",
        },
      ],
      troubleshootingHint:
        "If captions are unavailable, the organizer or admin policy may be restricting caption controls.",
    };
  },

  isCaptioningCurrentlyAvailable() {
    return getCaptionEntries().length > 0;
  },
};

export const microsoftTeamsProviderInternals = {
  getCaptionRegions,
  extractCaptionEntries: getCaptionEntries,
  extractSpeakerAndText,
  extractTeamsFallbackIdentifier,
  extractTeamsMeetingId,
  extractTeamsParticipantLabel,
  extractTeamsThreadId,
  isTeamsMeetingContext,
  normalizeTeamsTitle,
};
