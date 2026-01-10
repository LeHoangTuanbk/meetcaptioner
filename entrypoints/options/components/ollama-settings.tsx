import { useState, useEffect, useCallback } from "react";

interface OllamaModel {
  id: string;
  name: string;
}

interface OllamaSettingsProps {
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
  onBaseUrlChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onModelChange: (value: string) => void;
}

/**
 * Ollama settings component for configuring base URL, API key, and model selection.
 * Supports both local Ollama instances and Ollama Cloud API.
 */
export function OllamaSettings({
  baseUrl,
  apiKey,
  selectedModel,
  onBaseUrlChange,
  onApiKeyChange,
  onModelChange,
}: OllamaSettingsProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Determine if using Ollama Cloud based on URL */
  const isCloudUrl = baseUrl.includes("ollama.com");

  /** Fetch available models from Ollama instance */
  const fetchModels = useCallback(async () => {
    if (!baseUrl) return;

    // For cloud URL, require API key before fetching
    if (isCloudUrl && !apiKey) {
      setModels([]);
      setError("API key required for Ollama Cloud");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({
        action: "getOllamaModels",
        baseUrl,
        apiKey: isCloudUrl ? apiKey : undefined,
      });

      if (response?.success && response.models) {
        setModels(response.models);
        // Auto-select first model if none selected
        if (!selectedModel && response.models.length > 0) {
          onModelChange(response.models[0].id);
        }
      } else {
        setError(response?.error || "Failed to fetch models");
        setModels([]);
      }
    } catch {
      setError("Failed to connect to Ollama");
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey, isCloudUrl, selectedModel, onModelChange]);

  // Fetch models when baseUrl changes
  useEffect(() => {
    const timeoutId = setTimeout(fetchModels, 500);
    return () => clearTimeout(timeoutId);
  }, [fetchModels]);

  return (
    <div className="space-y-4">
      {/* Base URL Input */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Ollama Server URL <span className="text-red-400">*</span>
        </label>
        <input
          type="url"
          value={baseUrl}
          onChange={(e) => onBaseUrlChange(e.target.value)}
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

      {/* API Key Input (for Ollama Cloud) */}
      {isCloudUrl && (
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
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="Your Ollama Cloud API key"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none pr-12"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
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
      )}

      {/* Model Selection */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-slate-300">
            Model <span className="text-red-400">*</span>
          </label>
          <button
            type="button"
            onClick={fetchModels}
            disabled={loading}
            className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh Models"}
          </button>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
            <p>{error}</p>
            {error.includes("connect") && !isCloudUrl && (
              <div className="mt-2 pt-2 border-t border-red-500/20 text-xs space-y-2">
                <p className="font-medium">CORS Configuration Required:</p>
                <div className="text-red-300/80 space-y-1">
                  <p>
                    <span className="text-slate-400">CLI:</span>{" "}
                    <code className="bg-red-500/20 px-1 rounded">OLLAMA_ORIGINS="*" ollama serve</code>
                  </p>
                  <p>
                    <span className="text-slate-400">App:</span>{" "}
                    <code className="bg-red-500/20 px-1 rounded">launchctl setenv OLLAMA_ORIGINS "*"</code>
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
        )}

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
            Install models with: <code className="text-slate-400">ollama pull gemma3</code>
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
    </div>
  );
}
