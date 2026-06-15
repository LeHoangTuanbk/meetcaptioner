import { useState } from "react";

type ApiKeyInputProps = {
  value: string;
  onChange: (value: string) => void;
  provider: "anthropic" | "openai" | "gemini" | "ollama";
};

const PROVIDER_META: Record<
  "anthropic" | "openai" | "gemini",
  { placeholder: string; name: string; guideUrl: string }
> = {
  anthropic: {
    placeholder: "sk-ant-...",
    name: "Anthropic",
    guideUrl:
      "https://pickaxe.co/post/how-to-get-your-claude-api-key-a-step-by-step-guide",
  },
  openai: {
    placeholder: "sk-proj-...",
    name: "OpenAI",
    guideUrl:
      "https://pickaxe.co/post/how-to-get-your-openai-api-key-a-step-by-step-guide",
  },
  gemini: {
    placeholder: "AIza...",
    name: "Gemini",
    guideUrl: "https://aistudio.google.com/app/apikey",
  },
};

export function ApiKeyInput({ value, onChange, provider }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  const meta = PROVIDER_META[provider as keyof typeof PROVIDER_META] ?? PROVIDER_META.openai;
  const { placeholder, name: providerName, guideUrl } = meta;

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <label className="block text-sm font-medium text-slate-300 mb-3">
        API Key <span className="text-red-400">*</span>
        <span className="text-slate-500 font-normal ml-2">
          ({providerName})
        </span>
      </label>
      <div className="relative">
        <input
          type={showKey ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none pr-12"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
        >
          {showKey ? "🙈" : "👁️"}
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-2 flex flex-col gap-1">
        <span>Your API key is stored locally and never shared. </span>
        <a
          href={guideUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 underline"
        >
          How to get your {providerName} API key →
        </a>
      </p>
    </div>
  );
}
