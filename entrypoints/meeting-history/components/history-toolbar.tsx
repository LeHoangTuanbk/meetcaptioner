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
    <div className="mb-4 flex items-center gap-3">
      <input
        type="text"
        placeholder="Search captions..."
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        className="flex-1 rounded-lg border border-(--mc-app-field-border) bg-(--mc-app-surface-solid) px-4 py-2 text-sm text-(--mc-app-text) placeholder:text-(--mc-app-text-secondary) hover:border-(--mc-app-field-hover) focus:border-blue-400 focus:outline-none"
      />
      {isHistoryAvailable && (
        <button
          type="button"
          onClick={onBackup}
          className="cursor-pointer rounded-lg bg-(--mc-primary) px-4 py-2 text-sm font-medium hover:bg-(--mc-primary-hover)"
        >
          Backup JSON
        </button>
      )}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-lg bg-(--mc-secondary) px-4 py-2 text-sm font-medium hover:bg-(--mc-secondary-hover)"
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
          className="cursor-pointer rounded-lg bg-(--mc-danger) px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
        >
          Clear All
        </button>
      )}
    </div>
  );
};
