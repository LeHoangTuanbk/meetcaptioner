import { useState } from "react";
import { ArrowRightIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import type { Provider } from "./types";

type ApiProvider = Exclude<Provider, "ollama">;

type Props = {
  value: string;
  onChange: (value: string) => void;
  provider: ApiProvider;
};

const PROVIDER_META: Record<
  ApiProvider,
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
  deepseek: {
    placeholder: "sk-...",
    name: "DeepSeek",
    guideUrl: "https://platform.deepseek.com/api_keys",
  },
};

export function ApiKeyInput({ value, onChange, provider }: Props) {
  const [showKey, setShowKey] = useState(false);

  const meta = PROVIDER_META[provider];
  const { placeholder, name: providerName, guideUrl } = meta;

  return (
    <div className="rounded-xl border border-(--mc-app-border) bg-(--mc-app-surface) p-6">
      <label className="mb-3 flex items-baseline gap-1.5 text-lg leading-5 font-medium text-(--mc-app-text-emphasis)">
        API Key <span className="text-red-400">*</span>
        <span className="text-xs font-normal text-(--mc-app-text-secondary)">
          ({providerName})
        </span>
      </label>
      <div className="relative">
        <input
          type={showKey ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-lg border border-(--mc-app-field-border) bg-(--mc-app-canvas) px-4 pr-12 text-sm text-(--mc-app-text) placeholder:text-(--mc-app-text-secondary) hover:border-(--mc-app-field-hover) focus:border-blue-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          aria-label={showKey ? "Hide API key" : "Show API key"}
          className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-white hover:bg-white/10"
        >
          {showKey ? <EyeSlashIcon className="size-6" /> : <EyeIcon className="size-6" />}
        </button>
      </div>
      <p className="mt-3 flex flex-col gap-1 text-xs leading-4.5 text-(--mc-app-text-secondary)">
        <span>Your API key is stored locally and never shared. </span>
        <a
          href={guideUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-(--mc-positive) hover:underline"
        >
          <span className="inline-flex items-center gap-1">
            How to get your {providerName} API key
            <ArrowRightIcon className="size-3.5" />
          </span>
        </a>
      </p>
    </div>
  );
}
