export interface Caption {
  id: number;
  speaker: string;
  text: string;
  time: string;
  translation: string;
  translationStatus: "pending" | "translating" | "refining" | "optimistic" | "semantic" | "error";
  translationError?: string;
  lastTranslatedLength: number;
  userEdited?: boolean;
}

export interface Settings {
  provider: "anthropic" | "openai";
  anthropicApiKey: string;
  openaiApiKey: string;
  model: string;
  targetLanguage: string;
  translationEnabled: boolean;
  customPrompt: string;
}

export interface TranslateResponse {
  success: boolean;
  translation?: string;
  error?: string;
}

// Meeting History Types
export interface SavedCaption {
  speaker: string;
  text: string;
  translation?: string;
  time: string;
  timestamp: number;
}

export interface MeetingSession {
  id: string;
  meetingUrl: string;
  meetingCode: string;
  title?: string;
  startTime: number;
  endTime?: number;
  captions: SavedCaption[];
}
