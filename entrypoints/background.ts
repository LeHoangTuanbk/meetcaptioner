// Settings interface
interface Settings {
  provider: "anthropic" | "openai";
  anthropicApiKey: string;
  openaiApiKey: string;
  model: string;
  targetLanguage: string;
  translationEnabled: boolean;
  customPrompt: string;
}

// Default custom prompt for new users
const DEFAULT_CUSTOM_PROMPT =
  "Translate naturally and smoothly. Keep technical terms and abbreviations as-is (API, ML, etc). Use appropriate formality for business context.";

// Default settings
const DEFAULT_SETTINGS: Settings = {
  provider: "openai",
  anthropicApiKey: "",
  openaiApiKey: "",
  model: "gpt-4.1-nano",
  targetLanguage: "en",
  translationEnabled: false,
  customPrompt: DEFAULT_CUSTOM_PROMPT,
};

export default defineBackground(() => {
  console.debug("[MeetCaptioner] Background started");

  // Handle messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        console.error("[MeetCaptioner] Error:", error);
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
  customPrompt?: string;
}

async function translate(request: TranslateRequest): Promise<any> {
  console.log("[MeetCaptioner] translate() called with:", request);
  const { settings } = await getSettings();

  // Get the correct API key for the selected provider
  const apiKey =
    settings.provider === "anthropic"
      ? settings.anthropicApiKey
      : settings.openaiApiKey;

  console.log("[MeetCaptioner] Settings:", {
    provider: settings.provider,
    hasApiKey: apiKey ? "***" : "(empty)",
  });

  if (!apiKey) {
    console.log("[MeetCaptioner] No API key configured for", settings.provider);
    return {
      success: false,
      error: `API key not configured for ${settings.provider}`,
    };
  }

  if (!settings.translationEnabled) {
    console.log("[MeetCaptioner] Translation disabled");
    return { success: false, error: "Translation disabled" };
  }

  try {
    console.log(
      "[MeetCaptioner] Calling API with provider:",
      settings.provider
    );
    const translation =
      settings.provider === "anthropic"
        ? await translateWithAnthropic(request, settings, apiKey)
        : await translateWithOpenAI(request, settings, apiKey);

    console.log("[MeetCaptioner] Translation success:", translation);
    return {
      success: true,
      id: request.id,
      translation,
      mode: request.mode,
    };
  } catch (error) {
    console.error("[MeetCaptioner] Translation error:", error);
    return {
      success: false,
      id: request.id,
      error: sanitizeError(error),
    };
  }
}

// ============ Anthropic API ============

async function translateWithAnthropic(
  request: TranslateRequest,
  settings: Settings,
  apiKey: string
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
      model: settings.model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(
      "[MeetCaptioner] Anthropic API error:",
      response.status,
      error
    );
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log("[MeetCaptioner] Anthropic response:", data);
  return data.content[0].text.trim();
}

// ============ OpenAI API ============

async function translateWithOpenAI(
  request: TranslateRequest,
  settings: Settings,
  apiKey: string
): Promise<string> {
  const prompt = buildPrompt(request);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      max_completion_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[MeetCaptioner] OpenAI API error:", response.status, error);
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log("[MeetCaptioner] OpenAI response:", data);
  return data.choices[0].message.content.trim();
}

// ============ Helpers ============

function buildPrompt(request: TranslateRequest): string {
  const langName = getLanguageName(request.targetLang);

  if (request.mode === "optimistic") {
    let prompt = `Translate to ${langName}.`;
    if (request.customPrompt) {
      prompt += ` Instructions: ${request.customPrompt}`;
    }
    prompt += ` Output ONLY the translation, no explanations:\n\n${request.text}`;
    return prompt;
  }

  // Semantic mode with context
  let prompt = `You are a professional translator. Translate naturally to ${langName}.
Context: This is from a live meeting conversation.
Notes:
- Because this is using live captions, occasionally some text segments might be misinterpreted or appear strange. You will need to rely on the overall meaning to correct those misidentified text segments. Only then will you translate them into the target language.
`;

  if (request.customPrompt) {
    prompt += `\nUser instructions: ${request.customPrompt}`;
  }

  if (request.context) {
    prompt += `\nPrevious context: ${request.context}`;
  }

  prompt += `\n\nText to translate: ${request.text}\n\nOutput ONLY the translation, no explanations.`;

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
  console.log("[MeetCaptioner] sanitizeError called with:", msg);

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
