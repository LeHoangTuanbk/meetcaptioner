import type { Settings } from "./types";
import { DEFAULT_SETTINGS, MODELS } from "./constants";

export async function getSettings(): Promise<{
  success: boolean;
  settings: Settings;
}> {
  const result = await chrome.storage.local.get("settings");
  const stored = result.settings as Partial<Settings> | undefined;
  const settings = { ...DEFAULT_SETTINGS, ...stored };
  return { success: true, settings: withSupportedModel(settings) };
}

/**
 * Replaces a stored model that is no longer offered (e.g. deprecated by the
 * provider) with the provider's first supported model. Ollama models are
 * free-form, so they are left untouched.
 */
function withSupportedModel(settings: Settings): Settings {
  const models = MODELS[settings.provider];
  if (!models.length || models.includes(settings.model)) return settings;
  return { ...settings, model: models[0] };
}

export async function saveSettings(
  settings: Partial<Settings>
): Promise<{ success: boolean }> {
  const current = await getSettings();
  const updated = { ...current.settings, ...settings };
  await chrome.storage.local.set({ settings: updated });
  return { success: true };
}
