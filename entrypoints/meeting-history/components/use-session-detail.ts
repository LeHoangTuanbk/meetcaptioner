import { toast } from "sonner";
import { exportMeetingSession } from "./export-session";
import type { ExportFormat } from "./export-session";
import { buildSummaryPrompt } from "./summary-prompt";
import type { SummaryAction } from "./summary-prompt";
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

  const handleSummaryAction = (action: SummaryAction) => {
    const prompt = buildSummaryPrompt(session);

    if (action === "copy") {
      void navigator.clipboard
        .writeText(prompt)
        .then(() => toast.success("Summary prompt copied"))
        .catch(() => toast.error("Failed to copy summary prompt"));
      return;
    }

    const url = new URL("https://chatgpt.com/");
    url.searchParams.set("q", prompt);
    void chrome.tabs
      .create({ url: url.toString() })
      .catch(() => toast.error("Failed to open ChatGPT"));
  };

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
    handleSummaryAction,
    handleDelete,
  };
}
