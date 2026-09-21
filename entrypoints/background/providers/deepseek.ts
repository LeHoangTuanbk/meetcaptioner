import { RateLimitError } from "../errors";
import type { TranslateRequest } from "../types";
import { buildPrompt } from "../utils";

export const translateWithDeepSeek = async (
  request: TranslateRequest,
  apiKey: string,
  model: string,
): Promise<string> => {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildPrompt(request) }],
      thinking: { type: "enabled" },
      reasoning_effort: "low",
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 429) {
      throw new RateLimitError(`DeepSeek rate limit: ${error}`);
    }
    throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
  }

  const data: {
    choices?: Array<{ message?: { content?: unknown } }>;
  } = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("DeepSeek API returned an empty translation");
  }
  return content.trim();
};
