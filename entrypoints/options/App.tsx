import { useState, useEffect } from "react";
import {
  ApiKeyInput,
  Select,
  TextArea,
  MODELS,
  DEFAULT_SETTINGS,
  type Settings,
} from "./components";

const PROVIDERS = [
  { id: "anthropic", name: "Anthropic (Claude)" },
  { id: "openai", name: "OpenAI (GPT)" },
];

export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getSettings",
      });
      if (response?.success && response.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...response.settings });
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await chrome.runtime.sendMessage({ action: "saveSettings", settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save settings:", e);
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
        const provider = value as "anthropic" | "openai";
        next.model = MODELS[provider][0].id;
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
      <div className="max-w-2xl mx-auto py-12 px-6">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">
            MeetCaptioner Settings
          </h1>
          <p className="text-slate-400">
            Configure translation settings for Google Meet captions
          </p>
        </header>

        <div className="space-y-6">
          <Select
            label="AI Provider"
            value={settings.provider}
            onChange={(v) =>
              updateSetting("provider", v as "anthropic" | "openai")
            }
            options={PROVIDERS}
          />

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

          <TextArea
            label="Custom Instructions"
            value={settings.customPrompt}
            onChange={(v) => updateSetting("customPrompt", v)}
            placeholder="E.g., 'This is a tech meeting about AI. Use casual tone. Keep acronyms like API, ML.'"
            hint="Add context or instructions to improve translation quality"
            optional
          />

          <div className="flex items-center gap-4">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            {saved && (
              <span className="text-emerald-400 text-sm">Settings saved!</span>
            )}
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t border-slate-700/50 text-center text-sm text-slate-500">
          MeetCaptioner v1.0.0
        </footer>
      </div>
    </div>
  );
}
