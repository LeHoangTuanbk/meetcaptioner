export interface Settings {
  provider: 'anthropic' | 'openai';
  anthropicApiKey: string;
  openaiApiKey: string;
  model: string;
  targetLanguage: string;
  translationEnabled: boolean;
  customPrompt: string;
}

export const DEFAULT_SETTINGS: Settings = {
  provider: 'anthropic',
  anthropicApiKey: '',
  openaiApiKey: '',
  model: 'claude-haiku-4-5-20251001',
  targetLanguage: 'vi',
  translationEnabled: false,
  customPrompt: '',
};
