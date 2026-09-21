type WaveIndicatorProps = {
  active: boolean;
};

export function WaveIndicator({ active }: WaveIndicatorProps) {
  return (
    <div className="flex h-4 items-center gap-0.5" aria-label={active ? "Receiving captions" : "Idle"}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`h-1.5 w-[3px] rounded-full transition-colors ${
            active ? "mc-wave-bar-active bg-green-400" : "bg-white/30"
          }`}
          style={{ animationDelay: `${index * 150}ms` }}
        />
      ))}
    </div>
  );
}
