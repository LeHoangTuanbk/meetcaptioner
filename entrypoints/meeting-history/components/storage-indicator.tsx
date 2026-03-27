interface StorageIndicatorProps {
  bytesUsed: number;
  quota: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export const StorageIndicator = ({ bytesUsed, quota }: StorageIndicatorProps) => {
  const percentage = (bytesUsed / quota) * 100;
  const isWarning = percentage >= 80;

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className={`text-sm font-medium ${isWarning ? "text-amber-400" : "text-slate-400"}`}>
          {formatBytes(bytesUsed)} / {formatBytes(quota)}
        </p>
        <p className="text-xs text-slate-500">Storage used</p>
      </div>
      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isWarning ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};
