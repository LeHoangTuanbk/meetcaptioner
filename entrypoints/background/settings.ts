import type { Settings } from "./types";
import { DEFAULT_SETTINGS } from "./constants";

export async function getSettings(): Promise<{
  success: boolean;
  settings: Settings;
}> {
  const result = await chrome.storage.local.get("settings");
  const stored = result.settings as Partial<Settings> | undefined;
  const settings = { ...DEFAULT_SETTINGS, ...stored };
  return { success: true, settings };
}

export async function saveSettings(
  settings: Partial<Settings>
): Promise<{ success: boolean }> {
  const current = await getSettings();
  const updated = { ...current.settings, ...settings };
  await chrome.storage.local.set({ settings: updated });
  return { success: true };
}
