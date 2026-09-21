import { exportMeetingSession } from "./export-session";
import type { ExportFormat } from "./export-session";
import type { MeetingSession } from "./types";

export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function useSessionDetail(session: MeetingSession) {
  const displayTitle = session.title || `Meeting ${session.meetingCode}`;

  const formattedStartTime = formatDateTime(session.startTime);
  const formattedEndTime = session.endTime ? formatTime(session.endTime) : null;

  const exportSession = (format: ExportFormat) =>
    exportMeetingSession(session, "both", format);

  const handleDelete = (onDelete: () => void) => {
    if (confirm("Delete this session?")) {
      onDelete();
    }
  };

  return {
    displayTitle,
    formattedStartTime,
    formattedEndTime,
    exportSession,
    handleDelete,
  };
}
