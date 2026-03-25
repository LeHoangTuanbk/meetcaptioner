export type MeetingPlatform = "google-meet" | "microsoft-teams" | "zoom-web";

export type MeetingSessionIdentifiers = {
  meetingCode?: string;
  meetingId?: string;
  conferenceId?: string;
  meetingNumber?: string;
  threadId?: string;
};

export type SavedCaption = {
  speaker: string;
  text: string;
  translation?: string;
  time: string;
  timestamp: number;
};

export type MeetingSession = {
  id: string;
  platform: MeetingPlatform;
  providerLabel: string;
  meetingUrl: string;
  title?: string;
  identifiers: MeetingSessionIdentifiers;
  searchableText: string;
  startTime: number;
  endTime?: number;
  captions: SavedCaption[];
};

type LegacyMeetingSession = {
  id: string;
  meetingUrl: string;
  meetingCode: string;
  title?: string;
  startTime: number;
  endTime?: number;
  captions: SavedCaption[];
  platform?: MeetingPlatform;
  providerLabel?: string;
  searchableText?: string;
};

export type StoredMeetingSession = MeetingSession | LegacyMeetingSession;

const PLATFORM_LABELS: Record<MeetingPlatform, string> = {
  "google-meet": "Google Meet",
  "microsoft-teams": "Microsoft Teams Web",
  "zoom-web": "Zoom Web App",
};

function isMeetingPlatform(value: unknown): value is MeetingPlatform {
  return (
    value === "google-meet" ||
    value === "microsoft-teams" ||
    value === "zoom-web"
  );
}

export function getProviderLabel(platform: MeetingPlatform): string {
  return PLATFORM_LABELS[platform];
}

export function inferMeetingPlatform(
  meetingUrl: string,
  fallback: MeetingPlatform = "google-meet"
): MeetingPlatform {
  if (meetingUrl.includes("meet.google.com")) {
    return "google-meet";
  }

  if (meetingUrl.includes("teams.microsoft.com")) {
    return "microsoft-teams";
  }

  if (meetingUrl.includes("zoom.us")) {
    return "zoom-web";
  }

  return fallback;
}

export function getPrimaryMeetingIdentifier(
  identifiers: MeetingSessionIdentifiers
): string {
  return (
    identifiers.meetingCode ||
    identifiers.meetingId ||
    identifiers.meetingNumber ||
    identifiers.conferenceId ||
    identifiers.threadId ||
    "unknown"
  );
}

export function getMeetingDisplayTitle(
  session: Pick<MeetingSession, "title" | "identifiers">
): string {
  return session.title || `Meeting ${getPrimaryMeetingIdentifier(session.identifiers)}`;
}

export function buildMeetingSessionSearchableText(
  session: Pick<
    MeetingSession,
    "providerLabel" | "title" | "meetingUrl" | "identifiers" | "captions"
  >
): string {
  const metadataParts = [
    session.providerLabel,
    session.title,
    session.meetingUrl,
    session.identifiers.meetingCode,
    session.identifiers.meetingId,
    session.identifiers.meetingNumber,
    session.identifiers.conferenceId,
    session.identifiers.threadId,
  ];

  const captionParts = session.captions.flatMap((caption) => [
    caption.speaker,
    caption.text,
    caption.translation,
  ]);

  return [...metadataParts, ...captionParts]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join("\n")
    .toLowerCase();
}

export function normalizeMeetingSession(
  storedSession: StoredMeetingSession
): MeetingSession {
  const platform = isMeetingPlatform(storedSession.platform)
    ? storedSession.platform
    : inferMeetingPlatform(storedSession.meetingUrl);

  const identifiers =
    "identifiers" in storedSession && storedSession.identifiers
      ? { ...storedSession.identifiers }
      : {
          meetingCode:
            "meetingCode" in storedSession ? storedSession.meetingCode : undefined,
        };

  const providerLabel =
    "providerLabel" in storedSession && storedSession.providerLabel
      ? storedSession.providerLabel
      : getProviderLabel(platform);

  const normalized: MeetingSession = {
    id: storedSession.id,
    platform,
    providerLabel,
    meetingUrl: storedSession.meetingUrl,
    title: storedSession.title,
    identifiers,
    searchableText: "",
    startTime: storedSession.startTime,
    endTime: storedSession.endTime,
    captions: storedSession.captions || [],
  };

  normalized.searchableText = buildMeetingSessionSearchableText(normalized);

  return normalized;
}
