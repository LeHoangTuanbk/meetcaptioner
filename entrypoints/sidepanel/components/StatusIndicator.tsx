interface StatusIndicatorProps {
  connected: boolean;
}

export default function StatusIndicator({ connected }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-3 w-3 rounded-full ${
          connected ? "bg-green-500" : "bg-gray-500"
        }`}
      />
      <span className="text-xs text-gray-400">
        {connected ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
}
