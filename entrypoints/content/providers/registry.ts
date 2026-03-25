import type { MeetingProvider } from "./types";
import { googleMeetProvider } from "./google-meet";
import { microsoftTeamsProvider } from "./microsoft-teams";
import { zoomWebProvider } from "./zoom-web";

// Only providers with live capture implementations should be activated here.
const PROVIDERS: MeetingProvider[] = [googleMeetProvider];

export const PLANNED_PROVIDERS: MeetingProvider[] = [
  microsoftTeamsProvider,
  zoomWebProvider,
];

export function getProviderForUrl(url: URL): MeetingProvider | null {
  return PROVIDERS.find((provider) => provider.matchesUrl(url)) || null;
}
