import { settings, updateSettings } from "@content/state";
import { showErrorToast } from "./toast-store";

export async function saveOverlaySettings(
  newSettings: Partial<typeof settings>,
): Promise<boolean> {
  const previousSettings = settings;
  updateSettings(newSettings);

  try {
    const response = await chrome.runtime.sendMessage({
      action: "saveSettings",
      settings,
    });
    if (!response?.success) throw new Error("Settings were not saved");
    return true;
  } catch {
    updateSettings(previousSettings);
    showErrorToast("Couldn't save settings. Please try again.");
    return false;
  }
}
