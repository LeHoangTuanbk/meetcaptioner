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
  const percentage = quota > 0 ? (bytesUsed / quota) * 100 : 0;
  const isWarning = percentage >= STORAGE_WARNING_RATIO * 100;
  const isCritical = percentage >= 95;
  const statusClass = isCritical
    ? "text-red-400"
    : isWarning
      ? "text-amber-400"
      : "text-(--mc-app-text-secondary)";

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className={`text-base leading-5 font-medium ${statusClass}`}>
          {formatBytes(bytesUsed)} / {formatBytes(quota)}
        </p>
        <p className={`text-xs ${isWarning ? statusClass : "text-(--mc-app-text-secondary)"}`}>
          {isWarning ? "Storage almost full" : "Storage used"}
        </p>
      </div>
      <div className="h-2 w-24 overflow-hidden rounded-full bg-(--mc-secondary)">
        <div
          className={`h-full rounded-full transition-all ${
            isCritical
              ? "bg-red-500"
              : isWarning
                ? "bg-amber-500"
                : "bg-emerald-500"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};
import { STORAGE_WARNING_RATIO } from "../constants";
