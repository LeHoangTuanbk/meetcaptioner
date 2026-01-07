interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  optional?: boolean;
}

export function TextArea({ label, value, onChange, placeholder, hint, optional }: TextAreaProps) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <label className="block text-sm font-medium text-slate-300 mb-3">
        {label}
        {optional && <span className="text-slate-500 font-normal ml-2">(optional)</span>}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
      />
      {hint && <p className="text-xs text-slate-500 mt-2">{hint}</p>}
    </div>
  );
}
