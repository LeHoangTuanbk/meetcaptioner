import { formatMeetingDateTime } from "./export-date-time";
import type { ExportType } from "./export-session";
import type { MeetingSession, SavedCaption } from "./types";

export const getExportableCaptions = (
  captions: SavedCaption[],
  type: ExportType
) =>
  type === "translations"
    ? captions.filter((caption) => caption.translation)
    : captions;

const escapeCsvCell = (value: string): string =>
  `"${value.replaceAll('"', '""')}"`;

const getCsvHeaders = (type: ExportType): string[] => {
  const meetingHeaders = [
    "Meeting",
    "Meeting Code",
    "Started",
    "Ended",
    "Content Type",
    "Caption Time",
    "Speaker",
  ];
  if (type === "captions") return [...meetingHeaders, "Caption"];
  if (type === "translations") return [...meetingHeaders, "Translation"];
  return [...meetingHeaders, "Caption", "Translation"];
};

/** Builds one CSV row; untranslated content leaves the Translation column empty. */
const buildRow = (
  session: MeetingSession,
  type: ExportType,
  entry: { contentType: string; time: string; speaker: string; text: string; translation?: string }
): string[] => {
  const metadata = [
    session.title || `Meeting ${session.meetingCode}`,
    session.meetingCode,
    formatMeetingDateTime(session.startTime),
    formatMeetingDateTime(session.endTime),
    entry.contentType,
    entry.time,
    entry.speaker,
  ];
  if (type === "captions") return [...metadata, entry.text];
  if (type === "translations") return [...metadata, entry.translation ?? ""];
  return [...metadata, entry.text, entry.translation ?? ""];
};

export const buildCsvContent = (
  session: MeetingSession,
  type: ExportType
): string => {
  const notes = session.notes?.trim();
  const noteRows =
    type !== "translations" && notes
      ? [buildRow(session, type, { contentType: "Notes", time: "", speaker: "You", text: notes })]
      : [];
  const captionRows = getExportableCaptions(session.captions, type).map((caption) =>
    buildRow(session, type, {
      contentType: "Caption",
      time: caption.time,
      speaker: caption.speaker,
      text: caption.text,
      translation: caption.translation,
    }),
  );
  const chatRows =
    type === "translations"
      ? []
      : (session.chatMessages ?? []).map((message) =>
          buildRow(session, type, {
            contentType: "Chat",
            time: message.time,
            speaker: message.author,
            text: message.text,
          }),
        );

  return [getCsvHeaders(type), ...noteRows, ...captionRows, ...chatRows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
};
