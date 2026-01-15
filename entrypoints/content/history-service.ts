import type { MeetingSession, SavedCaption, Caption } from "./types";
import { debounce } from "./libs";

let currentSession: MeetingSession | null = null;

const allCaptions = new Map<number, SavedCaption>();

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getMeetingCodeFromUrl(): string {
  const match = window.location.pathname.match(
    /\/([a-z]{3}-[a-z]{4}-[a-z]{3})/
  );
  return match ? match[1] : "unknown";
}

function getMeetingTitle(): string | undefined {
  const el = document.querySelector("[data-meeting-title]");
  return el?.getAttribute("data-meeting-title") || undefined;
}

export function initMeetingSession(): void {
  if (currentSession) return;

  currentSession = {
    id: generateId(),
    meetingUrl: window.location.href,
    meetingCode: getMeetingCodeFromUrl(),
    title: getMeetingTitle(),
    startTime: Date.now(),
    captions: [],
  };
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

  if (!currentSession.title) {
    currentSession.title = getMeetingTitle();
  }

  currentSession.captions = Array.from(allCaptions.values());
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
  currentSession.endTime = Date.now();
  saveToStorage();
}

export function getCurrentSessionId(): string | null {
  return currentSession?.id || null;
}
