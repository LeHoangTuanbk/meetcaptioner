import type { MeetingSession, SavedCaption, Caption } from "@content/types";
import { debounce } from "@content/libs";
import { showErrorToast } from "@content/overlay/shared";

let currentSession: MeetingSession | null = null;

const allCaptions = new Map<number, SavedCaption>();
let isSaveFailureNotified = false;

const MEETING_TITLE_SELECTOR =
  '[role="heading"][aria-level="1"] [jsname="NeC6gb"]';

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

const getMeetingCodeFromUrl = (): string => {
  const match = window.location.pathname.match(
    /\/([a-z]{3}-[a-z]{4}-[a-z]{3})/,
  );
  return match ? match[1] : "unknown";
};

/** Reads the visible meeting title from the current Google Meet layout. */
const getMeetingTitle = (): string | undefined => {
  const titleElement = document.querySelector<HTMLElement>(
    MEETING_TITLE_SELECTOR,
  );
  const title = titleElement?.textContent?.trim();
  if (title) return title;

  // Keep compatibility with older Google Meet layouts.
  const legacyElement = document.querySelector<HTMLElement>(
    "[data-meeting-title]",
  );
  return legacyElement?.dataset.meetingTitle?.trim() || undefined;
};

export const initMeetingSession = (): void => {
  if (currentSession) return;

  currentSession = {
    id: generateId(),
    meetingUrl: window.location.href,
    meetingCode: getMeetingCodeFromUrl(),
    startTime: Date.now(),
    captions: [],
  };
};

export const addCaptionToHistory = (caption: Caption): void => {
  const saved: SavedCaption = {
    speaker: caption.speaker,
    text: caption.text,
    translation: caption.translation || undefined,
    time: caption.time,
    timestamp: Date.now(),
  };
  allCaptions.set(caption.id, saved);
};

export const updateCaptionInHistory = (
  captionId: number,
  updates: Partial<Pick<SavedCaption, "text" | "translation">>,
): void => {
  const existing = allCaptions.get(captionId);
  if (existing) {
    if (updates.text !== undefined) existing.text = updates.text;
    if (updates.translation !== undefined)
      existing.translation = updates.translation;
  }
};

const saveToStorage = async (): Promise<void> => {
  if (!currentSession || allCaptions.size === 0) return;

  if (!currentSession.title) {
    currentSession.title = getMeetingTitle();
  }

  currentSession.captions = Array.from(allCaptions.values());
  currentSession.endTime = Date.now();

  try {
    const response = await chrome.runtime.sendMessage({
      action: "saveMeetingSession",
      session: currentSession,
    });
    if (!response?.success) throw new Error(response?.error);
    isSaveFailureNotified = false;
  } catch {
    if (isSaveFailureNotified) return;
    isSaveFailureNotified = true;
    showErrorToast(
      "Captions couldn't be saved. Your existing meeting history is safe."
    );
  }
};

export const saveCaptionsDebounced = debounce(saveToStorage, 500);

export const updateSessionEndTime = (): void => {
  if (!currentSession) return;
  currentSession.endTime = Date.now();
  saveToStorage();
};

export const getCurrentSessionId = (): string | null => {
  return currentSession?.id || null;
};
