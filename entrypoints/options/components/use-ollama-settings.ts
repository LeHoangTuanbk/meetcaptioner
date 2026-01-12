import { useState, useEffect, useCallback } from "react";

type OllamaModel = {
  id: string;
  name: string;
};

type UseOllamaSettingsParams = {
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
  onModelChange: (value: string) => void;
};

export function useOllamaSettings({
  baseUrl,
  apiKey,
  selectedModel,
  onModelChange,
}: UseOllamaSettingsParams) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCloudUrl = baseUrl.includes("ollama.com");

  const fetchModels = useCallback(async () => {
    if (!baseUrl) return;

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

  useEffect(() => {
    const timeoutId = setTimeout(fetchModels, 500);
    return () => clearTimeout(timeoutId);
  }, [fetchModels]);

  const toggleShowApiKey = () => setShowApiKey((prev) => !prev);

  return {
    showApiKey,
    toggleShowApiKey,
    models,
    loading,
    error,
    isCloudUrl,
    fetchModels,
  };
}
