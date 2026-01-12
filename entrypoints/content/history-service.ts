import type { MeetingSession, SavedCaption, Caption } from "./types";
import { captions } from "./state";
import { debounce } from "./libs";

let currentSession: MeetingSession | null = null;

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

function convertToSavedCaption(caption: Caption): SavedCaption {
  return {
    speaker: caption.speaker,
    text: caption.text,
    translation: caption.translation || undefined,
    time: caption.time,
    timestamp: Date.now(),
  };
}

async function saveToStorage(): Promise<void> {
  if (!currentSession) return;

  // Try to get title if not already set
  if (!currentSession.title) {
    currentSession.title = getMeetingTitle();
  }

  // Convert current captions to saved format
  currentSession.captions = captions.map(convertToSavedCaption);
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
  // Final save without debounce
  saveToStorage();
}

export function getCurrentSessionId(): string | null {
  return currentSession?.id || null;
}
