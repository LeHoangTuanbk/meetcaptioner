import { StorageIndicator } from "./storage-indicator";

type Props = {
  bytesUsed: number;
  quota: number;
  onOpenSettings: () => void;
};

export const HistoryHeader = ({ bytesUsed, quota, onOpenSettings }: Props) => (
  <header className="mb-6 flex items-center justify-between gap-6">
    <div>
      <h1 className="text-[30px] leading-8 font-semibold tracking-[-0.02em]">
        Meeting History
      </h1>
    </div>
    <div className="flex items-center gap-4">
      <StorageIndicator bytesUsed={bytesUsed} quota={quota} />
      <button
        type="button"
        onClick={onOpenSettings}
        className="h-9 cursor-pointer rounded-lg bg-(--mc-primary) px-4 text-sm font-medium transition-colors hover:bg-(--mc-primary-hover)"
      >
        Settings
      </button>
    </div>
  </header>
);
