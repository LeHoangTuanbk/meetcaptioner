import { useMemo } from "react";
import type { MeetingSession } from "./types";
import {
  getMeetingDisplayTitle,
  getMeetingIdentifierLabel,
  getPrimaryMeetingIdentifier,
} from "../../shared/meeting-session";

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

export const formatDuration = (start: number, end?: number): string | null => {
  if (!end) return null;

  const diff = end - start;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

type ExportType = "captions" | "translations" | "both";

const buildExportContent = (
  session: MeetingSession,
  type: ExportType
): string => {
  const title = getMeetingDisplayTitle(session);
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

  const displayTitle = getMeetingDisplayTitle(session);
  const displayIdentifier = getPrimaryMeetingIdentifier(session.identifiers);
  const identifierEntries = Object.entries(session.identifiers)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => ({
      key,
      label: getMeetingIdentifierLabel(
        key as keyof typeof session.identifiers
      ),
      value: value as string,
    }));

  const formattedStartTime = formatDateTime(session.startTime);
  const formattedEndTime = session.endTime ? formatTime(session.endTime) : null;
  const formattedDuration = formatDuration(session.startTime, session.endTime);

  const metadataRows = [
    { label: "Provider", value: session.providerLabel },
    { label: "Title", value: session.title || "Untitled session" },
    { label: "Primary ID", value: displayIdentifier },
    { label: "Meeting URL", value: session.meetingUrl },
    { label: "Started", value: formattedStartTime },
    ...(formattedEndTime
      ? [{ label: "Ended", value: formattedEndTime }]
      : []),
    ...(formattedDuration
      ? [{ label: "Duration", value: formattedDuration }]
      : []),
    { label: "Captured captions", value: String(session.captions.length) },
    ...identifierEntries.map((entry) => ({
      label: entry.label,
      value: entry.value,
    })),
  ];

  const exportSession = (type: ExportType) => {
    const date = new Date(session.startTime).toISOString().slice(0, 10);
    const filename = session.title
      ? session.title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()
      : displayIdentifier;

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
    displayIdentifier,
    identifierEntries,
    metadataRows,
    formattedStartTime,
    formattedEndTime,
    formattedDuration,
    exportSession,
    handleDelete,
  };
}
