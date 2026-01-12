type ToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
};

export function Toggle({ enabled, onChange, label, description }: ToggleProps) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-white">{label}</h3>
          {description && (
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          )}
        </div>
        <button
          onClick={() => onChange(!enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            enabled ? "bg-emerald-500" : "bg-slate-600"
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              enabled ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
