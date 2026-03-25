import { getProviderLabel } from "../../shared/meeting-session";
import type { MeetingProvider } from "./types";

function normalizeZoomTitle(rawTitle: string): string | undefined {
  const title = rawTitle
    .replace(/\s*-\s*Zoom\s*$/i, "")
    .replace(/\s*\|\s*Zoom\s*$/i, "")
    .trim();

  return title || undefined;
}

function extractZoomMeetingNumber(url: URL): string | undefined {
  const pathMatch = url.pathname.match(/\/(?:wc\/join|j|w)\/(\d+)/);
  if (pathMatch?.[1]) {
    return pathMatch[1];
  }

  const confno = url.searchParams.get("confno");
  return confno || undefined;
}

function extractZoomMeetingId(url: URL): string | undefined {
  const meetingId =
    url.searchParams.get("mn") ||
    url.searchParams.get("mid") ||
    url.searchParams.get("meetingId");

  if (meetingId) {
    return meetingId;
  }

  return extractZoomMeetingNumber(url);
}

export const zoomWebProvider: MeetingProvider = {
  platform: "zoom-web",

  matchesUrl(url) {
    return (
      url.hostname.endsWith(".zoom.us") &&
      (url.pathname.includes("/wc/") ||
        url.pathname.includes("/j/") ||
        url.pathname.includes("/w/"))
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
      platform: "zoom-web",
      providerLabel: getProviderLabel("zoom-web"),
      title: normalizeZoomTitle(document.title),
      sourceUrl: window.location.href,
      identifiers: {
        meetingId: extractZoomMeetingId(new URL(window.location.href)),
        meetingNumber: extractZoomMeetingNumber(new URL(window.location.href)),
      },
    };
  },

  getEmptyState() {
    return {
      waitingTitle: "Waiting for captions...",
      waitingBody:
        "Turn on captions or live transcription in Zoom Web App to start capturing text",
    };
  },

  getCaptureGuide() {
    return {
      modalTitle: "Enable Capture In Zoom Web App",
      modalBody:
        "MeetCaptioner can start once Zoom Web App captions or live transcription are enabled in this browser meeting.",
      steps: [
        {
          title: "Open meeting controls",
          detail: "Use the in-meeting toolbar at the bottom of the Zoom Web App window.",
        },
        {
          title: "Open captions controls",
          detail: "Look for captions, transcript, or live transcription controls in the toolbar or more menu.",
        },
        {
          title: "Enable captions",
          detail: "Turn on captions or live transcription so text becomes visible in the browser meeting UI.",
        },
      ],
      troubleshootingHint:
        "Some Zoom meetings may prefer the desktop app or restrict caption controls based on host settings.",
    };
  },

  isCaptioningCurrentlyAvailable() {
    return false;
  },
};

export const zoomWebProviderInternals = {
  extractZoomMeetingId,
  extractZoomMeetingNumber,
  normalizeZoomTitle,
};
