import { settings, updateSettings, overlay } from "../state";

export async function saveOverlaySettings(
  newSettings: Partial<typeof settings>
): Promise<void> {
  updateSettings(newSettings);
  try {
    await chrome.runtime.sendMessage({ action: "saveSettings", settings });
  } catch {
    // Settings save failed silently
  }
  updateUIFromSettings();
}

export function updateUIFromSettings(): void {
  const langSelect = document.getElementById(
    "mc-lang-select"
  ) as HTMLSelectElement | null;
  if (langSelect) langSelect.value = settings.targetLanguage;

  const translateToggle = document.getElementById("mc-translate-toggle");
  if (translateToggle) {
    translateToggle.classList.toggle("mc-active", settings.translationEnabled);
    translateToggle.setAttribute(
      "data-tooltip",
      settings.translationEnabled ? "Translation ON" : "Translation OFF"
    );
  }

  if (overlay) {
    overlay.classList.toggle("translation-off", !settings.translationEnabled);
  }
}
