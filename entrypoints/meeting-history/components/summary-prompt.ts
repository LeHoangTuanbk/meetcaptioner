import { formatMeetingDateTime } from "./export-date-time";
import type { MeetingSession } from "./types";

export type SummaryAction = "copy" | "chatgpt";

const buildCaptionTranscript = (session: MeetingSession): string =>
  session.captions
    .map((caption) => {
      const lines = [`[${caption.time}] ${caption.speaker}: ${caption.text}`];
      if (caption.translation) {
        lines.push(`Translation: ${caption.translation}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");

const buildChatTranscript = (session: MeetingSession): string =>
  (session.chatMessages ?? [])
    .map((message) => `[${message.time}] ${message.author}: ${message.text}`)
    .join("\n");

const buildMeetingRecord = (session: MeetingSession): string => {
  const captions = buildCaptionTranscript(session) || "No captions captured.";
  const chat = buildChatTranscript(session) || "No chat messages captured.";

  return `Spoken transcript:\n${captions}\n\nMeeting chat:\n${chat}`;
};

export const buildSummaryPrompt = (session: MeetingSession): string => {
  const title = session.title || `Meeting ${session.meetingCode}`;

  return `You are a meeting analyst. Summarize the meeting transcript below.

Return a clear, concise report with these sections:
1. Executive summary
2. Key decisions
3. Action items grouped by person
   - Include the task, owner, deadline, and dependencies when available.
   - Use "Unassigned" or "Not specified" when the meeting does not provide the information.
4. Open questions and follow-ups

Do not invent facts, decisions, owners, or deadlines. Respond in the predominant language used in the meeting.

Meeting: ${title}
Meeting code: ${session.meetingCode}
Started: ${formatMeetingDateTime(session.startTime)}
Ended: ${formatMeetingDateTime(session.endTime)}

Below is the complete meeting record, including spoken captions and chat messages:

${buildMeetingRecord(session)}`;
};
