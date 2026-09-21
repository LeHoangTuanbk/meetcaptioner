import { STORAGE_WARNING_RATIO } from "../constants";

type Props = {
  bytesUsed: number;
  quota: number;
  onBackup: () => void;
};

export const StorageWarning = ({ bytesUsed, quota, onBackup }: Props) => {
  const usageRatio = quota > 0 ? bytesUsed / quota : 0;
  if (usageRatio < STORAGE_WARNING_RATIO) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
    >
      <span>
        Meeting history storage is almost full. Back up your data to avoid
        losing captions.
      </span>
      <button
        type="button"
        onClick={onBackup}
        className="ml-4 shrink-0 cursor-pointer rounded-md bg-amber-400 px-3 py-1.5 font-medium text-amber-950 hover:bg-amber-300"
      >
        Backup now
      </button>
    </div>
  );
};
