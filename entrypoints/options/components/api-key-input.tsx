import { useState } from 'react';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  provider: 'anthropic' | 'openai';
}

export function ApiKeyInput({ value, onChange, provider }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  const placeholder = provider === 'anthropic' ? 'sk-ant-...' : 'sk-proj-...';
  const providerName = provider === 'anthropic' ? 'Anthropic' : 'OpenAI';

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <label className="block text-sm font-medium text-slate-300 mb-3">
        API Key <span className="text-red-400">*</span>
        <span className="text-slate-500 font-normal ml-2">({providerName})</span>
      </label>
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none pr-12"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
        >
          {showKey ? '🙈' : '👁️'}
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Your API key is stored locally and never shared
      </p>
    </div>
  );
}
