import type { MeetingProvider } from "./types";
import { googleMeetProvider } from "./google-meet";

const PROVIDERS: MeetingProvider[] = [googleMeetProvider];

export function getProviderForUrl(url: URL): MeetingProvider | null {
  return PROVIDERS.find((provider) => provider.matchesUrl(url)) || null;
}
