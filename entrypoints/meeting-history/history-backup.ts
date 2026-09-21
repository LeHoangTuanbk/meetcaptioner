import type { MeetingSession } from "./components";

const BACKUP_FORMAT = "meetcaptioner-history-backup";

export const downloadHistoryBackup = (sessions: MeetingSession[]): void => {
  const exportedAt = new Date();
  const backup = {
    format: BACKUP_FORMAT,
    schemaVersion: 1,
    exportedAt: exportedAt.toISOString(),
    sessionCount: sessions.length,
    captionCount: sessions.reduce(
      (total, session) => total + session.captions.length,
      0
    ),
    sessions,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `meetcaptioner-backup-${exportedAt
    .toISOString()
    .replaceAll(":", "-")}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const parseHistoryBackup = async (
  file: File
): Promise<MeetingSession[]> => {
  const parsed: unknown = JSON.parse(await file.text());
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("format" in parsed) ||
    parsed.format !== BACKUP_FORMAT ||
    !("schemaVersion" in parsed) ||
    parsed.schemaVersion !== 1 ||
    !("sessions" in parsed) ||
    !Array.isArray(parsed.sessions)
  ) {
    throw new Error("Invalid MeetCaptioner backup file");
  }
  return parsed.sessions;
};
