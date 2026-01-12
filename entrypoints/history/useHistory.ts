import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { MeetingSession } from "./components";

interface StorageInfo {
  bytesUsed: number;
  quota: number;
}

export function useHistory() {
  const [sessions, setSessions] = useState<MeetingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<MeetingSession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({ bytesUsed: 0, quota: 5242880 });

  useEffect(() => {
    loadHistory();
    loadStorageInfo();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: "getMeetingHistory" });
      if (response?.success) {
        setSessions(response.sessions || []);
      }
    } catch {
      toast.error("Failed to load meeting history");
    } finally {
      setLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: "getStorageUsage" });
      if (response?.success) {
        setStorageInfo({ bytesUsed: response.bytesUsed, quota: response.quota });
      }
    } catch {
      // Storage info load failed silently
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await chrome.runtime.sendMessage({ action: "deleteMeetingSession", sessionId });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
      toast.success("Session deleted");
      loadStorageInfo();
    } catch {
      toast.error("Failed to delete session");
    }
  };

  const clearAllHistory = async () => {
    if (!confirm("Are you sure you want to delete all meeting history? This cannot be undone.")) {
      return;
    }
    try {
      await chrome.runtime.sendMessage({ action: "clearMeetingHistory" });
      setSessions([]);
      setSelectedSession(null);
      toast.success("All history cleared");
      loadStorageInfo();
    } catch {
      toast.error("Failed to clear history");
    }
  };

  const updateSessionTitle = async (sessionId: string, title: string) => {
    try {
      await chrome.runtime.sendMessage({
        action: "updateMeetingSession",
        sessionId,
        updates: { title: title || undefined },
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: title || undefined } : s))
      );
      if (selectedSession?.id === sessionId) {
        setSelectedSession((prev) => (prev ? { ...prev, title: title || undefined } : null));
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
    loading,
    selectedSession,
    setSelectedSession,
    searchQuery,
    setSearchQuery,
    storageInfo,
    filteredSessions,
    deleteSession,
    clearAllHistory,
    updateSessionTitle,
  };
}
