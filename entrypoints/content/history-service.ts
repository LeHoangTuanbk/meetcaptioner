import type { MeetingSession, SavedCaption, Caption } from "./types";
import { captions } from "./state";
import { debounce } from "./utils";

let currentSession: MeetingSession | null = null;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getMeetingCodeFromUrl(): string {
  const match = window.location.pathname.match(/\/([a-z]{3}-[a-z]{4}-[a-z]{3})/);
  return match ? match[1] : "unknown";
}

export function initMeetingSession(): void {
  if (currentSession) return;

  currentSession = {
    id: generateId(),
    meetingUrl: window.location.href,
    meetingCode: getMeetingCodeFromUrl(),
    startTime: Date.now(),
    captions: [],
  };

  console.log("[MeetCaptioner] Meeting session initialized:", currentSession.id);
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

  // Convert current captions to saved format
  currentSession.captions = captions.map(convertToSavedCaption);
  currentSession.endTime = Date.now();

  try {
    await chrome.runtime.sendMessage({
      action: "saveMeetingSession",
      session: currentSession,
    });
    console.log("[MeetCaptioner] Session saved:", currentSession.captions.length, "captions");
  } catch (e) {
    console.error("[MeetCaptioner] Failed to save session:", e);
  }
}

// Debounced save function (1 second delay)
export const saveCaptionsDebounced = debounce(saveToStorage, 1000);

export function updateSessionEndTime(): void {
  if (!currentSession) return;
  currentSession.endTime = Date.now();
  // Final save without debounce
  saveToStorage();
}

export function getCurrentSessionId(): string | null {
  return currentSession?.id || null;
}
