import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MeetingSession } from "./components";
import { STORAGE_WARNING_RATIO } from "./constants";
import { downloadHistoryBackup, parseHistoryBackup } from "./history-backup";
import {
  fetchMeetingHistory,
  fetchStorageInfo,
  requestHistoryImport,
} from "./history-api";
import type { StorageInfo } from "./history-api";

export const useHistoryStorage = () => {
  const [sessions, setSessions] = useState<MeetingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    bytesUsed: 0,
    quota: 5242880,
  });

  const loadHistory = async () => {
    setIsLoading(true);
    setHistoryError(null);
    try {
      setSessions(await fetchMeetingHistory());
    } catch {
      setHistoryError("Your meeting history couldn't be loaded.");
      toast.error("Failed to load meeting history");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const info = await fetchStorageInfo();
      setStorageInfo(info);
      if (info.quota > 0 && info.bytesUsed / info.quota >= STORAGE_WARNING_RATIO) {
        toast.warning("Meeting history storage is almost full. Back it up soon.", {
          id: "storage-warning",
        });
      }
    } catch {
      // The history remains usable when storage metrics are unavailable.
    }
  };

  const exportAllHistory = async () => {
    try {
      const latestSessions = await fetchMeetingHistory();
      downloadHistoryBackup(latestSessions);
      toast.success("Meeting history backup downloaded");
    } catch {
      toast.error("Failed to export meeting history");
    }
  };

  const restoreHistoryBackup = async (file: File) => {
    try {
      const importedSessions = await parseHistoryBackup(file);
      await requestHistoryImport(importedSessions);
      await Promise.all([loadHistory(), loadStorageInfo()]);
      toast.success("Meeting history restored from backup");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Restore failed";
      toast.error(message);
    }
  };

  useEffect(() => {
    void loadHistory();
    void loadStorageInfo();
  }, []);

  return {
    sessions,
    setSessions,
    isLoading,
    historyError,
    storageInfo,
    loadHistory,
    loadStorageInfo,
    exportAllHistory,
    restoreHistoryBackup,
  };
};
