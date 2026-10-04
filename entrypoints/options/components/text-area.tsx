type TextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  optional?: boolean;
};

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  optional,
}: TextAreaProps) {
  return (
    <div className="rounded-xl border border-(--mc-app-border) bg-(--mc-app-surface) p-6">
      <label className="mb-3 block text-lg leading-5 font-medium text-(--mc-app-text-emphasis)">
        {label}
        {optional && (
          <span className="ml-1.5 text-xs font-normal text-(--mc-app-text-secondary)">(optional)</span>
        )}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="h-24 w-full resize-none rounded-lg border border-(--mc-app-field-border) bg-(--mc-app-canvas) px-4 py-3 text-sm leading-5 text-(--mc-app-text) placeholder:text-(--mc-app-text-secondary) hover:border-(--mc-app-field-hover) focus:border-blue-400 focus:outline-none"
      />
      {hint && <p className="mt-3 text-xs leading-4.5 text-(--mc-app-text-secondary)">{hint}</p>}
    </div>
  );
}
