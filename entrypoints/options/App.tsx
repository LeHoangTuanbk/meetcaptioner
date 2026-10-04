import { AppToaster } from "../shared/app-toaster";
import {
  ApiKeyInput,
  OllamaSettings,
  Select,
  TextArea,
  MODELS,
  type Provider,
} from "./components";
import { useSettings } from "./use-settings";

const PROVIDERS = [
  { id: "openai", name: "OpenAI (GPT)" },
  { id: "anthropic", name: "Anthropic (Claude)" },
  { id: "gemini", name: "Google (Gemini)" },
  { id: "deepseek", name: "DeepSeek" },
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
      <div className="flex min-h-screen items-center justify-center bg-(--mc-app-canvas)">
        <div className="text-(--mc-app-text-secondary)">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-(--mc-app-canvas) text-(--mc-app-text)">
      <AppToaster />

      <div className="mx-auto max-w-2xl px-6 py-12">
        <header className="mb-8 flex items-center justify-between gap-8">
          <div>
            <h1 className="mb-2 text-[30px] leading-8 font-semibold">
              Meet Captioner Settings
            </h1>
            <p className="text-sm leading-5 text-(--mc-app-text-secondary)">
              Configure translation settings for Google Meet captions
            </p>
          </div>
          <button
            onClick={openHistory}
            className="shrink-0 cursor-pointer text-sm text-white transition-colors hover:text-(--mc-positive)"
          >
            <span className="inline-flex items-center gap-1.5">
              View Meeting Caption History
            </span>
          </button>
        </header>

        <div className="space-y-6">
          <Select
            label="AI Provider"
            value={settings.provider}
            onChange={(v) => updateSetting("provider", v as Provider)}
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
            className="cursor-pointer rounded-lg bg-(--mc-primary) px-4 py-2 text-sm font-medium transition-colors hover:bg-(--mc-primary-hover) disabled:opacity-50"
          >
            {saving ? "Validating..." : "Save Settings"}
          </button>
        </div>
      </div>
    </main>
  );
}
