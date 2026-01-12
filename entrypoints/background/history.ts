import type { MeetingSession } from "./types";

export async function getMeetingHistory(): Promise<{
  success: boolean;
  sessions: MeetingSession[];
}> {
  const result = await chrome.storage.local.get("meetingHistory");
  const sessions = (result.meetingHistory as MeetingSession[]) || [];
  return { success: true, sessions };
}

export async function saveMeetingSession(
  session: MeetingSession
): Promise<{ success: boolean }> {
  const { sessions } = await getMeetingHistory();

  const existingIndex = sessions.findIndex((s) => s.id === session.id);
  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.push(session);
  }

  sessions.sort((a, b) => b.startTime - a.startTime);

  await chrome.storage.local.set({ meetingHistory: sessions });
  return { success: true };
}

export async function deleteMeetingSession(
  sessionId: string
): Promise<{ success: boolean }> {
  const { sessions } = await getMeetingHistory();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  await chrome.storage.local.set({ meetingHistory: filtered });
  return { success: true };
}

export async function updateMeetingSession(
  sessionId: string,
  updates: Partial<MeetingSession>
): Promise<{ success: boolean }> {
  const { sessions } = await getMeetingHistory();
  const index = sessions.findIndex((s) => s.id === sessionId);
  if (index >= 0) {
    sessions[index] = { ...sessions[index], ...updates };
    await chrome.storage.local.set({ meetingHistory: sessions });
  }
  return { success: true };
}

export async function clearMeetingHistory(): Promise<{ success: boolean }> {
  await chrome.storage.local.set({ meetingHistory: [] });
  return { success: true };
}

export async function getStorageUsage(): Promise<{
  success: boolean;
  bytesUsed: number;
  quota: number;
}> {
  const bytesUsed = await chrome.storage.local.getBytesInUse(null);
  const quota = 5242880;
  return { success: true, bytesUsed, quota };
}
