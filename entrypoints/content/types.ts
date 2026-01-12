export type Caption = {
  id: number;
  speaker: string;
  text: string;
  time: string;
  translation: string;
  translationStatus:
    | "pending"
    | "translating"
    | "refining"
    | "optimistic"
    | "semantic"
    | "error";
  translationError?: string;
  lastTranslatedLength: number;
  userEdited?: boolean;
  isFinalized?: boolean;
};

export type Settings = {
  provider: "anthropic" | "openai" | "ollama";
  anthropicApiKey: string;
  openaiApiKey: string;
  model: string;
  targetLanguage: string;
  translationEnabled: boolean;
  customPrompt: string;
};

export type TranslateResponse = {
  success: boolean;
  translation?: string;
  error?: string;
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
  meetingUrl: string;
  meetingCode: string;
  title?: string;
  startTime: number;
  endTime?: number;
  captions: SavedCaption[];
};
