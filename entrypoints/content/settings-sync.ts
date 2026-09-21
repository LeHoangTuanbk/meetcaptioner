import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { DEFAULT_CUSTOM_PROMPT } from "@content/constants";
import { updateSettings } from "@content/state";

/** Loads the latest persisted settings into the content-script store. */
export const loadSettings = async (): Promise<void> => {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "getSettings",
    });

    if (!response?.success || !response.settings) return;

    updateSettings({
      ...response.settings,
      customPrompt: response.settings.customPrompt ?? DEFAULT_CUSTOM_PROMPT,
    });
  } catch {
    // Keep the current in-memory settings when storage is unavailable.
  }
};

/** Keeps the overlay synchronized with settings saved from the options page. */
export const startSettingsSync = (ctx: ContentScriptContext): void => {
  const handleStorageChange = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ) => {
    if (areaName !== "local" || !changes.settings) return;
    void loadSettings();
  };

  chrome.storage.onChanged.addListener(handleStorageChange);
  ctx.onInvalidated(() => {
    chrome.storage.onChanged.removeListener(handleStorageChange);
  });
};
