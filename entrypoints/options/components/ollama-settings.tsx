import { ArrowsClockwiseIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { useOllamaSettings } from "./use-ollama-settings";

type OllamaSettingsProps = {
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
  onBaseUrlChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onModelChange: (value: string) => void;
};

export function OllamaSettings({
  baseUrl,
  apiKey,
  selectedModel,
  onBaseUrlChange,
  onApiKeyChange,
  onModelChange,
}: OllamaSettingsProps) {
  const {
    showApiKey,
    toggleShowApiKey,
    models,
    loading,
    error,
    isCloudUrl,
    fetchModels,
  } = useOllamaSettings({ baseUrl, apiKey, selectedModel, onModelChange });

  return (
    <div className="space-y-4">
      <BaseUrlInput
        baseUrl={baseUrl}
        isCloudUrl={isCloudUrl}
        onChange={onBaseUrlChange}
      />

      {isCloudUrl && (
        <ApiKeyInput
          apiKey={apiKey}
          showApiKey={showApiKey}
          onToggleShow={toggleShowApiKey}
          onChange={onApiKeyChange}
        />
      )}

      <ModelSelector
        selectedModel={selectedModel}
        models={models}
        loading={loading}
        error={error}
        isCloudUrl={isCloudUrl}
        onModelChange={onModelChange}
        onRefresh={fetchModels}
      />
    </div>
  );
}

type BaseUrlInputProps = {
  baseUrl: string;
  isCloudUrl: boolean;
  onChange: (value: string) => void;
};

function BaseUrlInput({ baseUrl, isCloudUrl, onChange }: BaseUrlInputProps) {
  return (
    <div className="rounded-xl border border-(--mc-app-border) bg-(--mc-app-surface) p-6">
      <label className="mb-3 block text-lg leading-5 font-medium text-(--mc-app-text-emphasis)">
        Ollama Server URL <span className="text-red-400">*</span>
      </label>
      <input
        type="url"
        value={baseUrl}
        onChange={(e) => onChange(e.target.value)}
        placeholder="http://localhost:11434"
        className="h-12 w-full rounded-lg border border-(--mc-app-field-border) bg-(--mc-app-canvas) px-4 text-sm text-white placeholder:text-(--mc-app-text-secondary) hover:border-(--mc-app-field-hover) focus:border-blue-400 focus:outline-none"
      />
      <div className="text-xs text-slate-500 mt-2 space-y-1">
        <p>
          Local: <code className="text-slate-400">http://localhost:11434</code>
          <span className="mx-2">|</span>
          Cloud: <code className="text-slate-400">https://ollama.com</code>
        </p>
        {!isCloudUrl && (
          <p>
            Local requires CORS config.{" "}
            <a
              href="https://objectgraph.com/blog/ollama-cors/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline"
            >
              Setup guide
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

type ApiKeyInputProps = {
  apiKey: string;
  showApiKey: boolean;
  onToggleShow: () => void;
  onChange: (value: string) => void;
};

function ApiKeyInput({
  apiKey,
  showApiKey,
  onToggleShow,
  onChange,
}: ApiKeyInputProps) {
  return (
    <div className="rounded-xl border border-(--mc-app-border) bg-(--mc-app-surface) p-6">
      <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400">
        Ollama Cloud is currently in preview
      </div>
      <label className="mb-3 block text-lg leading-5 font-medium text-(--mc-app-text-emphasis)">
        API Key <span className="text-red-400">*</span>
        <span className="text-slate-500 font-normal ml-2">
          (Required for Ollama Cloud)
        </span>
      </label>
      <div className="relative">
        <input
          type={showApiKey ? "text" : "password"}
          value={apiKey}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your Ollama Cloud API key"
          className="h-12 w-full rounded-lg border border-(--mc-app-field-border) bg-(--mc-app-canvas) px-4 pr-12 text-sm text-white placeholder:text-(--mc-app-text-secondary) hover:border-(--mc-app-field-hover) focus:border-blue-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={showApiKey ? "Hide API key" : "Show API key"}
          className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-white hover:bg-white/10"
        >
          {showApiKey ? <EyeSlashIcon className="size-6" /> : <EyeIcon className="size-6" />}
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Get your API key from{" "}
        <a
          href="https://ollama.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 underline"
        >
          ollama.com/settings/keys
        </a>
      </p>
    </div>
  );
}

type OllamaModel = {
  id: string;
  name: string;
};

type ModelSelectorProps = {
  selectedModel: string;
  models: OllamaModel[];
  loading: boolean;
  error: string | null;
  isCloudUrl: boolean;
  onModelChange: (value: string) => void;
  onRefresh: () => void;
};

function ModelSelector({
  selectedModel,
  models,
  loading,
  error,
  isCloudUrl,
  onModelChange,
  onRefresh,
}: ModelSelectorProps) {
  return (
    <div className="rounded-xl border border-(--mc-app-border) bg-(--mc-app-surface) p-6">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-lg leading-5 font-medium text-(--mc-app-text-emphasis)">
          Model <span className="text-red-400">*</span>
        </label>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh Ollama models"
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-(--mc-positive) hover:text-emerald-300 disabled:opacity-50"
        >
          <ArrowsClockwiseIcon className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading..." : "Refresh Models"}
        </button>
      </div>

      {error && <ErrorMessage error={error} isCloudUrl={isCloudUrl} />}

      {models.length > 0 ? (
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="h-12 w-full cursor-pointer rounded-lg border border-(--mc-app-field-border) bg-(--mc-app-canvas) px-4 text-sm text-white hover:border-(--mc-app-field-hover) focus:border-blue-400 focus:outline-none"
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="rounded-lg border border-(--mc-app-border) bg-(--mc-app-canvas) p-3 text-sm text-(--mc-app-text-secondary)">
          {loading
            ? "Fetching available models..."
            : "No models found. Make sure Ollama is running and has models installed."}
        </div>
      )}

      <div className="mt-2 space-y-1 text-xs text-(--mc-app-text-secondary)">
        <p>
          Install models with:{" "}
          <code className="text-(--mc-app-text-emphasis)">ollama pull gemma3</code>
        </p>
        <p>
          Find translation models:{" "}
          <a
            href="https://ollama.com/search?q=translation"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline"
          >
            ollama.com/search
          </a>
        </p>
      </div>
    </div>
  );
}

type ErrorMessageProps = {
  error: string;
  isCloudUrl: boolean;
};

function ErrorMessage({ error, isCloudUrl }: ErrorMessageProps) {
  return (
    <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
      <p>{error}</p>
      {error.includes("connect") && !isCloudUrl && (
        <div className="mt-2 pt-2 border-t border-red-500/20 text-xs space-y-2">
          <p className="font-medium">CORS Configuration Required:</p>
          <div className="text-red-300/80 space-y-1">
            <p>
              <span className="text-slate-400">CLI:</span>{" "}
              <code className="bg-red-500/20 px-1 rounded">
                OLLAMA_ORIGINS="*" ollama serve
              </code>
            </p>
            <p>
              <span className="text-slate-400">App:</span>{" "}
              <code className="bg-red-500/20 px-1 rounded">
                launchctl setenv OLLAMA_ORIGINS "*"
              </code>
              <span className="text-slate-500 ml-1">(then restart app)</span>
            </p>
          </div>
          <a
            href="https://objectgraph.com/blog/ollama-cors/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline inline-block"
          >
            View full CORS setup guide
          </a>
        </div>
      )}
    </div>
  );
}
