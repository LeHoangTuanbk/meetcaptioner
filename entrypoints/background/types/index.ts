export const PROVIDERS = {
  anthropic: "anthropic",
  openai: "openai",
  ollama: "ollama",
} as const;

export type Provider = (typeof PROVIDERS)[keyof typeof PROVIDERS];

export type Settings = {
  provider: Provider;
  anthropicApiKey: string;
  openaiApiKey: string;
  ollamaBaseUrl: string;
  ollamaApiKey: string;
  model: string;
  targetLanguage: string;
  translationEnabled: boolean;
  customPrompt: string;
};

export type TranslateRequest = {
  id: string;
  text: string;
  targetLang: string;
  mode: "optimistic" | "semantic";
  context?: string;
  speaker?: string;
  customPrompt?: string;
};

export type TranslateResponse = {
  success: boolean;
  id?: string;
  translation?: string;
  mode?: string;
  error?: string;
};

export type OllamaModel = {
  id: string;
  name: string;
};

export type OllamaModelSummary = {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families?: string[];
    parameter_size: string;
    quantization_level: string;
  };
};

export type MeetingSession = {
  id: string;
  meetingUrl: string;
  meetingCode: string;
  startTime: number;
  endTime?: number;
  captions: Array<{
    speaker: string;
    text: string;
    translation?: string;
    time: string;
    timestamp: number;
  }>;
};
