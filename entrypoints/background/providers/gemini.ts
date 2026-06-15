import type { TranslateRequest } from "../types";
import { RateLimitError } from "../errors";
import { buildPrompt } from "../utils";

export async function translateWithGemini(
  request: TranslateRequest,
  apiKey: string,
  model: string
): Promise<string> {
  const prompt = buildPrompt(request);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 429) {
      throw new RateLimitError(`Gemini rate limit: ${error}`);
    }
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}
