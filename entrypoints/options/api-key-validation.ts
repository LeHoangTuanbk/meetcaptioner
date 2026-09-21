import type { Provider } from "./components/types";

type ValidationResult = {
  valid: boolean;
  error?: string;
};

const PROVIDER_NAMES: Record<Provider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  gemini: "Gemini",
  deepseek: "DeepSeek",
  ollama: "Ollama",
};

const requestValidation = (
  provider: Provider,
  apiKey: string
): Promise<Response> => {
  if (provider === "gemini") {
    return fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] }),
      }
    );
  }

  if (provider === "anthropic") {
    return fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "Hi" }],
      }),
    });
  }

  if (provider === "deepseek") {
    return fetch("https://api.deepseek.com/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  }

  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-nano",
      max_completion_tokens: 1,
      messages: [{ role: "user", content: "Hi" }],
    }),
  });
};

export const validateApiKey = async (
  provider: Provider,
  apiKey: string
): Promise<ValidationResult> => {
  if (provider === "ollama" || !apiKey) return { valid: true };

  try {
    const response = await requestValidation(provider, apiKey);
    if (response.ok) return { valid: true };

    const data = await response.json().catch(() => ({}));
    if ([400, 401, 403].includes(response.status)) {
      return {
        valid: false,
        error: `Invalid ${PROVIDER_NAMES[provider]} API key`,
      };
    }
    return {
      valid: false,
      error: data.error?.message || `API error: ${response.status}`,
    };
  } catch {
    return { valid: false, error: "Failed to validate API key" };
  }
};
