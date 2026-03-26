import type { MeetingProvider } from "./types";
import { googleMeetProvider } from "./google-meet";
import { microsoftTeamsProvider } from "./microsoft-teams";
import { zoomWebProvider } from "./zoom-web";

// Only providers with live capture implementations should be activated here.
const PROVIDERS: MeetingProvider[] = [
  googleMeetProvider,
  microsoftTeamsProvider,
  zoomWebProvider,
];

export const PLANNED_PROVIDERS: MeetingProvider[] = [];

export function getProviderForUrl(url: URL): MeetingProvider | null {
  return PROVIDERS.find((provider) => provider.matchesUrl(url)) || null;
}

export function getProviderByPlatform(
  platform: MeetingProvider["platform"]
): MeetingProvider | null {
  return PROVIDERS.find((provider) => provider.platform === platform) || null;
}

export function getProviderForPageContext(url: URL): MeetingProvider | null {
  return (
    PROVIDERS.find((provider) => provider.matchesPageContext?.(url) ?? false) ||
    null
  );
}
