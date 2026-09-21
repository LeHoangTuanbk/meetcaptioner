import { formatMeetingDateTime } from "./export-date-time";
import type { MeetingSession, SavedCaption } from "./types";

export type ExportType = "captions" | "translations" | "both";
export type ExportFormat = "csv" | "txt";

const getExportableCaptions = (
  captions: SavedCaption[],
  type: ExportType
) =>
  type === "translations"
    ? captions.filter((caption) => caption.translation)
    : captions;

const buildTextContent = (
  session: MeetingSession,
  type: ExportType
): string => {
  const title = session.title || `Meeting ${session.meetingCode}`;
  const lines = [
    title,
    "=".repeat(title.length),
    `Meeting code: ${session.meetingCode}`,
    `Started: ${formatMeetingDateTime(session.startTime)}`,
    `Ended: ${formatMeetingDateTime(session.endTime)}`,
    "",
  ];

  for (const caption of getExportableCaptions(session.captions, type)) {
    lines.push(`[${caption.time}] ${caption.speaker}:`);
    if (type === "captions") lines.push(`  ${caption.text}`);
    if (type === "translations") lines.push(`  ${caption.translation}`);
    if (type === "both") {
      lines.push(`  Original: ${caption.text}`);
      if (caption.translation) {
        lines.push(`  Translation: ${caption.translation}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
};

const escapeCsvCell = (value: string): string =>
  `"${value.replaceAll('"', '""')}"`;

const getCsvHeaders = (type: ExportType): string[] => {
  const meetingHeaders = [
    "Meeting",
    "Meeting Code",
    "Started",
    "Ended",
    "Caption Time",
    "Speaker",
  ];
  if (type === "captions") return [...meetingHeaders, "Caption"];
  if (type === "translations") return [...meetingHeaders, "Translation"];
  return [...meetingHeaders, "Caption", "Translation"];
};

const getCsvRow = (
  session: MeetingSession,
  caption: SavedCaption,
  type: ExportType
): string[] => {
  const metadata = [
    session.title || `Meeting ${session.meetingCode}`,
    session.meetingCode,
    formatMeetingDateTime(session.startTime),
    formatMeetingDateTime(session.endTime),
    caption.time,
    caption.speaker,
  ];
  if (type === "captions") return [...metadata, caption.text];
  if (type === "translations") {
    return [...metadata, caption.translation ?? ""];
  }
  return [...metadata, caption.text, caption.translation ?? ""];
};

const buildCsvContent = (
  session: MeetingSession,
  type: ExportType
): string => {
  const rows = [
    getCsvHeaders(type),
    ...getExportableCaptions(session.captions, type).map((caption) =>
      getCsvRow(session, caption, type)
    ),
  ];

  return rows
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
};

const downloadFile = (
  content: string,
  filename: string,
  format: ExportFormat
): void => {
  const mimeType = format === "csv" ? "text/csv;charset=utf-8" : "text/plain";
  const prefix = format === "csv" ? "\uFEFF" : "";
  const url = URL.createObjectURL(new Blob([prefix, content], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const exportMeetingSession = (
  session: MeetingSession,
  type: ExportType,
  format: ExportFormat
): void => {
  const date = new Date(session.startTime).toISOString().slice(0, 10);
  const name = session.title
    ? session.title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()
    : session.meetingCode;
  const content =
    format === "csv"
      ? buildCsvContent(session, type)
      : buildTextContent(session, type);

  downloadFile(content, `${name}_${date}_${type}.${format}`, format);
};
