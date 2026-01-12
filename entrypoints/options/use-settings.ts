import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MODELS, DEFAULT_SETTINGS, type Settings } from "./components";

type Provider = "anthropic" | "openai" | "ollama";

const validateApiKey = async (
  provider: Provider,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> => {
  if (provider === "ollama") return { valid: true };
  if (!apiKey) return { valid: true };

  try {
    if (provider === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1,
          messages: [{ role: "user", content: "Hi" }],
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          return { valid: false, error: "Invalid Anthropic API key" };
        }
        return {
          valid: false,
          error: data.error?.message || `API error: ${response.status}`,
        };
      }
      return { valid: true };
    } else {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4.1-nano",
            max_completion_tokens: 1,
            messages: [{ role: "user", content: "Hi" }],
          }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          return { valid: false, error: "Invalid OpenAI API key" };
        }
        return {
          valid: false,
          error: data.error?.message || `API error: ${response.status}`,
        };
      }
      return { valid: true };
    }
  } catch {
    return { valid: false, error: "Failed to validate API key" };
  }
};

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
        const key =
          merged.provider === "anthropic"
            ? merged.anthropicApiKey
            : merged.openaiApiKey;
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
        const currentKey =
          settings.provider === "anthropic"
            ? settings.anthropicApiKey
            : settings.openaiApiKey;

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

  const currentApiKey =
    settings.provider === "anthropic"
      ? settings.anthropicApiKey
      : settings.openaiApiKey;

  const setCurrentApiKey = (value: string) => {
    const key =
      settings.provider === "anthropic" ? "anthropicApiKey" : "openaiApiKey";
    updateSetting(key, value);
  };

  const openHistory = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("history.html") });
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
