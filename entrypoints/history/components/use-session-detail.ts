import { useMemo } from "react";
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

type ExportType = "captions" | "translations" | "both";

const buildExportContent = (
  session: MeetingSession,
  type: ExportType
): string => {
  const title = session.title || `Meeting ${session.meetingCode}`;
  let content = `${title}\n${"=".repeat(title.length)}\n\n`;

  for (const caption of session.captions) {
    content += `[${caption.time}] ${caption.speaker}:\n`;

    if (type === "captions") {
      content += `  ${caption.text}\n`;
    } else if (type === "translations") {
      if (caption.translation) {
        content += `  ${caption.translation}\n`;
      }
    } else {
      content += `  Original: ${caption.text}\n`;
      if (caption.translation) {
        content += `  Translation: ${caption.translation}\n`;
      }
    }
    content += "\n";
  }

  return content;
};

const downloadFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export function useSessionDetail(session: MeetingSession) {
  const hasTranslations = useMemo(
    () => session.captions.some((c) => c.translation),
    [session.captions]
  );

  const displayTitle = session.title || `Meeting ${session.meetingCode}`;

  const formattedStartTime = formatDateTime(session.startTime);
  const formattedEndTime = session.endTime ? formatTime(session.endTime) : null;

  const exportSession = (type: ExportType) => {
    const date = new Date(session.startTime).toISOString().slice(0, 10);
    const filename = session.title
      ? session.title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()
      : session.meetingCode;

    const content = buildExportContent(session, type);
    downloadFile(content, `${filename}_${date}_${type}.txt`);
  };

  const handleDelete = (onDelete: () => void) => {
    if (confirm("Delete this session?")) {
      onDelete();
    }
  };

  return {
    hasTranslations,
    displayTitle,
    formattedStartTime,
    formattedEndTime,
    exportSession,
    handleDelete,
  };
}
