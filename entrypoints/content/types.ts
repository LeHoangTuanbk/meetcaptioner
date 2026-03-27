import type { TranslationStatus } from "./constants";
export type {
  MeetingPlatform,
  MeetingSession,
  MeetingSessionIdentifiers,
  SavedCaption,
} from "../shared/meeting-session";

export type Caption = {
  id: number;
  speaker: string;
  text: string;
  time: string;
  translation: string;
  translationStatus: TranslationStatus;
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
