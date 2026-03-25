import type {
  MeetingPlatform,
  MeetingSessionIdentifiers,
} from "../../shared/meeting-session";

export type PlatformEmptyState = {
  waitingTitle: string;
  waitingBody: string;
};

export type CaptureGuideStep = {
  title: string;
  detail: string;
};

export type ProviderCaptureGuide = {
  modalTitle: string;
  modalBody: string;
  steps: CaptureGuideStep[];
  troubleshootingHint?: string;
};

export type MeetingSessionMetadata = {
  platform: MeetingPlatform;
  providerLabel: string;
  title?: string;
  sourceUrl: string;
  identifiers: MeetingSessionIdentifiers;
};

export type MeetingProvider = {
  platform: MeetingPlatform;
  matchesUrl(url: URL): boolean;
  bootstrap(): Promise<void> | void;
  startCaptionObserver(): () => void;
  getSessionMetadata(): MeetingSessionMetadata;
  getEmptyState(): PlatformEmptyState;
  getCaptureGuide(): ProviderCaptureGuide;
  isCaptioningCurrentlyAvailable(): boolean;
};
