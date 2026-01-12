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
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <label className="block text-sm font-medium text-slate-300 mb-3">
        Ollama Server URL <span className="text-red-400">*</span>
      </label>
      <input
        type="url"
        value={baseUrl}
        onChange={(e) => onChange(e.target.value)}
        placeholder="http://localhost:11434"
        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
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
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400">
        Ollama Cloud is currently in preview
      </div>
      <label className="block text-sm font-medium text-slate-300 mb-3">
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
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none pr-12"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
        >
          {showApiKey ? "Hide" : "Show"}
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
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-slate-300">
          Model <span className="text-red-400">*</span>
        </label>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh Models"}
        </button>
      </div>

      {error && <ErrorMessage error={error} isCloudUrl={isCloudUrl} />}

      {models.length > 0 ? (
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="text-sm text-slate-500 p-3 bg-slate-900 rounded-lg border border-slate-700">
          {loading
            ? "Fetching available models..."
            : "No models found. Make sure Ollama is running and has models installed."}
        </div>
      )}

      <div className="text-xs text-slate-500 mt-2 space-y-1">
        <p>
          Install models with:{" "}
          <code className="text-slate-400">ollama pull gemma3</code>
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
