import type {
  TranslateRequest,
  OllamaModel,
  OllamaModelSummary,
} from "../types";
import { buildPrompt } from "../utils";

export async function getOllamaModels(
  baseUrl: string,
  apiKey?: string
): Promise<{
  success: boolean;
  models?: OllamaModel[];
  error?: string;
}> {
  try {
    const url = baseUrl.replace(/\/$/, "");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

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

export async function translateWithOllama(
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
