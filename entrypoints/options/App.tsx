import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import {
  ApiKeyInput,
  OllamaSettings,
  Select,
  TextArea,
  MODELS,
  DEFAULT_SETTINGS,
  type Settings,
} from "./components";

const PROVIDERS = [
  { id: "openai", name: "OpenAI (GPT)" },
  { id: "anthropic", name: "Anthropic (Claude)" },
  { id: "ollama", name: "Ollama (Local/Cloud)" },
];

export default function App() {
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
        // Track original API key for the current provider
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

  const validateApiKey = async (
    provider: "anthropic" | "openai" | "ollama",
    apiKey: string
  ): Promise<{ valid: boolean; error?: string }> => {
    // Ollama doesn't require API key validation (handled by connection test)
    if (provider === "ollama") return { valid: true };
    if (!apiKey) return { valid: true }; // Empty key is ok (user might not want to use this provider)

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
    } catch (e) {
      return { valid: false, error: "Failed to validate API key" };
    }
  };

  const saveSettings = async () => {
    setSaving(true);

    try {
      // Ollama doesn't need API key validation
      if (settings.provider !== "ollama") {
        // Check if API key changed for current provider
        const currentKey =
          settings.provider === "anthropic"
            ? settings.anthropicApiKey
            : settings.openaiApiKey;

        if (currentKey && currentKey !== originalApiKey) {
          // Validate the new API key
          const validation = await validateApiKey(settings.provider, currentKey);
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
        const provider = value as "anthropic" | "openai" | "ollama";
        // For Ollama, clear model - it will be set when models are fetched
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Toaster
        position="top-center"
        theme="dark"
        richColors
        toastOptions={{
          style: {
            background: "#1e293b",
            border: "1px solid #334155",
          },
        }}
      />

      <div className="max-w-2xl mx-auto py-12 px-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">
              MeetCaptioner Settings
            </h1>
            <p className="text-slate-400">
              Configure translation settings for Google Meet captions
            </p>
          </div>
          <button
            onClick={() =>
              chrome.tabs.create({ url: chrome.runtime.getURL("history.html") })
            }
            className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            View Meeting Caption History →
          </button>
        </header>

        <div className="space-y-6">
          <Select
            label="AI Provider"
            value={settings.provider}
            onChange={(v) =>
              updateSetting("provider", v as "anthropic" | "openai" | "ollama")
            }
            options={PROVIDERS}
          />

          {settings.provider === "ollama" ? (
            <OllamaSettings
              baseUrl={settings.ollamaBaseUrl}
              apiKey={settings.ollamaApiKey}
              selectedModel={settings.model}
              onBaseUrlChange={(v) => updateSetting("ollamaBaseUrl", v)}
              onApiKeyChange={(v) => updateSetting("ollamaApiKey", v)}
              onModelChange={(v) => updateSetting("model", v)}
            />
          ) : (
            <>
              <ApiKeyInput
                value={currentApiKey}
                onChange={setCurrentApiKey}
                provider={settings.provider}
              />

              <Select
                label="Model"
                value={settings.model}
                onChange={(v) => updateSetting("model", v)}
                options={MODELS[settings.provider]}
              />
            </>
          )}

          <TextArea
            label="Custom Instructions"
            value={settings.customPrompt}
            onChange={(v) => updateSetting("customPrompt", v)}
            hint="Add context or instructions to improve translation quality"
            optional
          />

          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? "Validating..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
