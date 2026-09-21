import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { MeetingSession } from "./components";
import {
  requestHistoryClear,
  requestSessionDelete,
  requestTitleUpdate,
} from "./history-api";
import { useHistoryStorage } from "./use-history-storage";

export function useHistory() {
  const {
    sessions,
    setSessions,
    isLoading,
    historyError,
    storageInfo,
    loadHistory,
    loadStorageInfo,
    exportAllHistory,
    restoreHistoryBackup,
  } = useHistoryStorage();
  const [selectedSession, setSelectedSession] = useState<MeetingSession | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  const deleteSession = async (sessionId: string) => {
    try {
      await requestSessionDelete(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
      toast.success("Session deleted");
      void loadStorageInfo();
    } catch {
      toast.error("Failed to delete session");
    }
  };

  const clearAllHistory = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all meeting history? This cannot be undone."
      )
    ) {
      return;
    }
    try {
      await requestHistoryClear();
      setSessions([]);
      setSelectedSession(null);
      toast.success("All history cleared");
      void loadStorageInfo();
    } catch {
      toast.error("Failed to clear history");
    }
  };

  const updateSessionTitle = async (sessionId: string, title: string) => {
    try {
      await requestTitleUpdate(sessionId, title);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, title: title || undefined } : s
        )
      );
      if (selectedSession?.id === sessionId) {
        setSelectedSession((prev) =>
          prev ? { ...prev, title: title || undefined } : null
        );
      }
      toast.success("Title updated");
    } catch {
      toast.error("Failed to update title");
    }
  };

  const filteredSessions = useMemo(() => {
    if (!searchQuery) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter(
      (session) =>
        session.meetingCode.toLowerCase().includes(query) ||
        session.title?.toLowerCase().includes(query) ||
        session.captions.some(
          (c) =>
            c.speaker.toLowerCase().includes(query) ||
            c.text.toLowerCase().includes(query) ||
            c.translation?.toLowerCase().includes(query)
        )
    );
  }, [sessions, searchQuery]);

  return {
    sessions,
    loading: isLoading,
    historyError,
    selectedSession,
    setSelectedSession,
    searchQuery,
    setSearchQuery,
    storageInfo,
    filteredSessions,
    deleteSession,
    clearAllHistory,
    exportAllHistory,
    restoreHistoryBackup,
    retryHistory: loadHistory,
    updateSessionTitle,
  };
}
