// Transcript message from Google Meet
export interface TranscriptMessage {
  messageId: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
  languageCode?: string;
}

// Message types for communication between content script and side panel
export type MessageType =
  | { type: 'TRANSCRIPT_UPDATE'; payload: TranscriptMessage }
  | { type: 'TRANSCRIPT_BATCH'; payload: TranscriptMessage[] }
  | { type: 'MEETING_STARTED'; payload: { meetingId: string } }
  | { type: 'MEETING_ENDED' }
  | { type: 'LANGUAGE_CHANGED'; payload: { transcriptLang: string; translationLang: string } }
  | { type: 'CONNECTION_STATUS'; payload: { connected: boolean } };

// Storage types
export interface StorageData {
  transcripts: TranscriptMessage[];
  settings: Settings;
}

export interface Settings {
  targetLanguage: string;
  autoTranslate: boolean;
  showOriginal: boolean;
}

// Device info from Google Meet
export interface DeviceInfo {
  deviceId: string;
  displayName: string;
}
