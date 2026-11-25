import type { TranslateRequest } from "../types";
import { RateLimitError } from "../errors";
import { buildPrompt } from "../utils";

/**
 * GPT-5 models are reasoning models: reasoning tokens count against
 * max_completion_tokens and can exhaust it, returning empty content.
 * Translation needs no reasoning, so keep it minimal (also lowers latency).
 */
const isReasoningModel = (model: string): boolean => model.startsWith("gpt-5");

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
      ...(isReasoningModel(model) && { reasoning_effort: "minimal" }),
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
  const content: string = data.choices?.[0]?.message?.content?.trim() ?? "";
  // An empty reply (e.g. token budget exhausted) must not count as success.
  if (!content) {
    throw new Error("OpenAI returned an empty translation");
  }
  return content;
}
