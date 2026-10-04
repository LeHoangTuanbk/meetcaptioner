type ToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
};

export function Toggle({ enabled, onChange, label, description }: ToggleProps) {
  return (
    <div className="rounded-xl border border-(--mc-app-border) bg-(--mc-app-surface) p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg leading-5 font-medium text-(--mc-app-text-emphasis)">{label}</h3>
          {description && (
            <p className="mt-1 text-sm text-(--mc-app-text-secondary)">{description}</p>
          )}
        </div>
        <button
          onClick={() => onChange(!enabled)}
          role="switch"
          aria-checked={enabled}
          className={`relative h-6 w-12 cursor-pointer rounded-full transition-colors ${
            enabled ? "bg-(--mc-primary)" : "bg-(--mc-app-field-border)"
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
              enabled ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
