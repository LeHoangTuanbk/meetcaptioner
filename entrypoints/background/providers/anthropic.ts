import type { TranslateRequest } from "../types";
import { RateLimitError } from "../errors";
import { buildPrompt } from "../utils";

export async function translateWithAnthropic(
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
