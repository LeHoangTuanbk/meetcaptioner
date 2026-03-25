import { getProviderLabel } from "../../shared/meeting-session";
import type { MeetingProvider } from "./types";

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
      title: document.title || undefined,
      sourceUrl: window.location.href,
      identifiers: {},
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
