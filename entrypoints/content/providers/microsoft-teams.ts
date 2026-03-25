import { getProviderLabel } from "../../shared/meeting-session";
import type { MeetingProvider } from "./types";

function normalizeTeamsTitle(rawTitle: string): string | undefined {
  const title = rawTitle
    .replace(/\s*\|\s*Microsoft Teams\s*$/i, "")
    .replace(/\s*\|\s*Teams\s*$/i, "")
    .trim();

  return title || undefined;
}

function extractTeamsThreadId(url: URL): string | undefined {
  const matchupPath = url.pathname.match(/\/l\/meetup-join\/([^/]+)/);
  if (matchupPath?.[1]) {
    try {
      return decodeURIComponent(matchupPath[1]);
    } catch {
      return matchupPath[1];
    }
  }

  const threadId = url.searchParams.get("threadId");
  return threadId || undefined;
}

function extractTeamsMeetingId(url: URL): string | undefined {
  const meetingId =
    url.searchParams.get("meetingId") ||
    url.searchParams.get("meetingid") ||
    url.searchParams.get("meeting-id");

  if (meetingId) {
    return meetingId;
  }

  const context = url.searchParams.get("context");
  if (!context) {
    return undefined;
  }

  const decodedContext = decodeURIComponent(context);
  const match = decodedContext.match(/"Oid":"([^"]+)"/i);
  return match?.[1];
}

export const microsoftTeamsProvider: MeetingProvider = {
  platform: "microsoft-teams",

  matchesUrl(url) {
    return (
      url.hostname === "teams.microsoft.com" &&
      (url.pathname.includes("/l/meetup-join/") ||
        url.pathname.includes("/meet/") ||
        url.pathname.includes("/v2/"))
    );
  },

  bootstrap() {
    return undefined;
  },

  startCaptionObserver() {
    return () => undefined;
  },

  getSessionMetadata() {
    return {
      platform: "microsoft-teams",
      providerLabel: getProviderLabel("microsoft-teams"),
      title: normalizeTeamsTitle(document.title),
      sourceUrl: window.location.href,
      identifiers: {
        meetingId: extractTeamsMeetingId(new URL(window.location.href)),
        threadId: extractTeamsThreadId(new URL(window.location.href)),
      },
    };
  },

  getEmptyState() {
    return {
      waitingTitle: "Waiting for captions...",
      waitingBody:
        "Turn on live captions in Microsoft Teams Web to start capturing text",
    };
  },

  getCaptureGuide() {
    return {
      modalTitle: "Enable Capture In Microsoft Teams",
      modalBody:
        "MeetCaptioner can start once Microsoft Teams live captions are enabled in this browser meeting.",
      steps: [
        {
          title: "Open meeting controls",
          detail: "Move your mouse or focus the meeting footer controls.",
        },
        {
          title: "Open more actions",
          detail: "Find the More actions menu in the Teams meeting controls.",
        },
        {
          title: "Turn on live captions",
          detail: "Enable live captions so caption text becomes available on the meeting page.",
        },
      ],
      troubleshootingHint:
        "If captions are unavailable, the organizer or admin policy may be restricting caption controls.",
    };
  },

  isCaptioningCurrentlyAvailable() {
    return false;
  },
};

export const microsoftTeamsProviderInternals = {
  extractTeamsMeetingId,
  extractTeamsThreadId,
  normalizeTeamsTitle,
};
