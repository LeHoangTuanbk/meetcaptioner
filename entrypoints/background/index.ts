type Provider = "anthropic" | "openai" | "ollama";
type Settings = {
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

const MODELS: Record<string, string[]> = {
  anthropic: [
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-5-20250929",
    "claude-opus-4-5-20251101",
  ],
  openai: ["gpt-4.1-nano", "gpt-4.1-mini", "gpt-5-nano"],
  ollama: [],
};

class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

// Default custom prompt for new users
const DEFAULT_CUSTOM_PROMPT =
  "Translate naturally and smoothly. Keep technical terms and abbreviations as-is (API, ML, etc). Use appropriate formality for business context.";

// Default settings
const DEFAULT_SETTINGS: Settings = {
  provider: "openai",
  anthropicApiKey: "",
  openaiApiKey: "",
  ollamaBaseUrl: "http://localhost:11434",
  ollamaApiKey: "",
  model: "gpt-4.1-nano",
  targetLanguage: "en",
  translationEnabled: false,
  customPrompt: DEFAULT_CUSTOM_PROMPT,
};

export default defineBackground(() => {
  // Handle messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: String(error) });
      });

    return true; // Async response
  });
});

async function handleMessage(message: any): Promise<any> {
  switch (message.action) {
    case "getSettings":
      return getSettings();

    case "saveSettings":
      return saveSettings(message.settings);

    case "translate":
      return translate(message);

    case "openOptions":
      chrome.runtime.openOptionsPage();
      return { success: true };

    case "getOllamaModels":
      return getOllamaModels(message.baseUrl, message.apiKey);

    // Meeting History Actions
    case "getMeetingHistory":
      return getMeetingHistory();

    case "saveMeetingSession":
      return saveMeetingSession(message.session);

    case "deleteMeetingSession":
      return deleteMeetingSession(message.sessionId);

    case "updateMeetingSession":
      return updateMeetingSession(message.sessionId, message.updates);

    case "clearMeetingHistory":
      return clearMeetingHistory();

    case "getStorageUsage":
      return getStorageUsage();

    default:
      return { success: false, error: "Unknown action" };
  }
}

// ============ Settings ============

async function getSettings(): Promise<{
  success: boolean;
  settings: Settings;
}> {
  const result = await chrome.storage.local.get("settings");
  const stored = result.settings as Partial<Settings> | undefined;
  const settings = { ...DEFAULT_SETTINGS, ...stored };
  return { success: true, settings };
}

async function saveSettings(
  settings: Partial<Settings>
): Promise<{ success: boolean }> {
  const current = await getSettings();
  const updated = { ...current.settings, ...settings };
  await chrome.storage.local.set({ settings: updated });
  return { success: true };
}

// ============ Translation ============

interface TranslateRequest {
  id: string;
  text: string;
  targetLang: string;
  mode: "optimistic" | "semantic";
  context?: string;
  speaker?: string;
  customPrompt?: string;
}

async function translate(request: TranslateRequest): Promise<{
  success: boolean;
  id?: string;
  translation?: string;
  mode?: string;
  error?: string;
}> {
  const { settings } = await getSettings();

  // Ollama validation: requires base URL, and API key for cloud
  if (settings.provider === "ollama") {
    if (!settings.ollamaBaseUrl) {
      return {
        success: false,
        error: "Ollama base URL not configured",
      };
    }
    // Ollama Cloud requires API key
    const isCloudUrl = settings.ollamaBaseUrl.includes("ollama.com");
    if (isCloudUrl && !settings.ollamaApiKey) {
      return {
        success: false,
        error: "API key required for Ollama Cloud",
      };
    }
  } else {
    // Get the correct API key for the selected provider
    const apiKey =
      settings.provider === "anthropic"
        ? settings.anthropicApiKey
        : settings.openaiApiKey;

    if (!apiKey) {
      return {
        success: false,
        error: `API key not configured for ${settings.provider}`,
      };
    }
  }

  if (!settings.translationEnabled) {
    return { success: false, error: "Translation disabled" };
  }

  // For Ollama, we use the selected model directly (no fallback)
  if (settings.provider === "ollama") {
    try {
      const translation = await translateWithOllama(
        request,
        settings.ollamaBaseUrl,
        settings.model,
        settings.ollamaApiKey || undefined
      );
      return {
        success: true,
        id: request.id,
        translation,
        mode: request.mode,
      };
    } catch (error) {
      return {
        success: false,
        id: request.id,
        error: sanitizeError(error),
      };
    }
  }

  // Get the correct API key for the selected provider
  const apiKey =
    settings.provider === "anthropic"
      ? settings.anthropicApiKey
      : settings.openaiApiKey;

  // Get model list for fallback
  const modelList = MODELS[settings.provider];
  const startIndex = modelList.indexOf(settings.model);
  const modelsToTry =
    startIndex >= 0
      ? [...modelList.slice(startIndex), ...modelList.slice(0, startIndex)]
      : modelList;

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const translation =
        settings.provider === "anthropic"
          ? await translateWithAnthropic(request, apiKey, model)
          : await translateWithOpenAI(request, apiKey, model);

      return {
        success: true,
        id: request.id,
        translation,
        mode: request.mode,
      };
    } catch (error) {
      lastError = error as Error;
      if (error instanceof RateLimitError) {
        continue;
      }
      // For non-rate-limit errors, don't retry with other models
      break;
    }
  }

  return {
    success: false,
    id: request.id,
    error: sanitizeError(lastError),
  };
}

// ============ Anthropic API ============

async function translateWithAnthropic(
  request: TranslateRequest,
  apiKey: string,
  model: string
): Promise<string> {
  const prompt = buildPrompt(request);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 429) {
      throw new RateLimitError(`Anthropic rate limit: ${error}`);
    }
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

// ============ OpenAI API ============

async function translateWithOpenAI(
  request: TranslateRequest,
  apiKey: string,
  model: string
): Promise<string> {
  const prompt = buildPrompt(request);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_completion_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 429) {
      throw new RateLimitError(`OpenAI rate limit: ${error}`);
    }
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// ============ Ollama API ============

/** Ollama model summary from /api/tags response */
interface OllamaModelSummary {
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
}

/** Fetch available models from Ollama instance */
async function getOllamaModels(
  baseUrl: string,
  apiKey?: string
): Promise<{
  success: boolean;
  models?: Array<{ id: string; name: string }>;
  error?: string;
}> {
  try {
    const url = baseUrl.replace(/\/$/, "");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authorization header for Ollama Cloud API
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${url}/api/tags`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to connect to Ollama: ${response.status}`,
      };
    }

    const data = await response.json();
    const models = ((data.models as OllamaModelSummary[]) || []).map((m) => ({
      id: m.name,
      name: `${m.name} (${m.details.parameter_size})`,
    }));

    return { success: true, models };
  } catch {
    return {
      success: false,
      error: "Failed to connect to Ollama. Is the server running?",
    };
  }
}

/** Translate using Ollama /api/generate endpoint */
async function translateWithOllama(
  request: TranslateRequest,
  baseUrl: string,
  model: string,
  apiKey?: string
): Promise<string> {
  const prompt = buildPrompt(request);
  const url = baseUrl.replace(/\/$/, "");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add authorization header for Ollama Cloud API
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${url}/api/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.response.trim();
}

// ============ Helpers ============

function buildPrompt(request: TranslateRequest): string {
  const langName = getLanguageName(request.targetLang);

  let prompt = `You are translating live meeting captions from speech recognition.

CRITICAL RULES:
1. Translate the COMPLETE text accurately - DO NOT skip any words
2. KEEP THE SPEAKER'S PERSPECTIVE: The text is spoken BY the speaker. When they refer to themselves, use "I/me". When they refer to the listener, use "you".
3. DO NOT flip or swap pronouns. If the speaker says something equivalent to "Do you love me?", translate it as "Do you love me?" - NOT "Do I love you?"
4. Fix obvious speech recognition errors based on context
5. Output ONLY the translation, nothing else

Target language: ${langName}`;

  if (request.context) {
    prompt += `\n\nRecent conversation (format: [Speaker]: text):\n${request.context}\n\nUse this context to understand who is speaking to whom and maintain correct pronoun references.`;
  }

  if (request.customPrompt) {
    prompt += `\n\nAdditional instructions: ${request.customPrompt}`;
  }

  prompt += `\n\nCurrent speaker: ${
    request.speaker || "Unknown"
  }\nText to translate:\n${request.text}`;

  return prompt;
}

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    vi: "Vietnamese",
    en: "English",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    es: "Spanish",
    fr: "French",
    de: "German",
    pt: "Portuguese",
    ru: "Russian",
    ar: "Arabic",
    hi: "Hindi",
    it: "Italian",
    th: "Thai",
    id: "Indonesian",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
  };
  return languages[code] || code;
}

function sanitizeError(error: any): string {
  const msg = String(error);

  if (
    msg.includes("401") ||
    msg.includes("api-key") ||
    msg.includes("API key")
  ) {
    return "Invalid API key";
  }
  if (msg.includes("429")) {
    return "Rate limit exceeded, please try again later";
  }
  if (msg.includes("500") || msg.includes("503")) {
    return "Service temporarily unavailable";
  }

  return "Translation failed";
}

// ============ Meeting History ============

interface MeetingSession {
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
}

async function getMeetingHistory(): Promise<{
  success: boolean;
  sessions: MeetingSession[];
}> {
  const result = await chrome.storage.local.get("meetingHistory");
  const sessions = (result.meetingHistory as MeetingSession[]) || [];
  return { success: true, sessions };
}

async function saveMeetingSession(
  session: MeetingSession
): Promise<{ success: boolean }> {
  const { sessions } = await getMeetingHistory();

  // Find existing session by ID and update, or add new
  const existingIndex = sessions.findIndex((s) => s.id === session.id);
  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.push(session);
  }

  // Sort by startTime descending (newest first)
  sessions.sort((a, b) => b.startTime - a.startTime);

  await chrome.storage.local.set({ meetingHistory: sessions });
  return { success: true };
}

async function deleteMeetingSession(
  sessionId: string
): Promise<{ success: boolean }> {
  const { sessions } = await getMeetingHistory();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  await chrome.storage.local.set({ meetingHistory: filtered });
  return { success: true };
}

async function updateMeetingSession(
  sessionId: string,
  updates: Partial<MeetingSession>
): Promise<{ success: boolean }> {
  const { sessions } = await getMeetingHistory();
  const index = sessions.findIndex((s) => s.id === sessionId);
  if (index >= 0) {
    sessions[index] = { ...sessions[index], ...updates };
    await chrome.storage.local.set({ meetingHistory: sessions });
  }
  return { success: true };
}

async function clearMeetingHistory(): Promise<{ success: boolean }> {
  await chrome.storage.local.set({ meetingHistory: [] });
  return { success: true };
}

async function getStorageUsage(): Promise<{
  success: boolean;
  bytesUsed: number;
  quota: number;
}> {
  const bytesUsed = await chrome.storage.local.getBytesInUse(null);
  // chrome.storage.local quota is typically 5MB (5242880 bytes)
  const quota = 5242880;
  return { success: true, bytesUsed, quota };
}
