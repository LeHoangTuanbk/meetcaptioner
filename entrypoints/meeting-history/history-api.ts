import type { MeetingSession } from "./components";

export type StorageInfo = {
  bytesUsed: number;
  quota: number;
};

const ensureSuccess = (response: { success?: boolean; error?: string }) => {
  if (!response?.success) {
    throw new Error(response?.error || "History operation failed");
  }
};

export const fetchMeetingHistory = async (): Promise<MeetingSession[]> => {
  const response = await chrome.runtime.sendMessage({
    action: "getMeetingHistory",
  });
  ensureSuccess(response);
  if (!Array.isArray(response.sessions)) {
    throw new Error("Meeting history has an invalid format");
  }
  return response.sessions;
};

export const fetchStorageInfo = async (): Promise<StorageInfo> => {
  const response = await chrome.runtime.sendMessage({
    action: "getStorageUsage",
  });
  ensureSuccess(response);
  return { bytesUsed: response.bytesUsed, quota: response.quota };
};

export const requestSessionDelete = async (sessionId: string) => {
  const response = await chrome.runtime.sendMessage({
    action: "deleteMeetingSession",
    sessionId,
  });
  ensureSuccess(response);
};

export const requestHistoryClear = async () => {
  const response = await chrome.runtime.sendMessage({
    action: "clearMeetingHistory",
  });
  ensureSuccess(response);
};

export const requestHistoryImport = async (sessions: MeetingSession[]) => {
  const response = await chrome.runtime.sendMessage({
    action: "importMeetingHistory",
    sessions,
  });
  ensureSuccess(response);
};

export const requestTitleUpdate = async (
  sessionId: string,
  title: string
) => {
  const response = await chrome.runtime.sendMessage({
    action: "updateMeetingSession",
    sessionId,
    updates: { title: title || undefined },
  });
  ensureSuccess(response);
};
