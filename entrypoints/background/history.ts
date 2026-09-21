import type { MeetingSession } from "./types";
import {
  isMeetingSession,
  mergeMeetingSession,
  parseStoredSessions,
} from "./history-data";

let writeQueue: Promise<void> = Promise.resolve();

const readSessions = async (): Promise<MeetingSession[]> => {
  const result = await chrome.storage.local.get("meetingHistory");
  return parseStoredSessions(result.meetingHistory);
};

const enqueueWrite = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
};

export const getMeetingHistory = async (): Promise<{
  success: boolean;
  sessions: MeetingSession[];
}> => {
  await writeQueue;
  return { success: true, sessions: await readSessions() };
};

export const saveMeetingSession = (
  session: MeetingSession
): Promise<{ success: boolean }> =>
  enqueueWrite(async () => {
    const sessions = await readSessions();
    const existingIndex = sessions.findIndex((item) => item.id === session.id);

    if (existingIndex >= 0) {
      sessions[existingIndex] = mergeMeetingSession(
        sessions[existingIndex],
        session
      );
    } else {
      sessions.push(session);
    }

    sessions.sort((a, b) => b.startTime - a.startTime);
    await chrome.storage.local.set({ meetingHistory: sessions });
    return { success: true };
  });

export const deleteMeetingSession = (
  sessionId: string
): Promise<{ success: boolean }> =>
  enqueueWrite(async () => {
    const sessions = await readSessions();
    const filtered = sessions.filter((session) => session.id !== sessionId);
    await chrome.storage.local.set({ meetingHistory: filtered });
    return { success: true };
  });

export const updateMeetingSession = (
  sessionId: string,
  updates: Partial<MeetingSession>
): Promise<{ success: boolean }> =>
  enqueueWrite(async () => {
    const sessions = await readSessions();
    const index = sessions.findIndex((session) => session.id === sessionId);
    if (index >= 0) {
      sessions[index] = { ...sessions[index], ...updates };
      await chrome.storage.local.set({ meetingHistory: sessions });
    }
    return { success: true };
  });

export const clearMeetingHistory = (): Promise<{ success: boolean }> =>
  enqueueWrite(async () => {
    await chrome.storage.local.set({ meetingHistory: [] });
    return { success: true };
  });

export const importMeetingHistory = (
  importedSessions: MeetingSession[]
): Promise<{ success: boolean }> =>
  enqueueWrite(async () => {
    if (!Array.isArray(importedSessions) || !importedSessions.every(isMeetingSession)) {
      throw new Error("Backup contains invalid meeting history");
    }

    const sessions = await readSessions();
    const sessionsById = new Map(sessions.map((session) => [session.id, session]));
    importedSessions.forEach((session) => {
      const existing = sessionsById.get(session.id);
      sessionsById.set(
        session.id,
        existing ? mergeMeetingSession(existing, session) : session
      );
    });
    const merged = Array.from(sessionsById.values()).sort(
      (first, second) => second.startTime - first.startTime
    );
    await chrome.storage.local.set({ meetingHistory: merged });
    return { success: true };
  });

export async function getStorageUsage(): Promise<{
  success: boolean;
  bytesUsed: number;
  quota: number;
}> {
  const bytesUsed = await chrome.storage.local.getBytesInUse(null);
  const quota = chrome.storage.local.QUOTA_BYTES;
  return { success: true, bytesUsed, quota };
}
