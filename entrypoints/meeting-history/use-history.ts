import { useMemo, useState } from "react";
import { appToast } from "../shared/app-toast";
import type { MeetingSession } from "./components";
import {
  requestHistoryClear,
  requestSessionDelete,
  requestNotesUpdate,
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
      appToast.success("Session deleted");
      void loadStorageInfo();
    } catch {
      appToast.error("Failed to delete session");
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
      appToast.success("All history cleared");
      void loadStorageInfo();
    } catch {
      appToast.error("Failed to clear history");
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
      appToast.success("Title updated");
    } catch {
      appToast.error("Failed to update title");
    }
  };

  const updateSessionNotes = async (sessionId: string, notes: string) => {
    try {
      const nextNotes = notes.trim() || undefined;
      await requestNotesUpdate(sessionId, notes);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, notes: nextNotes } : s)),
      );
      if (selectedSession?.id === sessionId) {
        setSelectedSession((prev) =>
          prev ? { ...prev, notes: nextNotes } : null,
        );
      }
      appToast.success("Notes saved");
    } catch {
      appToast.error("Failed to save notes");
      throw new Error("Failed to save notes");
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
    updateSessionNotes,
  };
}
