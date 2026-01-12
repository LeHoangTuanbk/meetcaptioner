import { Toaster } from "sonner";
import {
  ApiKeyInput,
  OllamaSettings,
  Select,
  TextArea,
  MODELS,
} from "./components";
import { useSettings } from "./use-settings";

const PROVIDERS = [
  { id: "openai", name: "OpenAI (GPT)" },
  { id: "anthropic", name: "Anthropic (Claude)" },
  { id: "ollama", name: "Ollama (Local/Cloud)" },
];

export default function App() {
  const {
    settings,
    loading,
    saving,
    currentApiKey,
    setCurrentApiKey,
    updateSetting,
    saveSettings,
    openHistory,
  } = useSettings();

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
            onClick={openHistory}
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
