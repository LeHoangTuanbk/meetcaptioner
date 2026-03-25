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

function refreshSessionMetadata(): void {
  if (!currentSession || !getLatestMetadata) {
    return;
  }

  const metadata = getLatestMetadata();
  currentSession.platform = metadata.platform;
  currentSession.providerLabel = metadata.providerLabel;
  currentSession.meetingUrl = metadata.sourceUrl;
  currentSession.identifiers = {
    ...currentSession.identifiers,
    ...metadata.identifiers,
  };

  if (!currentSession.title && metadata.title) {
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
