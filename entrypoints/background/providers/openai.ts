import type { TranslateRequest } from "../types";
import { RateLimitError } from "../errors";
import { buildPrompt } from "../utils";

export async function translateWithOpenAI(
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
