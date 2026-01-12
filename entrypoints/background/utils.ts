import type { TranslateRequest } from "./types";
import { LANGUAGES } from "./constants";

export function getLanguageName(code: string): string {
  return LANGUAGES[code] || code;
}

export function buildPrompt(request: TranslateRequest): string {
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

export function sanitizeError(error: unknown): string {
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
