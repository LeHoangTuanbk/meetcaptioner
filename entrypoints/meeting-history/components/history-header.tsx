import { StorageIndicator } from "./storage-indicator";

type Props = {
  meetingCount: number;
  bytesUsed: number;
  quota: number;
  onOpenSettings: () => void;
};

export const HistoryHeader = ({
  meetingCount,
  bytesUsed,
  quota,
  onOpenSettings,
}: Props) => (
  <header className="mb-6 flex items-center justify-between">
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-white">
        Meeting History
      </h1>
      <p className="text-sm text-slate-400">
        {meetingCount} meeting{meetingCount !== 1 ? "s" : ""} saved
      </p>
    </div>
    <div className="flex items-center gap-4">
      <StorageIndicator bytesUsed={bytesUsed} quota={quota} />
      <button
        type="button"
        onClick={onOpenSettings}
        className="cursor-pointer rounded-lg bg-slate-800 px-4 py-2 text-sm transition-colors hover:bg-slate-700"
      >
        Settings
      </button>
    </div>
  </header>
);
