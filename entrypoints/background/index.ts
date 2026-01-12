import { getSettings, saveSettings } from "./settings";
import { translate } from "./translation";
import { getOllamaModels } from "./providers/ollama";
import {
  getMeetingHistory,
  saveMeetingSession,
  deleteMeetingSession,
  updateMeetingSession,
  clearMeetingHistory,
  getStorageUsage,
} from "./history";

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: String(error) });
      });

    return true;
  });
});

async function handleMessage(message: Record<string, unknown>): Promise<unknown> {
  switch (message.action) {
    case "getSettings":
      return getSettings();

    case "saveSettings":
      return saveSettings(message.settings as Parameters<typeof saveSettings>[0]);

    case "translate":
      return translate(message as Parameters<typeof translate>[0]);

    case "openOptions":
      chrome.runtime.openOptionsPage();
      return { success: true };

    case "getOllamaModels":
      return getOllamaModels(
        message.baseUrl as string,
        message.apiKey as string | undefined
      );

    case "getMeetingHistory":
      return getMeetingHistory();

    case "saveMeetingSession":
      return saveMeetingSession(message.session as Parameters<typeof saveMeetingSession>[0]);

    case "deleteMeetingSession":
      return deleteMeetingSession(message.sessionId as string);

    case "updateMeetingSession":
      return updateMeetingSession(
        message.sessionId as string,
        message.updates as Parameters<typeof updateMeetingSession>[1]
      );

    case "clearMeetingHistory":
      return clearMeetingHistory();

    case "getStorageUsage":
      return getStorageUsage();

    default:
      return { success: false, error: "Unknown action" };
  }
}
