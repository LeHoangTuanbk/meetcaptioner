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

// Default settings
const DEFAULT_SETTINGS: Settings = {
  provider: "anthropic",
  anthropicApiKey: "",
  openaiApiKey: "",
  model: "claude-haiku-4-5-20251001",
  targetLanguage: "vi",
  translationEnabled: false,
  customPrompt: "",
};

// Rate limiting
const rateLimiter = new Map<string, number[]>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

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
  const apiKey = settings.provider === "anthropic"
    ? settings.anthropicApiKey
    : settings.openaiApiKey;

  console.log("[MeetCaptioner] Settings:", {
    provider: settings.provider,
    hasApiKey: apiKey ? "***" : "(empty)",
  });

  if (!apiKey) {
    console.log("[MeetCaptioner] No API key configured for", settings.provider);
    return { success: false, error: `API key not configured for ${settings.provider}` };
  }

  if (!settings.translationEnabled) {
    console.log("[MeetCaptioner] Translation disabled");
    return { success: false, error: "Translation disabled" };
  }

  // Rate limiting
  if (isRateLimited("translate")) {
    console.log("[MeetCaptioner] Rate limited");
    return { success: false, error: "Rate limit exceeded" };
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
Context: This is from a live meeting conversation.`;

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
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    es: "Spanish",
    fr: "French",
    de: "German",
    th: "Thai",
    id: "Indonesian",
  };
  return languages[code] || code;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimiter.get(key) || [];

  const recent = timestamps.filter((t) => now - t < RATE_WINDOW);

  if (recent.length >= RATE_LIMIT) {
    return true;
  }

  recent.push(now);
  rateLimiter.set(key, recent);
  return false;
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
