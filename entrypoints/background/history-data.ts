import type { MeetingSession } from "./types";

const isSavedCaption = (value: unknown): boolean =>
  typeof value === "object" &&
  value !== null &&
  "speaker" in value &&
  typeof value.speaker === "string" &&
  "text" in value &&
  typeof value.text === "string" &&
  "timestamp" in value &&
  typeof value.timestamp === "number";

export const isMeetingSession = (value: unknown): value is MeetingSession =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof value.id === "string" &&
  "startTime" in value &&
  typeof value.startTime === "number" &&
  "captions" in value &&
  Array.isArray(value.captions) &&
  value.captions.every(isSavedCaption);

export const parseStoredSessions = (stored: unknown): MeetingSession[] => {
  if (stored === undefined) return [];
  if (!Array.isArray(stored) || !stored.every(isMeetingSession)) {
    throw new Error("Meeting history has an invalid format");
  }
  return stored;
};

export const mergeMeetingSession = (
  existing: MeetingSession,
  incoming: MeetingSession
): MeetingSession => {
  const captions = new Map(existing.captions.map((item) => [item.timestamp, item]));
  incoming.captions.forEach((item) => {
    const saved = captions.get(item.timestamp);
    captions.set(item.timestamp, {
      ...saved,
      ...item,
      translation: item.translation ?? saved?.translation,
    });
  });
  return {
    ...existing,
    ...incoming,
    captions: Array.from(captions.values()).sort(
      (first, second) => first.timestamp - second.timestamp
    ),
  };
};
