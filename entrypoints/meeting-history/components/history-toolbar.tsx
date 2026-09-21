import { useRef } from "react";

type Props = {
  searchQuery: string;
  isHistoryAvailable: boolean;
  onSearchChange: (value: string) => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
  onClear: () => void;
};

export const HistoryToolbar = ({
  searchQuery,
  isHistoryAvailable,
  onSearchChange,
  onBackup,
  onRestore,
  onClear,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-6 flex items-center gap-3">
      <input
        type="text"
        placeholder="Search captions..."
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-slate-600 focus:outline-none"
      />
      {isHistoryAvailable && (
        <button
          type="button"
          onClick={onBackup}
          className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm hover:bg-emerald-500"
        >
          Backup JSON
        </button>
      )}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
      >
        Restore JSON
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onRestore(file);
          event.target.value = "";
        }}
      />
      {isHistoryAvailable && (
        <button
          type="button"
          onClick={onClear}
          className="cursor-pointer rounded-lg bg-red-900/50 px-4 py-2 text-sm text-red-300 hover:bg-red-800/50"
        >
          Clear All
        </button>
      )}
    </div>
  );
};
