import type { MeetingSession, SavedCaption, Caption } from "./types";
import type { MeetingSessionMetadata } from "./providers/types";
import { debounce } from "./libs";
import { buildMeetingSessionSearchableText } from "../shared/meeting-session";

let currentSession: MeetingSession | null = null;
let getLatestMetadata: (() => MeetingSessionMetadata) | null = null;

const allCaptions = new Map<number, SavedCaption>();

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function isMeaningfulTitle(title: string | undefined): boolean {
  if (!title) {
    return false;
  }

  const normalized = title.trim();
  if (!normalized) {
    return false;
  }

  return (
    !/^microsoft teams$/i.test(normalized) &&
    !/^teams$/i.test(normalized) &&
    !/^microsoft teams meeting$/i.test(normalized)
  );
}

function getTitleQualityScore(title: string | undefined): number {
  if (!title || !title.trim()) {
    return 0;
  }

  const normalized = title.trim();

  if (
    /^microsoft teams$/i.test(normalized) ||
    /^teams$/i.test(normalized) ||
    /^microsoft teams meeting$/i.test(normalized)
  ) {
    return 1;
  }

  if (/^meeting with /i.test(normalized) || /^call with /i.test(normalized)) {
    return 3;
  }

  return 2;
}

function shouldReplaceTitle(
  currentTitle: string | undefined,
  nextTitle: string | undefined
): boolean {
  if (!nextTitle || !nextTitle.trim()) {
    return false;
  }

  const currentScore = getTitleQualityScore(currentTitle);
  const nextScore = getTitleQualityScore(nextTitle);

  if (nextScore > currentScore) {
    return true;
  }

  if (
    nextScore === currentScore &&
    nextTitle.trim().length > (currentTitle?.trim().length || 0)
  ) {
    return true;
  }

  return !isMeaningfulTitle(currentTitle) && isMeaningfulTitle(nextTitle);
}

function refreshSessionMetadata(): void {
  if (!currentSession || !getLatestMetadata) {
    return;
  }

  const metadata = getLatestMetadata();
  currentSession.platform = metadata.platform;
  currentSession.providerLabel = metadata.providerLabel;
  currentSession.meetingUrl = metadata.sourceUrl;

  const mergedIdentifiers: typeof currentSession.identifiers = {
    ...(currentSession.identifiers || {}),
  };
  if (metadata.identifiers) {
    for (const [key, value] of Object.entries(metadata.identifiers)) {
      if (
        value !== undefined &&
        value !== null &&
        (typeof value !== "string" || value.trim() !== "")
      ) {
        mergedIdentifiers[key as keyof typeof mergedIdentifiers] = value;
      }
    }
  }
  currentSession.identifiers = mergedIdentifiers;

  if (shouldReplaceTitle(currentSession.title, metadata.title)) {
    currentSession.title = metadata.title;
  }
}

export function initMeetingSession(
  metadata: MeetingSessionMetadata,
  metadataProvider?: () => MeetingSessionMetadata
): void {
  if (currentSession) return;

  currentSession = {
    id: generateId(),
    platform: metadata.platform,
    providerLabel: metadata.providerLabel,
    meetingUrl: metadata.sourceUrl,
    title: metadata.title,
    identifiers: metadata.identifiers,
    searchableText: "",
    startTime: Date.now(),
    captions: [],
  };

  getLatestMetadata = metadataProvider || null;
}

export function addCaptionToHistory(caption: Caption): void {
  const saved: SavedCaption = {
    speaker: caption.speaker,
    text: caption.text,
    translation: caption.translation || undefined,
    time: caption.time,
    timestamp: Date.now(),
  };
  allCaptions.set(caption.id, saved);
}

export function updateCaptionInHistory(
  captionId: number,
  updates: Partial<Pick<SavedCaption, "text" | "translation">>
): void {
  const existing = allCaptions.get(captionId);
  if (existing) {
    if (updates.text !== undefined) existing.text = updates.text;
    if (updates.translation !== undefined)
      existing.translation = updates.translation;
  }
}

async function saveToStorage(): Promise<void> {
  if (!currentSession) return;

  refreshSessionMetadata();

  currentSession.captions = Array.from(allCaptions.values());
  currentSession.searchableText = buildMeetingSessionSearchableText(
    currentSession
  );
  currentSession.endTime = Date.now();

  try {
    await chrome.runtime.sendMessage({
      action: "saveMeetingSession",
      session: currentSession,
    });
  } catch {
    // Session save failed silently
  }
}

export const saveCaptionsDebounced = debounce(saveToStorage, 500);

export function updateSessionEndTime(): void {
  if (!currentSession) return;
  refreshSessionMetadata();
  currentSession.endTime = Date.now();
  currentSession.searchableText = buildMeetingSessionSearchableText(
    currentSession
  );
  saveToStorage();
}

export function getCurrentSessionId(): string | null {
  return currentSession?.id || null;
}

export function resetMeetingSession(): void {
  currentSession = null;
  getLatestMetadata = null;
  allCaptions.clear();
}
