import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MODELS, DEFAULT_SETTINGS, type Settings } from "./components";
import { validateApiKey } from "./api-key-validation";
import type { Provider } from "./components/types";

type ApiKeyField =
  | "anthropicApiKey"
  | "openaiApiKey"
  | "geminiApiKey"
  | "deepseekApiKey"
  | "ollamaApiKey";

const API_KEY_FIELD: Record<Provider, ApiKeyField> = {
  anthropic: "anthropicApiKey",
  openai: "openaiApiKey",
  gemini: "geminiApiKey",
  deepseek: "deepseekApiKey",
  ollama: "ollamaApiKey",
} as const;

const getApiKeyField = (provider: Provider): ApiKeyField =>
  API_KEY_FIELD[provider];

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalApiKey, setOriginalApiKey] = useState<string>("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getSettings",
      });
      if (response?.success && response.settings) {
        const saved = response.settings;
        const merged = { ...DEFAULT_SETTINGS, ...saved };
        if (saved.customPrompt !== undefined) {
          merged.customPrompt = saved.customPrompt;
        }
        setSettings(merged);
        const key = merged[getApiKeyField(merged.provider)];
        setOriginalApiKey(key);
      }
    } catch {
      // Settings load failed silently
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);

    try {
      if (settings.provider !== "ollama") {
        const currentKey = settings[getApiKeyField(settings.provider)];

        if (currentKey && currentKey !== originalApiKey) {
          const validation = await validateApiKey(
            settings.provider,
            currentKey
          );
          if (!validation.valid) {
            toast.error(validation.error || "Invalid API key");
            setSaving(false);
            return;
          }
        }
        setOriginalApiKey(currentKey);
      }

      await chrome.runtime.sendMessage({ action: "saveSettings", settings });
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "provider") {
        const provider = value as Provider;
        if (provider === "ollama") {
          next.model = "";
        } else {
          const models = MODELS[provider];
          next.model = models.length > 0 ? models[0].id : "";
        }
      }
      return next;
    });
  };

  const currentApiKey = settings[getApiKeyField(settings.provider)];

  const setCurrentApiKey = (value: string) => {
    updateSetting(getApiKeyField(settings.provider), value);
  };

  const openHistory = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("meeting-history.html") });
  };

  return {
    settings,
    loading,
    saving,
    currentApiKey,
    setCurrentApiKey,
    updateSetting,
    saveSettings,
    openHistory,
  };
}
